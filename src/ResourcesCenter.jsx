import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Records from './Records';

const groups = [
  {
    title: 'BIOBUZZ 2026–27 · official rules',
    links: [
      [
        'Competition manual (current HTML)',
        'https://ftc-resources.firstinspires.org/ftc/game/cm-html',
        'Read the current rules, including inspection and robot construction',
      ],
      [
        'Game & season updates',
        'https://ftc-resources.firstinspires.org/ftc/game',
        'Manual revisions, team updates, Q&A, and season materials',
      ],
      [
        'Inspection checklist (PDF)',
        'https://ftc-resources.firstinspires.org/ftc/archive/2027/event/inspection-check',
        'The 2026–27 FIRST self-inspection sheet',
      ],
      [
        'Inspection quick reference (PDF)',
        'https://ftc-resources.firstinspires.org/ftc/archive/2027/event/inspection-reference',
        'Motor, servo, battery, and control system references',
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
    title: 'Build, CAD, and hardware',
    links: [
      [
        'Team resources',
        'https://ftc-resources.firstinspires.org/ftc/archive/2027/team',
        'Inspection, robot, and team materials',
      ],
      [
        'Control & Expansion Hub wiring',
        'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/connecting_devices/index.html',
        'How to connect motors, servos, and sensors',
      ],
      [
        'REV Control Hub specifications',
        'https://docs.revrobotics.com/duo-control/control-system-overview/control-hub-basics',
        'Port types and electrical details from REV',
      ],
      [
        'Playing field CAD & drawings',
        'https://ftc-resources.firstinspires.org/ftc/archive/2027/field',
        'Official field models for design and testing',
      ],
    ],
  },
  {
    title: 'Programming and autonomous',
    links: [
      [
        'Pedro Pathing documentation',
        'https://pedropathing.com/docs',
        'Community-built FTC path planning and following library',
      ],
      [
        'FTC Robot Controller SDK',
        'https://github.com/FIRST-Tech-Challenge/FtcRobotController',
        'Official source and releases for the FTC SDK',
      ],
      [
        'FTC Docs',
        'https://ftc-docs.firstinspires.org/en/latest/',
        'Programming and control system documentation',
      ],
      [
        'Programming resources',
        'https://www.firstinspires.org/resources/library/ftc/programming-resources',
        'FIRST programming resource library',
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
