import test from 'node:test';
import assert from 'node:assert/strict';
import {
  officialRules,
  inspectionGroups,
  remainingCapacity,
  hardwarePortName,
} from '../src/robot-rules.js';
import { validateCadFile, maxCadBytes } from '../src/cad.js';
import { legality } from '../src/domain.js';

test('BIOBUZZ limits match the current manual and calculate capacity', () => {
  assert.deepEqual(
    [
      officialRules.motors,
      officialRules.servos,
      officialRules.cube,
      officialRules.horizontalShort,
      officialRules.horizontal,
      officialRules.vertical,
      officialRules.weight,
    ],
    [8, 8, 18, 18, 24, 29, 0],
  );
  assert.equal(remainingCapacity(5, officialRules.motors), 3);
  assert.equal(remainingCapacity(9, officialRules.servos), -1);
  assert.equal(remainingCapacity('', officialRules.motors), null);
});

test('size check uses total expanded dimensions, not independent allowances', () => {
  const robot = {
    length: 18,
    width: 17,
    height: 18,
    horizontalShort: 18,
    horizontal: 24,
    vertical: 29,
    horizontalExtension: 10,
    verticalExtension: 15,
    motorsUsed: 6,
    servosUsed: 4,
  };
  const result = legality(robot, [], officialRules);
  assert.equal(result.pass, true);
  assert.equal(result.checks.length, 6);
  assert.equal(legality({ ...robot, horizontalShort: 19 }, [], officialRules).pass, false);
  assert.equal(legality({ ...robot, motorsUsed: 9 }, [], officialRules).pass, false);
});

test('inspection covers current official sections and hardware map reads old ports', () => {
  assert.ok(inspectionGroups.flatMap((group) => group.items).length >= 25);
  assert.equal(hardwarePortName({ kind: 'DC motor', port: 2 }), 'Motor 2');
  assert.equal(hardwarePortName({ kind: 'Servo', port: 'Servo 5' }), 'Servo 5');
  assert.equal(hardwarePortName({ kind: 'Sensor', port: 'I2C 3' }), 'I2C 3');
});

test('CAD accepts STEP and SolidWorks types with a 50 MB bound', () => {
  for (const name of [
    'part.step',
    'part.stp',
    'robot.SLDPRT',
    'robot.sldasm',
    'drawing.slddrw',
    'assembly.zip',
  ])
    assert.ok(validateCadFile({ name, size: 100 }));
  assert.throws(() => validateCadFile({ name: 'program.exe', size: 100 }), /STEP/);
  assert.throws(() => validateCadFile({ name: 'model.step', size: maxCadBytes + 1 }), /50 MB/);
});
