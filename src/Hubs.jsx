import React, { useState } from 'react';
import Records from './Records';
import { Matches, Events } from './Views';
import PracticeMatches from './PracticeMatches';
import PillTabs from './PillTabs';
import FtcScout from './FtcScout';
import { AttendanceCalendar, TeamRoster } from './AttendanceCalendar';

export function AttendanceHub({ w, initial = 'sessions' }) {
  const [tab, setTab] = useState(initial === 'roster' ? 'roster' : 'sessions');
  return (
    <>
      <div className="page-intro compact-intro">
        <div className="eyebrow">TEAM / PEOPLE</div>
        <h1>
          SHOW UP. <span>BUILD TOGETHER.</span>
        </h1>
        <p>Check in on team days and see everyone who joined through the app.</p>
      </div>
      <div className="tabs page-tabs" role="tablist" aria-label="Attendance sections">
        {[
          ['sessions', 'Attendance calendar'],
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
      {tab === 'sessions' ? <AttendanceCalendar w={w} /> : <TeamRoster w={w} />}
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
      <PillTabs
        label="Competition sections"
        value={tab}
        onChange={setTab}
        tabs={[
          ['matches', 'Matches', w.data.matches.length],
          ['scout', 'FTC Scout live'],
          ['practice', 'Practice matches'],
          ['events', 'Events & plans', w.data.events.length],
          ['packing', 'Packing checklist', w.data.packing.length],
        ]}
      />
      {tab === 'scout' ? (
        <FtcScout w={w} />
      ) : tab === 'matches' ? (
        <Matches w={w} embedded />
      ) : tab === 'practice' ? (
        <PracticeMatches w={w} />
      ) : tab === 'events' ? (
        <Events w={w} initial={['milestones', 'risks'].includes(initial) ? initial : 'events'} />
      ) : (
        <Records kind="packing" w={w} />
      )}
    </>
  );
}
