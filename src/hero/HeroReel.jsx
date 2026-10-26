import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useMotion } from '../Motion';

// Field-building 3D intro with a broadcast HUD. Falls back to `fallback`
// when WebGL or the CDN libraries are unavailable, and holds on the final
// frame when motion is paused or reduced.
export default function HeroReel({ fallback = null }) {
  const host = useRef(null);
  const api = useRef(null);
  const { enabled } = useMotion();
  const [p, setP] = useState(0);
  const [beat, setBeat] = useState('');
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let disposed = false;
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() || '#FF6B00';
    import('./fieldReel')
      .then(({ createFieldReel }) =>
        createFieldReel(host.current, {
          accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#FF6B00',
          onProgress: setP,
          onBeat: setBeat,
          onScore: (n) => setScore((s) => s + n),
        }),
      )
      .then((reel) => {
        if (disposed) return reel.dispose();
        api.current = reel;
        setState('ready');
      })
      .catch(() => !disposed && setState('failed'));
    return () => {
      disposed = true;
      api.current?.dispose();
      api.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled && api.current) {
      api.current.seek(15);
      setPlaying(false);
    }
  }, [enabled, state]);

  if (state === 'failed') return fallback;
  const t = (p * 15).toFixed(2).padStart(5, '0');
  return (
    <div className="hero-reel" aria-label="Animated BIOBUZZ field assembling">
      <div ref={host} className="hero-reel-canvas" aria-hidden="true" />
      {state === 'loading' && (
        <div className="hero-reel-loading">
          <span className="gear-spin" aria-hidden="true" /> Building the field…
        </div>
      )}
      <div className="hero-reel-hud" aria-hidden="true">
        <span>
          <i className="rec" /> REC 00:{t}
        </span>
        <span className="hide-small">FTC · BIOBUZZ 2026–27</span>
        <b>{beat}</b>
      </div>
      <div className={`hero-reel-score ${score ? 'on' : ''}`} aria-hidden="true">
        <small>HIVE</small>
        <strong>{String(score).padStart(3, '0')}</strong>
      </div>
      {state === 'ready' && (
        <div className="hero-reel-controls">
          <button
            className="outline small"
            onClick={() => {
              setScore(0);
              api.current?.restart();
              setPlaying(true);
            }}
          >
            <RotateCcw size={13} /> Replay
          </button>
          {p < 0.999 && (
            <button
              className="outline small"
              aria-label={playing ? 'Pause intro' : 'Play intro'}
              onClick={() => setPlaying(api.current?.toggle())}
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
          )}
        </div>
      )}
      <div className="hero-reel-progress" aria-hidden="true">
        <span style={{ width: `${p * 100}%` }} />
      </div>
    </div>
  );
}
