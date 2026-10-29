import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import './tour.css';

// `click` steps wait for the person to press the highlighted item (the real
// button still works underneath), the others advance with Next.
const STEPS = [
  {
    title: 'Welcome to your team workspace',
    body: 'This 1-minute tour shows where things live. You can leave at any time and replay it later.',
  },
  {
    target: 'nav-dashboard',
    click: true,
    title: 'Home',
    body: 'Your balance, open tasks and next competition. Click Home to try it.',
  },
  {
    target: 'nav-tasks',
    click: true,
    title: 'Tasks',
    body: 'See who is doing what. Click Tasks to open the board.',
  },
  {
    target: 'nav-roster',
    click: true,
    title: 'Team roster',
    body: 'Everyone on the team, with their role and sub-teams. Click Team roster.',
  },
  {
    target: 'nav-finance',
    click: true,
    title: 'Funds',
    body: 'Money in and money out. Click Funds to open it.',
  },
  {
    target: 'finance-add',
    optional: true,
    title: 'Add money in or out',
    body: 'Use these buttons to record funding or an expense. They sit at the top so they never cover your numbers.',
  },
  {
    target: 'nav-outreach',
    click: true,
    title: 'Logs',
    body: 'Build, programming and outreach logs are one click away. Click Outreach log.',
  },
  {
    target: 'nav-more',
    title: 'More',
    body: 'Meeting notes, design ideas, purchase requests and other less-used pages are tucked in here.',
  },
  {
    target: 'nav-settings',
    title: 'Settings',
    body: 'Invite teammates, manage members, change the theme and more.',
  },
  {
    target: 'tour-replay',
    title: 'Need this again?',
    body: 'Press this button any time to replay the tour. It is also in Settings, under Preferences.',
  },
];

const PAD = 6;
const mobile = () => window.matchMedia('(max-width: 680px)').matches;

export default function Tour({ onClose, openMenu, closeMenu }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const card = useRef(null);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const next = () => (last ? onClose() : setI((n) => n + 1));
  const back = () => setI((n) => Math.max(0, n - 1));

  // keep the sidebar open on phones for sidebar steps, closed otherwise
  useEffect(() => {
    if (step.target?.startsWith('nav-')) openMenu();
    else closeMenu();
  }, [i]);

  // find and follow the highlighted element; skip an optional step whose target never appears
  useLayoutEffect(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    let tries = 0;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) {
        setRect(null);
        if (++tries > 8 && step.optional) next();
        return;
      }
      if (tries++ === 0) el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const timer = setInterval(measure, 250);
    return () => clearInterval(timer);
  }, [i]);

  // advance when the highlighted control is pressed
  useEffect(() => {
    if (!step.click) return;
    const onClick = (e) => {
      if (e.target.closest?.(`[data-tour="${step.target}"]`)) setTimeout(next, 350);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [i]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => card.current?.focus({ preventScroll: true }), [i]);

  let style;
  if (rect && !mobile()) {
    const w = 320,
      roomRight = window.innerWidth - (rect.left + rect.width) - 24 >= w;
    style = {
      left: roomRight ? rect.left + rect.width + 18 : Math.max(16, rect.left - w - 18),
      top: Math.min(Math.max(16, rect.top), window.innerHeight - 260),
    };
  }
  return (
    <div className="tour" role="presentation">
      {rect ? (
        <div
          className="tour-ring"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      ) : (
        <div className="tour-dim" />
      )}
      <section
        ref={card}
        tabIndex={-1}
        className={`tour-card ${rect ? '' : 'centered'}`}
        style={style}
        role="dialog"
        aria-label={`Tutorial: ${step.title}`}
      >
        <button className="tour-x" onClick={onClose} aria-label="Close tutorial">
          <X size={16} />
        </button>
        <small>
          Step {i + 1} of {STEPS.length}
        </small>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="tour-actions">
          <button className="text-button" onClick={onClose}>
            Skip tour
          </button>
          <span>
            {i > 0 && (
              <button className="outline small" onClick={back}>
                Back
              </button>
            )}
            <button className="primary small" onClick={next}>
              {last ? 'Finish' : step.click ? 'Skip step' : 'Next'} <ArrowRight size={14} />
            </button>
          </span>
        </div>
      </section>
    </div>
  );
}
