import React from 'react';
import { HeartHandshake, CalendarDays, Users } from 'lucide-react';
import Records from './Records';
import { Stat } from './Views';
import { sum } from './domain';
import { LogEntry } from './LogEntry';

export default function OutreachLog({ w }) {
  const rows = w.data.outreach || [];
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">LOG / OUTREACH LOG</div>
        <h1>
          MAKE AN <span>IMPACT.</span>
        </h1>
        <p>
          Record every outreach event, when it happened, who it reached, and what your team gained.
        </p>
      </div>
      <div className="stats-grid">
        <Stat
          label="OUTREACHES DONE"
          value={rows.length}
          note="Events recorded"
          icon={HeartHandshake}
          tone="accent"
        />
        <Stat
          label="TEAM HOURS"
          value={sum(rows, 'hours')}
          note="Hours logged"
          icon={CalendarDays}
        />
        <Stat
          label="PEOPLE REACHED"
          value={sum(rows, 'reached')}
          note="Community members reached"
          icon={Users}
        />
      </div>
      <LogEntry kind="outreach" w={w} />
      <Records kind="outreach" w={w} />
    </>
  );
}
