import React, { useEffect, useState } from 'react';
import { CloudDownload, ExternalLink, RefreshCw } from 'lucide-react';
import { canEdit } from './domain';
import { SEASONS, teamSeason, toMatchRecord } from './ftcscout-api';

// Live official data for the signed-in team from FTC Scout, with a one-click
// import into the team's Matches log (already-imported matches are skipped).
export default function FtcScout({ w }) {
  const [number, setNumber] = useState(String(w.team.number || '').replace(/\D/g, ''));
  const [season, setSeason] = useState(SEASONS[0].year);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const editor = canEdit(w.member.role, w.member.mentor_edit);

  useEffect(() => {
    if (!number) return;
    let live = true;
    setBusy(true);
    setError('');
    teamSeason(number, season)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message || 'Could not reach FTC Scout.'))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
  }, [number, season]);

  const known = new Set(w.data.matches.map((m) => m.ftcScoutId).filter(Boolean));
  const fresh = (data?.matches || []).filter((m) => m.played && !known.has(m.ftcScoutId));

  async function importAll() {
    setError('');
    try {
      for (let i = 0; i < fresh.length; i++) {
        setSaving(`${i + 1} / ${fresh.length}`);
        await w.save('matches', toMatchRecord(fresh[i]));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving('');
    }
  }

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow subtle">LIVE / FTC SCOUT</span>
            <h2>Official results for team {number || '—'}</h2>
          </div>
          {number && (
            <a className="outline small" href={`https://ftcscout.org/teams/${number}?season=${season}`} target="_blank" rel="noreferrer">
              Open <ExternalLink size={13} />
            </a>
          )}
        </div>
        <div className="inline" style={{ padding: '0 24px 20px' }}>
          <input aria-label="FTC team number" inputMode="numeric" style={{ width: 130 }} value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))} placeholder="Team #" />
          <select aria-label="Season" value={season} onChange={(e) => setSeason(Number(e.target.value))}>
            {SEASONS.map((s) => (
              <option key={s.year} value={s.year}>{s.name}</option>
            ))}
          </select>
          {editor && (
            <button className="primary" disabled={!fresh.length || !!saving} onClick={importAll}>
              {saving ? <RefreshCw size={15} className="spin" /> : <CloudDownload size={15} />}
              {saving ? `Importing ${saving}` : fresh.length ? `Import ${fresh.length} new match${fresh.length === 1 ? '' : 'es'}` : 'All matches imported'}
            </button>
          )}
          <small className="muted">Imported matches land in Matches with the official score, partner and result.</small>
        </div>
        {error && <p className="error notice" role="alert" style={{ margin: '0 24px 20px' }}>{error}</p>}
      </section>

      {busy && !data ? (
        <p className="muted" style={{ padding: 20 }}><span className="gear-spin" aria-hidden="true" /> Fetching from FTC Scout…</p>
      ) : data && (
        <>
          <div className="scout-events">
            {data.events.map((e) => (
              <section key={e.code} className="panel scout-event">
                <span className="eyebrow subtle">{e.code} · {e.type}</span>
                <h3>{e.name}</h3>
                <small className="muted">{e.start} · {e.city}</small>
                {e.stats ? (
                  <div className="scout-stats">
                    <div><b>{e.stats.rank || '—'}</b><small>RANK</small></div>
                    <div><b>{e.stats.wins}-{e.stats.losses}-{e.stats.ties}</b><small>W-L-T</small></div>
                    <div><b>{e.stats.avg?.totalPoints != null ? Math.round(e.stats.avg.totalPoints) : '—'}</b><small>AVG PTS</small></div>
                  </div>
                ) : (
                  <p className="muted">No ranking yet for this event.</p>
                )}
              </section>
            ))}
            {!data.events.length && <p className="muted">FTC Scout lists no events for team {number} this season yet.</p>}
          </div>
          {data.matches.length > 0 && (
            <section className="panel">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Event</th><th>Match</th><th>Alliance</th><th>Partner</th><th>Score</th><th>Result</th><th>In log</th></tr>
                  </thead>
                  <tbody>
                    {data.matches.map((m) => (
                      <tr key={m.ftcScoutId}>
                        <td>{m.date}</td>
                        <td>{m.event}</td>
                        <td className="money">{m.type === 'Qualification' ? 'Q' : 'P'}{m.number}</td>
                        <td className={m.alliance === 'Red' ? 'alliance-red' : 'alliance-blue'}>{m.alliance}</td>
                        <td className="money">{m.partner}</td>
                        <td className="money">{m.played ? `${m.points}–${m.opponentPoints}` : 'not played'}</td>
                        <td>{m.result ? <span className={`scout-result ${m.result}`}>{m.result}</span> : '—'}</td>
                        <td>{known.has(m.ftcScoutId) ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
