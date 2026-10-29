import { makeLogRecord } from './logs.js';

// A mechanism is a "subsystems" record. Its flow is
//   mechanism -> CAD -> build -> code parts -> programming
// CAD, build and programming entries are normal designs / build / programming
// records, so they also show up in the existing logs. They link back to the
// mechanism by id (and by name for entries written before the chart existed).
export const STAGES = [
  { id: 'mechanism', label: 'Mechanism' },
  { id: 'cad', label: 'CAD' },
  { id: 'build', label: 'Build' },
  { id: 'parts', label: 'Code parts' },
  { id: 'code', label: 'Programming' },
];
const LOG_KIND = { cad: 'designs', build: 'build', code: 'programming' };

export function linkedTo(rows = [], mech) {
  return rows.filter((r) =>
    r.mechanismId ? r.mechanismId === mech.id : r.subsystem && r.subsystem === mech.name,
  );
}

function status(count, done) {
  if (done) return 'done';
  return count ? 'active' : 'empty';
}

// everything the chart shows for one mechanism
export function mechanismSummary(mech, data) {
  const done = mech.done || {};
  const cad = linkedTo(data.designs, mech),
    build = linkedTo(data.build, mech),
    code = linkedTo(data.programming, mech),
    parts = mech.parts || [],
    hardware = linkedTo(data.hardware, mech);
  return {
    cad: { items: cad, status: status(cad.length, done.cad) },
    build: { items: build, status: status(build.length, done.build) },
    parts: {
      items: parts,
      status: status(parts.length, done.parts || (parts.length && parts.every((p) => p.done))),
    },
    code: { items: code, status: status(code.length, done.code) },
    hardware,
    // the programmer is brought in once the build is finished
    readyForCode: !!done.build,
  };
}

// fixed grid so the connector lines can be computed without measuring the DOM
export const NODE = { w: 232, h: 118 };
const COL_GAP = 64,
  ROW_GAP = 28,
  PAD = 24,
  ROOT_W = 180;
export function layoutChart(rowCount) {
  const rows = Math.max(1, rowCount),
    pitch = NODE.h + ROW_GAP,
    height = rows * pitch - ROW_GAP + PAD * 2;
  const colX = (c) => PAD + ROOT_W + COL_GAP + c * (NODE.w + COL_GAP);
  const root = { x: PAD, y: height / 2 - 40, w: ROOT_W, h: 80 };
  const nodes = [];
  const links = [];
  const edge = (a, b, from) => {
    const x1 = a.x + a.w,
      y1 = a.y + a.h / 2,
      x2 = b.x,
      y2 = b.y + b.h / 2,
      mid = (x1 + x2) / 2;
    links.push({ d: `M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`, from });
  };
  for (let r = 0; r < rowCount; r++) {
    const y = PAD + r * pitch;
    let prev = root;
    STAGES.forEach((s, c) => {
      const n = { row: r, stage: s.id, x: colX(c), y, w: NODE.w, h: NODE.h };
      nodes.push(n);
      edge(prev, n, c === 0 ? { stage: 'root', row: r } : { stage: STAGES[c - 1].id, row: r });
      prev = n;
    });
  }
  return { root, nodes, links, width: colX(STAGES.length) - COL_GAP + PAD, height };
}

export function safeUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

// the record a "add log" form creates, linked to its mechanism
export function makeMechanismEntry(stage, mech, fields, member, userId) {
  const link = { mechanismId: mech.id, subsystem: mech.name };
  if (stage === 'cad') {
    const title = String(fields.title || '').trim();
    if (!title) throw Error('Name this CAD entry.');
    const cadLink = safeUrl(fields.link);
    if (fields.link && !cadLink) throw Error('Paste a full link that starts with https://');
    return {
      title,
      cadLink,
      description: String(fields.notes || '').trim(),
      proposedBy: member.name,
      loggedById: userId,
      stage: 'Prototype',
      ...link,
    };
  }
  if (stage === 'build')
    return {
      ...makeLogRecord('build', fields, member, userId),
      notes: String(fields.notes || '').trim(),
      ...link,
    };
  if (stage === 'code') {
    const github = safeUrl(fields.github);
    if (fields.github && !github) throw Error('Paste a full link that starts with https://');
    return {
      ...makeLogRecord('programming', fields, member, userId),
      github,
      snippet: String(fields.snippet || '').trim(),
      result: fields.result || 'Needs testing',
      ...link,
    };
  }
  throw Error('Unknown stage.');
}
export const logKind = (stage) => LOG_KIND[stage];
