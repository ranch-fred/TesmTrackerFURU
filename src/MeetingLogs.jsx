import React, { useMemo, useState } from 'react';
import { Plus, Search, CalendarDays, Users, ArrowUpRight, ArrowDownToLine, FileText, GitBranch, Orbit, NotebookPen, X } from 'lucide-react';
import './meetings.css';
import MeetingAnimation from './MeetingAnimation';

function meetingDate(value, options = { month: 'long', day: 'numeric', year: 'numeric' }) {
  const date = new Date(`${value}T12:00:00`);
  return !value || Number.isNaN(date.getTime()) ? 'Undated meeting' : date.toLocaleDateString(undefined, options);
}
function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('');
}

export default function MeetingLogs({ records, actions, canCreate, onCreate, onExport, error }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [oldest, setOldest] = useState(false);
  const meetings = useMemo(() => [...records].filter((r) =>
    [r.date, r.summary, r.decisions, ...(r.attendees || [])].join(' ').toLowerCase().includes(search.toLowerCase()),
  ).sort((a, b) => (oldest ? 1 : -1) * (a.date || '').localeCompare(b.date || '')), [records, search, oldest]);
  const selected = meetings.find((r) => r.id === selectedId) || meetings[0];
  const people = new Set(records.flatMap((r) => r.attendees || [])).size;
  const decisions = (selected?.decisions || '').split('\n').map((line) => line.trim()).filter(Boolean);

  return (
    <section className="meet-page" aria-label="Meeting command center">
      <header className="meet-hero">
        <div className="meet-hero-content">
          <div className="meet-eyebrow"><span /> TEAM MEMORY / MEETING ARCHIVE</div>
          <h2>Good conversations.<br /><em>Clear direction.</em></h2>
          <p>Capture the room. Keep the decisions. Move forward together.</p>
          <div className="meet-hero-actions">{canCreate && <button className="primary" onClick={onCreate}><Plus size={16} /> Log a meeting</button>}<button className="outline" onClick={() => onExport(meetings)}><ArrowDownToLine size={15} /> Export logs</button></div>
        </div>
        <div className="meet-hero-visual">
          <MeetingAnimation />
          <div className="meet-telemetry"><span><b>{String(records.length).padStart(2, '0')}</b>MEETINGS LOGGED</span><span><b>{String(people).padStart(2, '0')}</b>PEOPLE INVOLVED</span></div>
        </div>
      </header>

      <div className="meet-console">
        <aside className="meet-archive" aria-label="Meeting archive">
          <div className="meet-archive-heading"><span><NotebookPen size={15} /> SESSION ARCHIVE</span><b>{meetings.length}</b></div>
          <div className="meet-search"><Search size={15} aria-hidden="true" /><input aria-label="Search meeting logs" placeholder="Find a meeting…" value={search} onChange={(e) => setSearch(e.target.value)} />{search && <button aria-label="Clear meeting search" onClick={() => setSearch('')}><X size={13} /></button>}</div>
          <button className="meet-order" onClick={() => setOldest((value) => !value)} aria-label={`Sort meetings ${oldest ? 'newest' : 'oldest'} first`}><CalendarDays size={12} />{oldest ? 'Oldest first' : 'Newest first'}<span>↕</span></button>
          <div className="meet-session-list" role="group" aria-label="Choose a meeting">
            {meetings.map((r) => <button key={r.id} className="meet-session" aria-pressed={r.id === selected?.id} onClick={() => setSelectedId(r.id)}><span className="meet-timeline-dot" /><span className="meet-session-text"><time dateTime={r.date || undefined}>{meetingDate(r.date, { month: 'short', day: 'numeric', year: 'numeric' })}</time><strong>{r.summary || 'Meeting notes'}</strong><small><Users size={11} /> {r.attendees?.length || 0} attendees</small></span><ArrowUpRight size={14} /></button>)}
          </div>
          {!meetings.length && <p className="meet-archive-empty">{search ? 'No matching meetings.' : 'Your meeting history starts here.'}</p>}
          <div className="meet-archive-foot"><span /> A shared record of the way forward.</div>
        </aside>

        <div className="meet-detail" aria-live="polite">
          {error && <p className="error" role="alert">{error}</p>}
          {selected ? <>
            <div className="meet-detail-top"><div className="meet-eyebrow"><span /> MEETING RECORD</div>{actions(selected)}</div>
            <div className="meet-date-heading"><div className="meet-date-icon"><CalendarDays size={23} strokeWidth={1.3} /></div><div><h3>{meetingDate(selected.date)}</h3><p>{meetingDate(selected.date, { weekday: 'long' })} <span>/</span> Team meeting</p></div></div>

            <section className="meet-crew" aria-label="Meeting attendees"><div className="meet-section-label"><Users size={14} /><h4>In the room</h4><span>{selected.attendees?.length || 0}</span></div><div className="meet-people">{selected.attendees?.length ? selected.attendees.map((name) => <span className="meet-person" key={name}><b aria-hidden="true">{initials(name)}</b>{name}</span>) : <p className="meet-muted">No attendees recorded.</p>}</div></section>

            <div className="meet-notes-grid">
              <section className="meet-summary"><div className="meet-note-heading"><span className="meet-note-icon"><FileText size={19} /></span><div><span className="meet-eyebrow">01 / THE CONVERSATION</span><h4>Meeting summary</h4></div></div><p className="meet-prose">{selected.summary || 'No summary recorded for this meeting.'}</p><div className="meet-note-rule" aria-hidden="true"><span /><span /><span /></div></section>
              <section className="meet-decisions"><div className="meet-note-heading"><span className="meet-note-icon"><GitBranch size={19} /></span><div><span className="meet-eyebrow">02 / THE DIRECTION</span><h4>Decisions made</h4></div></div>{decisions.length ? <ol>{decisions.map((decision, i) => <li key={i}><span>{String(i + 1).padStart(2, '0')}</span><p>{decision}</p></li>)}</ol> : <p className="meet-muted">No decisions recorded for this meeting.</p>}<div className="meet-decision-footer"><GitBranch size={12} /> Shared understanding. Next steps in focus.</div></section>
            </div>
            <div className="meet-detail-footer"><span><Orbit size={13} /> TEAM KNOWLEDGE, KEPT TOGETHER</span><span>END OF RECORD <span aria-hidden="true">⌁</span></span></div>
          </> : <div className="meet-empty"><div><NotebookPen size={36} strokeWidth={1} /></div><span className="meet-eyebrow">READY WHEN YOUR TEAM IS</span><h3>{search ? 'No meetings on this frequency.' : 'Every meeting deserves a record.'}</h3><p>{search ? 'Try another date, attendee, or keyword.' : 'A date, the people, what happened, and what you decided. Keep it all here.'}</p>{search ? <button className="outline" onClick={() => setSearch('')}>Clear search</button> : canCreate && <button className="primary" onClick={onCreate}><Plus size={16} /> Log your first meeting</button>}</div>}
        </div>
      </div>
    </section>
  );
}
