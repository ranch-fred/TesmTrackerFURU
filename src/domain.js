export const sum = (rows, key) => rows.reduce((n, r) => n + (Number(r[key]) || 0), 0);
export const money = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
export const uid = () => crypto.randomUUID();
export function canEdit(role, mentorEdit = false) {
  return ['Captain', 'Coach', 'Member'].includes(role) || (role === 'Mentor' && mentorEdit);
}
export function canDelete(role) {
  return ['Captain', 'Coach'].includes(role);
}
export function canView(role, type) {
  return (
    role !== 'Parent/Sponsor' ||
    ['dashboard', 'announcements', 'finance', 'resources'].includes(type)
  );
}
export function finance(data) {
  const received = sum(data.income || [], 'received'),
    spent = sum(data.expenses || [], 'amount');
  return { received, spent, balance: received - spent, pledged: sum(data.income || [], 'pledged') };
}
export function attendance(person, sessions) {
  const present = sessions.filter((s) => (s.attendees || []).includes(person));
  return {
    percent: sessions.length ? Math.round((100 * present.length) / sessions.length) : 0,
    hours: present.reduce((n, s) => {
      const a = new Date(`${s.date}T${s.start}`),
        b = new Date(`${s.date}T${s.end}`);
      return n + Math.max(0, (b - a) / 3600000 || 0);
    }, 0),
    streak: [...sessions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .findIndex((s) => !(s.attendees || []).includes(person)),
  };
}
export function legality(robot = {}, hardware = [], rules = {}) {
  if (!rules.verified) return { verified: false, checks: [] };
  const n = (v) => (v === undefined || v === null || v === '' ? NaN : Number(v));
  const checks = [
    ['DC motors', hardware.filter((h) => h.kind === 'DC motor').length, n(rules.motors)],
    ['Servos', hardware.filter((h) => h.kind === 'Servo').length, n(rules.servos)],
    [
      'Starting size',
      Math.max(...['length', 'width', 'height'].map((k) => n(robot[k]))),
      n(rules.cube),
    ],
    ['Horizontal envelope', n(robot.horizontal), n(rules.horizontal)],
    ['Vertical envelope', n(robot.vertical), n(rules.vertical)],
  ];
  if (rules.horizontalAllowance !== undefined)
    checks.push([
      'Horizontal allowance',
      n(robot.horizontalExtension),
      n(rules.horizontalAllowance),
    ]);
  if (rules.verticalAllowance !== undefined)
    checks.push(['Vertical allowance', n(robot.verticalExtension), n(rules.verticalAllowance)]);
  if (Number(rules.weight) > 0) checks.push(['Weight', n(robot.weight), n(rules.weight)]);
  const result = checks.map(([name, actual, max]) => ({
    name,
    actual: Number.isFinite(actual) ? actual : 'Missing',
    max: Number.isFinite(max) ? max : 'Missing',
    pass:
      Number.isFinite(actual) && Number.isFinite(max) && actual >= 0 && max >= 0 && actual <= max,
  }));
  return { verified: true, checks: result, pass: result.every((c) => c.pass) };
}
export function csvText(rows, fields) {
  const cell = (v) =>
    '"' +
    String(Array.isArray(v) ? v.join('; ') : (v ?? ''))
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return [
    fields.map((f) => cell(f.label)).join(','),
    ...rows.map((r) => fields.map((f) => cell(r[f.key])).join(',')),
  ].join('\r\n');
}
export function trend(data) {
  const dates = [
    ...new Set(
      [
        ...(data.expenses || []).map((r) => r.date),
        ...(data.income || []).map((r) => r.lastContact),
      ].filter(Boolean),
    ),
  ].sort();
  let raised = 0,
    spent = 0;
  return dates.map((date) => {
    raised += sum(
      (data.income || []).filter((r) => r.lastContact === date),
      'received',
    );
    spent += sum(
      (data.expenses || []).filter((r) => r.date === date),
      'amount',
    );
    return { date: date.slice(5), raised, spent, balance: raised - spent };
  });
}
