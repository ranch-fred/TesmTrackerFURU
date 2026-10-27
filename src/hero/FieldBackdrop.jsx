import React, { useEffect, useRef } from 'react';
import { useMotion } from '../Motion';

// Full-page 3D BIOBUZZ field behind the sign-in screens. Decorative only:
// if WebGL or the CDN libraries fail, the page keeps its plain dark glow.
export default function FieldBackdrop() {
  const host = useRef(null);
  const api = useRef(null);
  const { enabled } = useMotion();
  const motion = useRef(enabled);
  motion.current = enabled;

  useEffect(() => {
    let disposed = false;
    // each mount renders into its own holder, so a remount never leaves a
    // running instance attached to a canvas that is gone
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;inset:0';
    host.current.appendChild(holder);
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() || '#FF6B00';
    import('./fieldScene')
      .then(({ createFieldScene }) =>
        createFieldScene(holder, {
          accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#FF6B00',
          animate: motion.current,
        }),
      )
      .then((scene) => {
        if (disposed) return scene.dispose();
        api.current = scene;
        host.current?.classList.add('ready');
      })
      .catch(() => {});
    return () => {
      disposed = true;
      api.current?.dispose();
      api.current = null;
      holder.remove();
    };
  }, []);

  useEffect(() => {
    api.current?.setMotion(enabled);
  }, [enabled]);

  return <div ref={host} className="field-backdrop" aria-hidden="true" />;
}
