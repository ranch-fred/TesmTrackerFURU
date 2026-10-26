import React, { useEffect, useRef } from 'react';
import { useMotion } from './Motion';

// A short isometric loop (hive / log / field) made with the /animate skill.
// Muted and inline; holds on its poster frame when motion is paused or reduced.
export default function IsoLoop({ name, size = 'md' }) {
  const video = useRef(null);
  const { enabled } = useMotion();
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (enabled) v.play?.().catch(() => {});
    else v.pause?.();
  }, [enabled]);
  return (
    <video
      ref={video}
      className={`iso-loop iso-loop-${size}`}
      src={`/assets/animations/${name}.mp4`}
      poster={`/assets/animations/${name}.jpg`}
      autoPlay={enabled}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}
