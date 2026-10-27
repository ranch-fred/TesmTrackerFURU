import React, { useEffect, useRef } from 'react';
import { useMotion } from '../Motion';

// Full-page 3D BIOBUZZ field behind the sign-in screens. While `centered`
// it plays in the middle of the screen; once false it slides aside for the copy.
// `onBuilt` fires when the field has finished assembling, or straight away if
// WebGL or the CDN libraries fail (the page then keeps its plain dark glow).
export default function FieldBackdrop({ centered = false, onBuilt }) {
  const host = useRef(null);
  const api = useRef(null);
  const { enabled } = useMotion();
  const live = useRef({ enabled, centered, onBuilt });
  live.current = { enabled, centered, onBuilt };

  useEffect(() => {
    let disposed = false;
    const done = () => !disposed && live.current.onBuilt?.();
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
          animate: live.current.enabled,
          centered: live.current.centered,
          onBuilt: done,
        }),
      )
      .then((scene) => {
        if (disposed) return scene.dispose();
        api.current = scene;
        if (!live.current.centered) scene.makeRoom();
        host.current?.classList.add('ready');
      })
      .catch(done);
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
  useEffect(() => {
    if (!centered) api.current?.makeRoom();
  }, [centered]);

  return <div ref={host} className="field-backdrop" aria-hidden="true" />;
}
