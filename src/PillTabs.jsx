import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Single-row, horizontally scrolling pill tabs. Touch/swipe scrolls natively,
// the active pill is kept in view, and the arrows only appear when the row
// overflows in that direction. tabs: [[key, label, count?], ...]
export default function PillTabs({ tabs, value, onChange, label }) {
  const track = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = () => {
    const el = track.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => {
    measure();
    const el = track.current;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tabs.length]);
  useEffect(() => {
    const el = track.current?.querySelector('[aria-selected="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [value]);

  const nudge = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.6, behavior: 'smooth' });
  const onKey = (e) => {
    const i = tabs.findIndex(([k]) => k === value);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const k = tabs[(next + tabs.length) % tabs.length][0];
    onChange(k);
    requestAnimationFrame(() => track.current?.querySelector(`[data-key="${CSS.escape(k)}"]`)?.focus());
  };

  return (
    <div className="pill-carousel">
      <button className="pill-arrow" type="button" aria-label="Scroll tabs left" disabled={!edges.left} onClick={() => nudge(-1)}>
        <ChevronLeft size={16} />
      </button>
      <div
        ref={track}
        className="pill-track"
        role="tablist"
        aria-label={label}
        onScroll={measure}
        onKeyDown={onKey}
        style={{ '--fade-l': edges.left ? '28px' : '0px', '--fade-r': edges.right ? '28px' : '0px' }}
      >
        {tabs.map(([key, text, count]) => (
          <button
            key={key}
            data-key={key}
            type="button"
            role="tab"
            className="pill"
            aria-selected={value === key}
            tabIndex={value === key ? 0 : -1}
            onClick={() => onChange(key)}
          >
            {text}
            {count != null && <span className="pill-count">{count}</span>}
          </button>
        ))}
      </div>
      <button className="pill-arrow" type="button" aria-label="Scroll tabs right" disabled={!edges.right} onClick={() => nudge(1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
