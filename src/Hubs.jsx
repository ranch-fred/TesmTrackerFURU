import React, { useState } from 'react';
import Records from './Records';
import { Matches, Events } from './Views';
import PracticeMatches from './PracticeMatches';
import PillTabs from './PillTabs';
import FtcScout from './FtcScout';
import { AttendanceCalendar } from './AttendanceCalendar';

export function AttendanceHub({ w }) {
  return (
    <>
      <div className="page-intro compact-intro">
        <div className="eyebrow">TEAM / ATTENDANCE</div>
        <h1>
          SHOW UP. <span>BUILD TOGETHER.</span>
        </h1>
        <p>Check in on team days and track your time together.</p>
      </div>
      <AttendanceCalendar w={w} />
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
