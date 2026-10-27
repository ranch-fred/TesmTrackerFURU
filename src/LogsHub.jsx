import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Code2, Hammer, HeartHandshake, X } from 'lucide-react';
import { canView } from './domain';
import { LogPage } from './LogEntry';
import OutreachLog from './OutreachLog';
import PillTabs from './PillTabs';

const LOGS = [
  ['programming', 'Programming log', Code2, 'Code, tests and autonomous tuning'],
  ['build', 'Build log', Hammer, 'Mechanisms, assembly and repairs'],
  ['outreach', 'Outreach log', HeartHandshake, 'Events, demos and community'],
];

// One "Logs" page: a row of glowing glass cards, one per log. The selected
// card is the big one; picking another card or dot makes it the big one, and
// opening the big card takes that log full screen, with a switcher to change logs.
export default function LogsHub({ w, initial }) {
  const logs = LOGS.filter(([kind]) => canView(w.member.role, kind));
  const [open, setOpen] = useState(logs.some(([k]) => k === initial) ? initial : null);
  const middle = Math.floor((logs.length - 1) / 2);
  const [active, setActive] = useState(middle);
  const settle = useRef(0);
  const track = useRef(null);
  const cards = useRef([]);
  const closeButton = useRef(null);
  const lastOpen = useRef(null);

  // on narrow screens the row scrolls: once a swipe settles, the card
  // nearest the middle becomes the selected one
  function onScroll() {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const t = track.current;
      if (!t || t.scrollWidth <= t.clientWidth) return;
      const mid = t.getBoundingClientRect().left + t.clientWidth / 2;
      const dist = (c) => Math.abs(c.getBoundingClientRect().left + c.offsetWidth / 2 - mid);
      let best = 0;
      cards.current.forEach((c, i) => c && dist(c) < dist(cards.current[best]) && (best = i));
      setActive(best);
    }, 140);
  }
  useEffect(() => () => clearTimeout(settle.current), []);
  function go(i, focus = true) {
    const n = Math.max(0, Math.min(logs.length - 1, i));
    setActive(n);
    const c = cards.current[n];
    // wait a frame so the card has started growing before centring it
    requestAnimationFrame(() => c?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }));
    if (focus) c?.focus({ preventScroll: true });
  }
  // back from full screen: centre and focus the card of the log that was open
  useEffect(() => {
    if (open) return;
    const found = logs.findIndex(([k]) => k === lastOpen.current);
    const i = found < 0 ? middle : found;
    cards.current[i]?.scrollIntoView({ inline: 'center', block: 'nearest' });
    if (lastOpen.current) cards.current[i]?.focus({ preventScroll: true });
    setActive(i);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    lastOpen.current = open;
    closeButton.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('log-focus-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('log-focus-open');
    };
  }, [open]);

  function close() {
    setOpen(null);
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
        <p>Pick a card to bring it forward, then open it to write today’s entry.</p>
      </div>
      <section className="log-carousel" aria-roledescription="carousel" aria-label="Team logs">
        <div className="log-track" ref={track} onScroll={onScroll}>
          {logs.map(([kind, title, Icon, blurb], i) => (
            <button
              key={kind}
              ref={(el) => (cards.current[i] = el)}
              className={`log-card ${i === active ? 'active' : ''}`}
              aria-label={`${i === active ? 'Open' : 'Show'} ${title}, ${count(kind)} ${count(kind) === 1 ? 'entry' : 'entries'}`}
              onClick={() => (i === active ? setOpen(kind) : go(i, false))}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') go(i + 1);
                if (e.key === 'ArrowLeft') go(i - 1);
              }}
            >
              <Icon className="log-card-icon" size={72} strokeWidth={1.8} aria-hidden="true" />
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
          </div>
        )}
      </section>
    </>
  );
}
