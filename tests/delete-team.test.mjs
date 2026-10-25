import test from 'node:test';
import assert from 'node:assert/strict';
import { removeTeamFiles } from '../src/delete-team.js';

test('removes files from nested team folders without touching other teams', async () => {
  const removed = [];
  const folders = {
    team1: [
      { name: 'member1', id: null },
      { name: 'member2', id: null },
    ],
    'team1/member1': [{ name: 'receipt.pdf', id: 'file1' }],
    'team1/member2': [{ name: 'photo.png', id: 'file2' }],
  };
  const client = {
    storage: {
      from(bucket) {
        assert.equal(bucket, 'team-files');
        return {
          async list(folder) {
            return { data: folders[folder] || [], error: null };
          },
          async remove(paths) {
            removed.push(...paths);
            return { data: [], error: null };
          },
        };
      },
    },
  };
  await removeTeamFiles(client, 'team1');
  assert.deepEqual(removed, ['team1/member1/receipt.pdf', 'team1/member2/photo.png']);
});

test('stops when storage cannot list files', async () => {
  const client = {
    storage: {
      from() {
        return {
          async list() {
            return { data: null, error: new Error('Storage unavailable') };
          },
          async remove() {
            throw new Error('Must not remove files after a listing failure');
          },
        };
      },
    },
  };
  await assert.rejects(removeTeamFiles(client, 'team1'), /Storage unavailable/);
});

test('lists and removes every page of a larger team folder', async () => {
  const entries = Array.from({ length: 101 }, (_, i) => ({ name: `${i}.pdf`, id: `${i}` }));
  const removed = [];
  const client = {
    storage: {
      from() {
        return {
          async list(_folder, { limit, offset }) {
            return { data: entries.slice(offset, offset + limit), error: null };
          },
          async remove(paths) {
            removed.push(paths);
            return { data: paths, error: null };
          },
        };
      },
    },
  };
  await removeTeamFiles(client, 'team1');
  assert.deepEqual(
    removed.map((batch) => batch.length),
    [100, 1],
  );
  assert.equal(removed.flat().length, 101);
});
