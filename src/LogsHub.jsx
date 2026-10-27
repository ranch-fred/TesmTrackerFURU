import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Code2, Hammer, HeartHandshake, X } from 'lucide-react';
import { canView } from './domain';
import { LogPage } from './LogEntry';
import OutreachLog from './OutreachLog';
import PillTabs from './PillTabs';

const LOGS = [
  ['programming', 'Programming log', Code2, 'Code, tests and autonomous tuning'],
  ['build', 'Build log', Hammer, 'Mechanisms, assembly and repairs'],
  ['outreach', 'Outreach log', HeartHandshake, 'Events, demos and community'],
];

// One "Logs" page: a side-scrolling carousel of glass cards, one per log.
// Opening a card takes the log full screen, with a switcher to change logs.
export default function LogsHub({ w, initial }) {
  const logs = LOGS.filter(([kind]) => canView(w.member.role, kind));
  const [open, setOpen] = useState(logs.some(([k]) => k === initial) ? initial : null);
  const [active, setActive] = useState(Math.max(0, logs.findIndex(([k]) => k === initial)));
  const track = useRef(null);
  const cards = useRef([]);
  const closeButton = useRef(null);
  const lastCard = useRef(null);

  // the card nearest the middle of the track is the "active" one
  function onScroll() {
    const t = track.current;
    if (!t) return;
    const mid = t.scrollLeft + t.clientWidth / 2;
    let best = 0;
    cards.current.forEach((c, i) => {
      if (c && Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(cards.current[best].offsetLeft + cards.current[best].offsetWidth / 2 - mid)) best = i;
    });
    setActive(best);
  }
  function go(i) {
    const c = cards.current[Math.max(0, Math.min(logs.length - 1, i))];
    c?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    c?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!open) cards.current[active]?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('log-focus-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('log-focus-open');
    };
  }, [open]);

  function openLog(kind, card) {
    lastCard.current = card;
    setOpen(kind);
  }
  function close() {
    setOpen(null);
    requestAnimationFrame(() => lastCard.current?.focus());
  }

  const count = (kind) => (w.data[kind] || []).length;
  const lastDate = (kind) =>
    (w.data[kind] || []).map((r) => r.date).filter(Boolean).sort().at(-1);

  if (open) {
    const [, title] = LOGS.find(([k]) => k === open);
    // portalled to <body>: the page's motion wrapper keeps a transform,
    // which would trap a fixed overlay inside the main column
    return createPortal(
      <div className="log-focus" role="dialog" aria-modal="true" aria-label={title}>
        <header className="log-focus-bar">
          <button ref={closeButton} className="outline" onClick={close}>
            <ArrowLeft size={15} /> All logs
          </button>
          <PillTabs
            label="Switch log"
            value={open}
            onChange={setOpen}
            tabs={logs.map(([k, label]) => [k, label, count(k)])}
          />
          <button className="icon-button" aria-label="Close log" onClick={close}>
            <X size={18} />
          </button>
        </header>
        <div className="log-focus-body" key={open}>
          {open === 'outreach' ? <OutreachLog w={w} /> : <LogPage kind={open} w={w} />}
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">LOG / TEAM NOTEBOOK</div>
        <h1>
          PICK A <span>LOG.</span>
        </h1>
        <p>Swipe or use the arrows, then open a log to write today’s entry.</p>
      </div>
      <section className="log-carousel" aria-roledescription="carousel" aria-label="Team logs">
        <div className="log-track" ref={track} onScroll={onScroll}>
          {logs.map(([kind, title, Icon, blurb], i) => (
            <button
              key={kind}
              ref={(el) => (cards.current[i] = el)}
              className={`log-card ${i === active ? 'active' : ''}`}
              aria-label={`Open ${title}, ${count(kind)} entries`}
              onClick={(e) => openLog(kind, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') go(i + 1);
                if (e.key === 'ArrowLeft') go(i - 1);
              }}
            >
              <Icon className="log-card-icon" size={64} strokeWidth={1.6} aria-hidden="true" />
              <strong>{title}</strong>
              <small>{blurb}</small>
              <span className="log-card-meta">
                {count(kind)} {count(kind) === 1 ? 'entry' : 'entries'}
                {lastDate(kind) && ` · last ${lastDate(kind)}`}
              </span>
            </button>
          ))}
        </div>
        {logs.length > 1 && (
          <div className="log-nav">
            <button className="icon-button" aria-label="Previous log" disabled={active === 0} onClick={() => go(active - 1)}>
              <ArrowLeft size={16} />
            </button>
            <div className="log-dots">
              {logs.map(([kind, title], i) => (
                <button
                  key={kind}
                  className={i === active ? 'on' : ''}
                  aria-label={`Show ${title}`}
                  aria-current={i === active ? 'true' : undefined}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <button className="icon-button" aria-label="Next log" disabled={active === logs.length - 1} onClick={() => go(active + 1)}>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
    </>
  );
}
