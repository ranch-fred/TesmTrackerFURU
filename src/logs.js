export function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function makeLogRecord(kind, { date, whatDone, place, gained }, member, userId) {
  const done = String(whatDone || '').trim();
  if (!done) throw Error('Tell the team what you did.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('Choose a date.');
  const base = { date, whatDone: done, loggedById: userId, author: member.name };
  if (kind === 'programming') return { ...base, notes: done, result: 'Needs testing' };
  if (kind === 'build') return base;
  if (kind === 'outreach') {
    if (!String(place || '').trim()) throw Error('Add the outreach place or venue.');
    return {
      ...base,
      name: `Outreach at ${String(place).trim()}`,
      place: String(place).trim(),
      impact: done,
      gained: String(gained || '').trim(),
      speaker: member.name,
    };
  }
  throw Error('Unknown log type.');
}

export function loggedToday(data, member, userId, date = localDate()) {
  return ['programming', 'build', 'outreach'].some((kind) =>
    (data[kind] || []).some(
      (entry) =>
        entry.date === date &&
        (entry.loggedById === userId ||
          (!entry.loggedById && (entry.author === member.name || entry.speaker === member.name))),
    ),
  );
}
