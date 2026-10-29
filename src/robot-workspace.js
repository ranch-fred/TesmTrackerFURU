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
  ['UART', 2],
  ['RS485', 2],
  ['Power', 2],
];
export function hubPort(type, index) {
  if (type === 'UART') return `UART ${index + 1}`;
  return `${type} ${['Digital', 'Analog'].includes(type) ? `${index * 2}/${index * 2 + 1}` : index}`;
}
export function portSize(type) {
  if (type === 'Motor') return [6.2, 8.2];
  if (type === 'Encoder') return [7, 4.2];
  if (type === 'Servo' || type === 'Power') return [5.9, 2.8];
  if (type === 'UART' || type === 'RS485') return [5.5, 3.7];
  return [6.4, 4.2];
}
// Coordinates follow the photographed connectors, in percentages of the image.
export function portPosition(hub, type, index) {
  const control = hub === 'Control Hub';
  if (control) {
    if (type === 'Encoder') return [9.4, 40.2 + index * 13.5];
    if (type === 'Motor') return [5.4, 33.8 + index * 13.5];
    if (type === 'Servo') return [22.5 + index * 7.1, 90.2];
    if (type === 'I2C') return [88.6, 51 - index * 4.9];
    if (type === 'Digital') return [88.6, 71.2 - index * 4.7];
    if (type === 'Analog') return [88.6, 82.3 - index * 4.6];
    if (type === 'UART') return [88.3, 20.5 - index * 4.8];
    if (type === 'RS485') return [88.3, 30.4 - index * 4.9];
    if (type === 'Battery') return [5.8 + index * 4.7, 21.6];
    return [68.4 + index * 7.1, 90.2];
  }
  if (type === 'Motor') return [5.2, 34.1 + index * 13.65];
  if (type === 'Encoder') return [9.4, 40.5 + index * 13.65];
  if (type === 'Servo') return [22.7 + index * 7, 91.35];
  if (type === 'I2C') return [88.95, 51.4 - index * 4.9];
  if (type === 'Digital') return [88.95, 72.3 - index * 4.94];
  if (type === 'Analog') return [88.95, 83.2 - index * 4.8];
  if (type === 'UART') return [88.3, 20.8 - index * 4.8];
  if (type === 'RS485') return [88.3, 30.7 - index * 4.9];
  if (type === 'Battery') return [5.8 + index * 4.7, 22.2];
  return [68.7 + index * 7.1, 91.35];
}
