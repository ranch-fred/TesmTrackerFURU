import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPractice, flowerPoints, practiceScore, timerStage } from '../src/practice-score.js';

test('one robot gets BIOBUZZ auto, teleop, and flower points without fouls', () => {
  const values = emptyPractice();
  values.autoLeave = true;
  values.autoPark = true;
  values.autoHiveTips = 2;
  values.teleHiveTips = 1;
  values.cellElements = 3;
  values.gardenElements = 4;
  values.telePark = true;
  values.flowers.redAllianceFlower = ['red', 'pollen', 'blue', 'red'];
  const score = practiceScore(values, 'both', 'Red');
  assert.equal(score.autoPoints, 48);
  assert.equal(score.telePoints, 48);
  assert.equal(score.total, 96);
  assert.equal(score.flowerBreakdown.redAllianceFlower.points, 13);
  assert.equal(practiceScore(values, 'auto', 'Red').total, 48);
  assert.equal(practiceScore(values, 'tele', 'Red').total, 48);
});

test('flower ownership uses top nectar and bonus uses bottom nectar', () => {
  assert.deepEqual(flowerPoints(['red', 'pollen', 'blue'], 'Red'), {
    owned: false, bottomBonus: 5, points: 5,
  });
  assert.equal(flowerPoints(['pollen', 'blue', 'pollen'], 'Blue').points, 11);
});

test('practice timer follows requested periods and transition boundaries', () => {
  assert.deepEqual(timerStage('both', 29), { name: 'AUTO', seconds: 1, done: false });
  assert.deepEqual(timerStage('both', 30), { name: 'TRANSITION', seconds: 8, done: false });
  assert.deepEqual(timerStage('both', 38), { name: 'TELEOP', seconds: 90, done: false });
  assert.deepEqual(timerStage('both', 128), { name: 'END GAME', seconds: 30, done: false });
  assert.deepEqual(timerStage('both', 158), { name: 'MATCH COMPLETE', seconds: 0, done: true });
  assert.equal(timerStage('tele', 90).name, 'END GAME');
  assert.equal(timerStage('auto', 30).done, true);
});
