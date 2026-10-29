import React, { useRef, useState } from 'react';
import { RotateCcw, Move } from 'lucide-react';

const size = (value) =>
  `${Number(value) > 0 ? Math.min(160, Math.max(12, Number(value) * 6)) : 108}px`;

export default function RobotCube({ robot, number }) {
  const [angle, setAngle] = useState({ x: -24, y: -32 });
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);
  const reset = () => setAngle({ x: -24, y: -32 });
  function stop(event) {
    start.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyDown(event) {
    const delta = {
      ArrowLeft: [0, -10],
      ArrowRight: [0, 10],
      ArrowUp: [-10, 0],
      ArrowDown: [10, 0],
    }[event.key];
    if (event.key === 'Home') {
      event.preventDefault();
      reset();
    } else if (delta) {
      event.preventDefault();
      setAngle((a) => ({ x: Math.max(-85, Math.min(85, a.x + delta[0])), y: a.y + delta[1] }));
    }
  }
  return (
    <div className="rw-cube-preview">
      <div
        className={`rw-cube-stage ${dragging ? 'dragging' : ''}`}
        tabIndex={0}
        role="group"
        aria-label="3D robot. Drag to rotate, use arrow keys, or press Home to reset."
        onKeyDown={keyDown}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          start.current = { px: event.clientX, py: event.clientY, ...angle };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (start.current)
            setAngle({
              x: Math.max(
                -85,
                Math.min(85, start.current.x - (event.clientY - start.current.py) * 0.45),
              ),
              y: start.current.y + (event.clientX - start.current.px) * 0.45,
            });
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={() => {
          start.current = null;
          setDragging(false);
        }}
      >
        <div className="rw-cube-shadow" aria-hidden="true" />
        <div
          className="rw-cube"
          style={{
            '--cube-w': size(robot.width),
            '--cube-d': size(robot.length),
            '--cube-h': size(robot.height),
            transform: `rotateX(${angle.x}deg) rotateY(${angle.y}deg)`,
          }}
          aria-hidden="true"
        >
          <div className="rw-cube-face rw-face-front">
            <b>{number}</b>
            <span className="rw-cube-width">{robot.width || '—'} IN</span>
            <span className="rw-cube-height">{robot.height || '—'} IN</span>
          </div>
          <div className="rw-cube-face rw-face-back" />
          <div className="rw-cube-face rw-face-left" />
          <div className="rw-cube-face rw-face-right">
            <span className="rw-cube-length">{robot.length || '—'} IN</span>
          </div>
          <div className="rw-cube-face rw-face-top">
            <b>{number}</b>
          </div>
          <div className="rw-cube-face rw-face-bottom" />
        </div>
      </div>
      <div className="rw-cube-toolbar">
        <span>
          <Move size={12} /> Drag to orbit
        </span>
        <button type="button" onClick={reset} aria-label="Reset robot view">
          <RotateCcw size={12} /> Reset view
        </button>
      </div>
    </div>
  );
}
