import React, { useState } from 'react';
import Records from './Records';
import { Matches, Events } from './Views';

export function AttendanceHub({ w, initial = 'sessions' }) {
  const [tab, setTab] = useState(initial);
  return (
    <>
      <div className="page-intro compact-intro">
        <div className="eyebrow">TEAM / PEOPLE</div>
        <h1>
          SHOW UP. <span>BUILD TOGETHER.</span>
        </h1>
        <p>Track sessions and keep the team roster in one place.</p>
      </div>
      <div className="tabs page-tabs" role="tablist" aria-label="Attendance sections">
        {[
          ['sessions', 'Attendance'],
          ['roster', 'Team roster'],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <Records key={tab} kind={tab} w={w} />
    </>
  );
}

export function CompetitionHub({ w, initial = 'matches' }) {
  const [tab, setTab] = useState(
    ['events', 'milestones', 'risks'].includes(initial) ? 'events' : initial,
  );
  return (
    <>
      <div className="page-intro compact-intro">
        <div className="eyebrow">COMPETITION / ONE WORKSPACE</div>
        <h1>
          READY FOR <span>THE FIELD.</span>
        </h1>
        <p>Matches, event plans, and packing belong together.</p>
      </div>
      <div className="tabs page-tabs" role="tablist" aria-label="Competition sections">
        {[
          ['matches', 'Matches'],
          ['events', 'Events & plans'],
          ['packing', 'Packing checklist'],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'matches' ? (
        <Matches w={w} embedded />
      ) : tab === 'events' ? (
        <Events w={w} initial={['milestones', 'risks'].includes(initial) ? initial : 'events'} />
      ) : (
        <Records kind="packing" w={w} />
      )}
    </>
  );
}
