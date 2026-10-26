// BIOBUZZ 2026–27 point values, FIRST Competition Manual §10.5 (TU05).
export const FLOWERS = [
  ['redAllianceFlower', 'Red alliance flower'],
  ['blueAllianceFlower', 'Blue alliance flower'],
  ['audienceFlower', 'Audience flower'],
  ['scoringFlower', 'Scoring flower'],
];

export const emptyPractice = () => ({
  autoLeave: false,
  autoPark: false,
  autoHiveTips: 0,
  teleHiveTips: 0,
  cellElements: 0,
  gardenElements: 0,
  telePark: false,
  flowers: Object.fromEntries(FLOWERS.map(([key]) => [key, []])),
});

const count = (value) => Math.max(0, Math.floor(Number(value) || 0));

export function flowerPoints(stack = [], alliance = 'Red') {
  const ownNectar = alliance === 'Blue' ? 'blue' : 'red';
  const nectars = stack.filter((item) => item !== 'pollen');
  const owned = nectars.at(-1) === ownNectar;
  const bottomBonus = nectars[0] === ownNectar ? 5 : 0;
  return { owned, bottomBonus, points: (owned ? 2 * stack.length : 0) + bottomBonus };
}

export function practiceScore(values, mode = 'both', alliance = 'Red') {
  const auto = mode !== 'tele';
  const tele = mode !== 'auto';
  const autoPoints = auto
    ? (values.autoLeave ? 3 : 0) + (values.autoPark ? 5 : 0) + 20 * count(values.autoHiveTips)
    : 0;
  const flowerBreakdown = Object.fromEntries(
    FLOWERS.map(([key]) => [key, flowerPoints(values.flowers?.[key], alliance)]),
  );
  const telePoints = tele
    ? 20 * count(values.teleHiveTips) +
      2 * count(values.cellElements) +
      count(values.gardenElements) +
      (values.telePark ? 5 : 0) +
      Object.values(flowerBreakdown).reduce((sum, flower) => sum + flower.points, 0)
    : 0;
  return { autoPoints, telePoints, total: autoPoints + telePoints, flowerBreakdown };
}

export function timerStage(mode, elapsedSeconds) {
  const stages = mode === 'auto'
    ? [['AUTO', 30]]
    : mode === 'tele'
      ? [['TELEOP', 90], ['END GAME', 30]]
      : [['AUTO', 30], ['TRANSITION', 8], ['TELEOP', 90], ['END GAME', 30]];
  let remaining = Math.max(0, Math.floor(elapsedSeconds));
  for (const [name, duration] of stages) {
    if (remaining < duration) return { name, seconds: duration - remaining, done: false };
    remaining -= duration;
  }
  return { name: 'MATCH COMPLETE', seconds: 0, done: true };
}
