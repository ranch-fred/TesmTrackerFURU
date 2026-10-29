import { entities } from './schema.js';
import { validateRobotCounts } from './robot-workspace.js';
export function parseCSV(text, fields) {
  const rows = [];
  let row = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quoted) throw Error('Unclosed quote in CSV.');
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  const headers = (rows.shift() || []).map((h) => h.replace(/^\uFEFF/, ''));
  if (!headers.length || headers.some((h) => !fields.some((f) => f.label === h || f.key === h)))
    throw Error('CSV headers must match the exported field labels.');
  return rows.map((r) =>
    Object.fromEntries(
      headers.map((h, i) => {
        const f = fields.find((f) => f.label === h || f.key === h);
        let v = r[i] ?? '';
        if (['number', 'score', 'percent'].includes(f.type)) v = Number(v);
        if (f.type === 'checkbox') v = /^(true|yes|1)$/i.test(v);
        if (['multi', 'members', 'parts', 'hardware'].includes(f.type))
          v = v ? v.split(';').map((s) => s.trim()) : [];
        return [f.key, v];
      }),
    ),
  );
}
export function validateImport(entries) {
  if (!entries || typeof entries !== 'object' || Array.isArray(entries))
    throw Error('Expected an object of record sections.');
  const result = {};
  let total = 0;
  for (const [kind, rows] of Object.entries(entries)) {
    if (!entities[kind] || !Array.isArray(rows)) throw Error(`Unknown or invalid section: ${kind}`);
    if (rows.length > 2000) throw Error('Maximum 2,000 rows per section.');
    result[kind] = rows.map((r) => {
      if (!r || typeof r !== 'object' || Array.isArray(r)) throw Error('Invalid record.');
      const clean = {};
      for (const f of entities[kind].fields) {
        const v = r[f.key];
        if (v === undefined) continue;
        if (['number', 'score', 'percent'].includes(f.type)) {
          if (typeof v !== 'number' || !Number.isFinite(v) || v < 0)
            throw Error(`Invalid ${f.label}`);
          if (f.type === 'score' && (v < 1 || v > 5)) throw Error(`Score must be 1–5: ${f.label}`);
          if (f.type === 'percent' && v > 100) throw Error(`Percentage exceeds 100: ${f.label}`);
        } else if (f.type === 'checkbox') {
          if (typeof v !== 'boolean') throw Error(`Invalid checkbox ${f.label}`);
        } else if (['multi', 'members', 'parts', 'hardware'].includes(f.type)) {
          if (!Array.isArray(v) || v.some((x) => typeof x !== 'string'))
            throw Error(`Invalid list ${f.label}`);
        } else if (kind === 'hardware' && f.key === 'port' && typeof v === 'number') {
          clean[f.key] = String(v);
          continue;
        } else if (typeof v !== 'string') throw Error(`Invalid text ${f.label}`);
        if (f.type === 'select' && !f.options.includes(v)) throw Error(`Invalid option ${f.label}`);
        clean[f.key] = v;
      }
      if (kind === 'robot') validateRobotCounts(clean);
      if (kind === 'hardware' && r.encoderConnected !== undefined) {
        if (typeof r.encoderConnected !== 'boolean') throw Error('Invalid motor encoder option.');
        clean.encoderConnected = r.encoderConnected;
      }
      if (['robot', 'hardware', 'inspection'].includes(kind)) {
        const key = r.robotKey || (kind === 'robot' ? r.id : undefined);
        if (key !== undefined) {
          if (typeof key !== 'string' || !key || key.length > 100)
            throw Error('Invalid robot association.');
          clean.robotKey = key;
        }
      }
      return clean;
    });
    total += rows.length;
  }
  if (total > 10000) throw Error('Maximum 10,000 rows per import.');
  if (result.robot?.[0]?.robotKey) {
    for (const kind of ['hardware', 'inspection'])
      for (const record of result[kind] || [])
        if (!record.robotKey) record.robotKey = result.robot[0].robotKey;
  }
  // Imports create new robots; remap their associations so a second import stays separate.
  const robotKeys = new Map();
  for (const robot of result.robot || []) {
    if (!robot.robotKey) continue;
    const previous = robot.robotKey;
    const next = crypto.randomUUID();
    if (robotKeys.has(previous)) throw Error('Duplicate robot association in import.');
    robotKeys.set(previous, next);
    robot.robotKey = next;
  }
  for (const kind of ['hardware', 'inspection'])
    for (const record of result[kind] || [])
      if (robotKeys.has(record.robotKey)) record.robotKey = robotKeys.get(record.robotKey);
  const counts = new Map();
  for (const record of result.hardware || []) {
    if (!record.name || !['DC motor', 'Servo'].includes(record.kind)) continue;
    const key = `${record.robotKey || 'legacy'}:${record.kind}`;
    const count = (counts.get(key) || 0) + 1;
    if (count > 8) throw Error('A robot cannot have more than 8 motors or 8 servos assigned.');
    counts.set(key, count);
  }
  return result;
}
