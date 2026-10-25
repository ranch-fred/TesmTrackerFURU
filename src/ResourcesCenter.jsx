import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Records from './Records';

const groups = [
  {
    title: 'Current season',
    links: [
      [
        'Game & season hub',
        'https://ftc-resources.firstinspires.org/ftc/game',
        'Official manuals, updates, and season links',
      ],
      [
        'Official Q&A',
        'https://game-qa.firstinspires.org/boards/2027/FTC/QA',
        'Clarifications from FIRST',
      ],
      [
        'Field resources',
        'https://ftc-resources.firstinspires.org/ftc/archive/2027/field',
        'Field drawings, CAD, and setup',
      ],
    ],
  },
  {
    title: 'Build and program',
    links: [
      [
        'Team resources',
        'https://ftc-resources.firstinspires.org/ftc/archive/2027/team',
        'Inspection, robot, and team materials',
      ],
      [
        'FTC documentation',
        'https://ftc-docs.firstinspires.org/en/latest/',
        'Control system and software documentation',
      ],
      [
        'Programming resources',
        'https://www.firstinspires.org/resources/library/ftc/programming-resources',
        'Official programming library',
      ],
    ],
  },
  {
    title: 'Events and team',
    links: [
      [
        'Event resources',
        'https://ftc-resources.firstinspires.org/ftc/archive/2027/event',
        'Event guides and forms',
      ],
      ['FTC Events', 'https://ftc.events/', 'Schedules and results'],
      [
        'Team management resources',
        'https://www.firstinspires.org/resources/library/ftc/team-management-resources',
        'Team planning and administration',
      ],
    ],
  },
];

export default function ResourcesCenter({ w, initial = 'official' }) {
  const sponsor = w.member.role === 'Parent/Sponsor';
  const [tab, setTab] = useState(sponsor ? 'official' : initial);
  return (
    <>
      <div className="page-intro compact-intro">
        <div className="eyebrow">FTC / RESOURCE LIBRARY</div>
        <h1>
          FIND WHAT <span>YOU NEED.</span>
        </h1>
        <p>Official FIRST resources and your team's saved links.</p>
      </div>
      <div className="tabs page-tabs" role="tablist" aria-label="Resource sections">
        <button
          role="tab"
          aria-selected={tab === 'official'}
          className={tab === 'official' ? 'active' : ''}
          onClick={() => setTab('official')}
        >
          Official FTC links
        </button>
        {!sponsor && (
          <button
            role="tab"
            aria-selected={tab === 'team'}
            className={tab === 'team' ? 'active' : ''}
            onClick={() => setTab('team')}
          >
            Team links
          </button>
        )}
      </div>
      {tab === 'official' ? (
        <>
          <p className="note">
            Use the season hub for the latest manual and updates. FIRST may change individual
            documents during the season.
          </p>
          {groups.map((group) => (
            <section className="panel resource-group" key={group.title}>
              <h2>{group.title}</h2>
              <div className="resource-grid">
                {group.links.map(([title, url, description]) => (
                  <a
                    className="resource-link"
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>
                      {title}
                      <ArrowUpRight size={16} />
                    </strong>
                    <span>{description}</span>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </>
      ) : (
        <Records kind="resources" w={w} />
      )}
    </>
  );
}
