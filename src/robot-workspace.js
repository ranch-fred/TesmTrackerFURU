export const ACTUATOR_LIMIT = 8;
export function robotKey(robot) {
  return robot?.robotKey || robot?.id;
}
export function robotRecords(records, robot, firstRobot) {
  if (!robot) return [];
  const key = robotKey(robot);
  return records.filter((record) =>
    record.robotKey ? record.robotKey === key : robot.id === firstRobot?.id,
  );
}
export function validateRobotCounts(robot) {
  for (const [key, label] of [
    ['motorsUsed', 'Motors'],
    ['servosUsed', 'Servos'],
  ]) {
    if (robot[key] === undefined || robot[key] === '') continue;
    const value = Number(robot[key]);
    if (!Number.isInteger(value) || value < 0 || value > ACTUATOR_LIMIT)
      throw Error(`${label} must be a whole number from 0 to ${ACTUATOR_LIMIT}.`);
  }
}
export const PORT_GROUPS = [
  ['Motor', 4],
  ['Servo', 6],
  ['I2C', 4],
  ['Digital', 4],
  ['Analog', 2],
];
export function hubPort(type, index) {
  return `${type} ${['Digital', 'Analog'].includes(type) ? `${index * 2}/${index * 2 + 1}` : index}`;
}
// Coordinates follow the photographed connectors, in percentages of the image.
export function portPosition(hub, type, index) {
  const control = hub === 'Control Hub';
  if (control) {
    if (type === 'Motor') return [5.4, 33.8 + index * 13.5];
    if (type === 'Servo') return [22.5 + index * 7.1, 90.2];
    if (type === 'I2C') return [88.6, 51 - index * 4.9];
    if (type === 'Digital') return [88.6, 71.2 - index * 4.7];
    return [88.6, 82.3 - index * 4.6];
  }
  if (type === 'Motor') return [5.6, 32.6 + index * 17.5];
  if (type === 'Servo') return [22.2 + index * 7.2, 91.2];
  if (type === 'I2C') return [88.2, 55.8 - index * 5];
  if (type === 'Digital') return [88.2, 76.3 - index * 5];
  return [88.2, 87.2 - index * 5];
}
