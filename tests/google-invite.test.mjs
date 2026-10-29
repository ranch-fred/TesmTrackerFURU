import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../scripts/google-invite.gs', import.meta.url), 'utf8');

function app(quota = 100) {
  const sent = [];
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'secret' }) },
    MailApp: {
      getRemainingDailyQuota: () => quota,
      sendEmail: (...args) => sent.push(args),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({
        text,
        setMimeType() {
          return this;
        },
      }),
    },
    console,
  };
  runInNewContext(source, context);
  const send = (data) =>
    JSON.parse(context.doPost({ postData: { contents: JSON.stringify(data) } }).text);
  return { sent, send };
}

const valid = {
  secret: 'secret',
  email: 'member@example.com',
  teamName: 'Test Team',
  inviteUrl: 'https://tesm-tracker-furu.vercel.app/?invite=JOIN123',
};

test('Google invitation script sends one join email with the correct secret', () => {
  const { sent, send } = app();
  assert.equal(send(valid).ok, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0], valid.email);
  assert.match(sent[0][2], /\?invite=JOIN123/);
});

test('Google invitation script refuses wrong secrets, bad recipients, and exhausted quota', () => {
  const normal = app();
  assert.equal(normal.send({ ...valid, secret: 'wrong' }).ok, false);
  assert.equal(normal.send({ ...valid, email: 'not-an-email' }).ok, false);
  assert.equal(normal.sent.length, 0);
  const empty = app(0);
  assert.equal(empty.send(valid).ok, false);
  assert.equal(empty.sent.length, 0);
});
