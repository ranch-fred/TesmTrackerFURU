import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CirclePause, CirclePlay } from 'lucide-react';

const MotionContext = createContext({ enabled: true, reduced: false, toggle: () => {} });
export function useMotion() {
  return useContext(MotionContext);
}

export function MotionProvider({ children }) {
  const [paused, setPaused] = useState(() => localStorage.getItem('cnp-motion-paused') === 'true');
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const enabled = !paused && !reduced;
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? 'on' : 'off';
    localStorage.setItem('cnp-motion-paused', String(paused));
  }, [enabled, paused]);
  return (
    <MotionContext.Provider
      value={{ enabled, reduced, toggle: () => setPaused((value) => !value) }}
    >
      {children}
    </MotionContext.Provider>
  );
}

export function MotionToggle() {
  const { enabled, reduced, toggle } = useContext(MotionContext);
  const label = reduced
    ? 'Motion reduced by device settings'
    : enabled
      ? 'Pause animations'
      : 'Play animations';
  return (
    <button
      className="motion-toggle icon-button"
      title={label}
      aria-label={label}
      aria-pressed={!enabled}
      onClick={toggle}
      disabled={reduced}
    >
      {enabled ? <CirclePause size={18} /> : <CirclePlay size={18} />}
    </button>
  );
}

export function MotionScene({ children }) {
  const root = useRef(null);
  const { enabled } = useContext(MotionContext);
  useEffect(() => {
    if (!enabled || !root.current || !('IntersectionObserver' in window)) return;
    const seen = new WeakSet();
    let order = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.04 },
    );
    const scan = () => {
      root.current
        ?.querySelectorAll(
          '.panel, .stat-card, .page-intro, .welcome-banner, .command-strip, .profile-card, .task-card, [data-reveal]',
        )
        .forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          element.style.setProperty('--reveal-delay', `${(order++ % 4) * 65}ms`);
          element.classList.add('motion-ready');
          observer.observe(element);
        });
    };
    scan();
    const updates = new MutationObserver((changes) => {
      if (changes.some((change) => [...change.addedNodes].some((node) => node.nodeType === 1)))
        scan();
    });
    updates.observe(root.current, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      updates.disconnect();
      root.current
        ?.querySelectorAll('.motion-ready')
        .forEach((element) => element.classList.remove('motion-ready', 'is-visible'));
    };
  }, [enabled]);
  return (
    <div className="motion-scene" ref={root}>
      {children}
    </div>
  );
}

export function AnimatedValue({ value }) {
  const { enabled } = useContext(MotionContext);
  const [display, setDisplay] = useState(String(value));
  const element = useRef(null);
  const previous = useRef(0);
  useEffect(() => {
    const text = String(value);
    const match = text.match(/^([^\d-]*)(-?\d[\d,]*(?:\.\d+)?)([^\d]*)$/);
    if (!enabled || !match || !('IntersectionObserver' in window)) {
      setDisplay(text);
      return;
    }
    const [, prefix, numeric, suffix] = match;
    const target = Number(numeric.replaceAll(',', ''));
    const start = previous.current;
    const decimals = numeric.includes('.') ? numeric.split('.')[1].length : 0;
    let frame, started;
    const render = (now) => {
      started ??= now;
      const progress = Math.min(1, (now - started) / 900);
      const current = start + (target - start) * (1 - Math.pow(1 - progress, 3));
      const number = numeric.includes(',')
        ? current.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : current.toFixed(decimals).padStart(numeric.startsWith('0') ? numeric.length : 1, '0');
      setDisplay(progress === 1 ? text : `${prefix}${number}${suffix}`);
      if (progress < 1) frame = requestAnimationFrame(render);
      else previous.current = target;
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          frame = requestAnimationFrame(render);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, enabled]);
  return (
    <span ref={element} aria-label={String(value)}>
      <span aria-hidden="true">{enabled ? display : String(value)}</span>
    </span>
  );
}
