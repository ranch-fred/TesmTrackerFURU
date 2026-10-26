// FTC Scout public REST API (https://ftcscout.org/api). CORS-enabled, no key.
const BASE = 'https://api.ftcscout.org/rest/v1';
export const SEASONS = [
  { year: 2026, name: '2026–27 BIOBUZZ' },
  { year: 2025, name: '2025–26 DECODE' },
];
const cache = new Map();

async function get(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(BASE + path);
  if (res.status === 404) return null;
  if (!res.ok) throw Error(`FTC Scout returned ${res.status}`);
  const value = await res.json();
  cache.set(path, value);
  return value;
}

export const getQuickStats = (n, season) => get(`/teams/${n}/quick-stats?season=${season}`);

const LEVEL = { Quals: 'Qualification', Playoff: 'Playoff', DoubleElim: 'Playoff', Finals: 'Playoff' };

/** Every event and match a team played in a season, in this app's match shape. */
export async function teamSeason(number, season) {
  const n = Number(number);
  const events = (await get(`/teams/${n}/events/${season}`)) || [];
  const out = { events: [], matches: [] };
  for (const te of events) {
    const [ev, ms] = await Promise.all([get(`/events/${season}/${te.eventCode}`), get(`/events/${season}/${te.eventCode}/matches`)]);
    out.events.push({ code: te.eventCode, name: ev?.name || te.eventCode, start: ev?.start, city: ev?.city, type: ev?.type, stats: te.stats });
    for (const m of ms || []) {
      const me = m.teams?.find((t) => t.teamNumber === n);
      if (!me) continue;
      const side = me.alliance;
      const ours = m.scores?.[side.toLowerCase()];
      const theirs = m.scores?.[side === 'Red' ? 'blue' : 'red'];
      out.matches.push({
        ftcScoutId: `${season}:${te.eventCode}:${m.id}`,
        event: ev?.name || te.eventCode,
        eventCode: te.eventCode,
        number: m.id,
        type: LEVEL[m.tournamentLevel] || 'Qualification',
        alliance: side,
        partner: m.teams.filter((t) => t.alliance === side && t.teamNumber !== n).map((t) => t.teamNumber).join(', '),
        opponents: m.teams.filter((t) => t.alliance !== side).map((t) => t.teamNumber).join(', '),
        date: (m.actualStartTime || m.scheduledStartTime || ev?.start || '').slice(0, 10),
        played: Boolean(m.hasBeenPlayed && ours),
        points: ours?.totalPoints ?? null,
        opponentPoints: theirs?.totalPoints ?? null,
        result: ours && theirs ? (ours.totalPoints > theirs.totalPoints ? 'W' : ours.totalPoints < theirs.totalPoints ? 'L' : 'T') : null,
      });
    }
  }
  out.matches.sort((a, b) => `${a.date}${String(a.number).padStart(4, '0')}`.localeCompare(`${b.date}${String(b.number).padStart(4, '0')}`));
  return out;
}

/** Fields saved into a `matches` record when importing. */
export function toMatchRecord(m) {
  return {
    ftcScoutId: m.ftcScoutId,
    event: `${m.event} (${m.eventCode})`,
    number: Number(m.number) || 0,
    type: m.type,
    alliance: m.alliance,
    partner: m.partner,
    date: m.date,
    points: m.points ?? 0,
    notes: `Official result via FTC Scout: ${m.points}–${m.opponentPoints} ${m.result === 'W' ? 'win' : m.result === 'L' ? 'loss' : 'tie'} vs ${m.opponents}.`,
  };
}
