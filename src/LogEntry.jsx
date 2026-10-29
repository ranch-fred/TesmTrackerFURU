import React, { useState } from 'react';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { canEdit } from './domain';
import { localDate, makeLogRecord } from './logs';
import Records from './Records';

export function LogEntry({ kind, w }) {
  const [date, setDate] = useState(localDate);
  const [whatDone, setWhatDone] = useState('');
  const [place, setPlace] = useState('');
  const [gained, setGained] = useState('');
  const [mechanismId, setMechanismId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  if (!canEdit(w.member.role, w.member.mentor_edit)) return null;
  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaved(false);
    try {
      const entry = makeLogRecord(kind, { date, whatDone, place, gained }, w.member, w.user.id);
      setBusy(true);
      const mech = w.data.subsystems.find((m) => m.id === mechanismId);
      await w.save(kind, mech ? { ...entry, mechanismId: mech.id, subsystem: mech.name } : entry);
      setWhatDone('');
      setPlace('');
      setGained('');
      setMechanismId('');
      setDate(localDate());
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel daily-log-panel">
      <div className="panel-heading">
        <h2>
          <CalendarDays size={19} /> Log this visit
        </h2>
      </div>
      <p>
        Each time you work with the team, record the date and what you did. Your name is added
        automatically.
      </p>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              disabled={busy}
            />
          </label>
          {kind === 'outreach' && (
            <label>
              Place / venue
              <input
                value={place}
                onChange={(event) => setPlace(event.target.value)}
                required
                disabled={busy}
                placeholder="Library, school, event…"
              />
            </label>
          )}
          {['build', 'programming'].includes(kind) && (
            <label>
              Mechanism
              <select
                value={mechanismId}
                onChange={(event) => setMechanismId(event.target.value)}
                disabled={busy}
              >
                <option value="">No mechanism</option>
                {w.data.subsystems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="span-2">
            What did you do?
            <textarea
              rows={3}
              value={whatDone}
              onChange={(event) => setWhatDone(event.target.value)}
              required
              disabled={busy}
              placeholder="Describe the work you completed today…"
            />
          </label>
          {kind === 'outreach' && (
            <label className="span-2">
              What did your team gain or learn? <span className="muted">(optional)</span>
              <textarea
                rows={2}
                value={gained}
                onChange={(event) => setGained(event.target.value)}
                disabled={busy}
              />
            </label>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="success" role="status">
            Your log entry was saved for the team.
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save log entry'} <ArrowUpRight size={15} />
        </button>
      </form>
    </section>
  );
}

export function LogPage({ kind, w }) {
  const title = kind === 'programming' ? 'Program log' : 'Build log';
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">LOG / {title.toUpperCase()}</div>
        <h1>
          {kind === 'programming' ? 'CODE. TEST.' : 'BUILD. IMPROVE.'} <span>LOG IT.</span>
        </h1>
        <p>Write down what you worked on each time you come to the team.</p>
      </div>
      <LogEntry kind={kind} w={w} />
      <Records kind={kind} w={w} />
    </>
  );
}
