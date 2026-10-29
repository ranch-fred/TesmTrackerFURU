import React, { useId } from 'react';

// A silent, nine-second meeting loop drawn entirely with SVG and CSS.
export default function MeetingAnimation() {
  const id = useId().replaceAll(':', '');
  const seats = [[170, 35], [271, 65], [280, 139], [170, 177], [60, 139], [69, 65]];
  return (
    <div className="meeting-animation" role="img" aria-label="Animated team meeting: participants place glowing glass tiles together in the center of the table.">
      <div className="meeting-animation-caption"><span /> THE IDEAS COME TOGETHER <b>LOOP / 09s</b></div>
      <svg viewBox="0 0 340 220" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-table`} x1="170" y1="65" x2="170" y2="160" gradientUnits="userSpaceOnUse"><stop stopColor="var(--accent)" stopOpacity=".19" /><stop offset="1" stopColor="var(--surface)" stopOpacity=".85" /></linearGradient>
          <radialGradient id={`${id}-glow`}><stop stopColor="var(--accent)" stopOpacity=".22" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>
          <linearGradient id={`${id}-person`} x1="0" y1="-20" x2="0" y2="20" gradientUnits="userSpaceOnUse"><stop stopColor="var(--ink)" stopOpacity=".12" /><stop offset="1" stopColor="var(--accent)" stopOpacity=".12" /></linearGradient>
        </defs>
        <ellipse cx="170" cy="153" rx="151" ry="63" fill={`url(#${id}-glow)`} />
        <path d="M111 135V164L120 169V140M229 135V164L220 169V140" stroke="currentColor" strokeOpacity=".3" fill="var(--surface)" />
        <path d="M80 108V118C80 145 120 166 170 166S260 145 260 118V108" fill="var(--surface)" fillOpacity=".8" stroke="currentColor" strokeOpacity=".25" />
        <ellipse cx="170" cy="108" rx="90" ry="46" fill={`url(#${id}-table)`} stroke="currentColor" strokeOpacity=".7" />
        <ellipse cx="170" cy="108" rx="78" ry="37" stroke="currentColor" strokeOpacity=".16" />
        <path d="M95 123C122 149 218 149 245 123" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" />
        {seats.map(([x,y], i) => (
          <g key={i} className="meeting-participant" style={{'--speaker-delay': `${i * 1.05}s`}}>
            <g transform={`translate(${x} ${y})`}>
              <ellipse cx="0" cy="20" rx="19" ry="7" fill="var(--surface)" stroke="currentColor" strokeOpacity=".2" />
              <ellipse className="meeting-speaker-ring" cx="0" cy="20" rx="23" ry="10" stroke="currentColor" />
              <path d="M-13 16V10C-13 3-8 0 0 0S13 3 13 10V16C7 21-7 21-13 16Z" fill={`url(#${id}-person)`} stroke="currentColor" strokeOpacity=".5" />
              <circle cy="-10" r="8" fill="var(--surface)" stroke="currentColor" strokeOpacity=".75" />
              <path d="M-4-12Q0-16 4-12" stroke="var(--ink)" strokeOpacity=".25" strokeLinecap="round" />
              <g className="meeting-speech"><path d="M14-31H38V-16H24L19-11V-16H14Z" fill="var(--surface)" stroke="currentColor" strokeOpacity=".75" /><circle cx="20" cy="-23" r="1" fill="currentColor" /><circle cx="26" cy="-23" r="1" fill="currentColor" /><circle cx="32" cy="-23" r="1" fill="currentColor" /></g>
            </g>
          </g>
        ))}
        {seats.map(([x, y], i) => {
          const angle = i * Math.PI / 3 - Math.PI / 2;
          const targetX = 170 + Math.cos(angle) * 17;
          const targetY = 108 + Math.sin(angle) * 10;
          return <g key={i} transform={`translate(${targetX} ${targetY})`}>
            <g className="meeting-glass-tile" style={{ '--tile-from-x': `${x - targetX}px`, '--tile-from-y': `${y + 8 - targetY}px`, animationName: `meeting-place-${i}` }}>
              <ellipse cy="7" rx="10" ry="4" fill="currentColor" opacity=".12" />
              <path d="M-8 0 0-5 8 0V4L0 9-8 4Z" fill="var(--surface)" stroke="currentColor" strokeOpacity=".7" strokeWidth=".7" />
              <path d="M-8 0 0-5 8 0 0 5Z" fill="currentColor" fillOpacity=".28" stroke="currentColor" strokeWidth=".8" />
              <path d="M0 5V9M-4-1 0-3 4-1" stroke="currentColor" strokeOpacity=".65" strokeWidth=".6" />
            </g>
          </g>;
        })}
      </svg>
      <div className="meeting-animation-progress" aria-hidden="true"><span /></div>
      <div className="meeting-animation-legend" aria-hidden="true"><span>01 CONNECT</span><span>02 CONTRIBUTE</span><span>03 ALIGN</span></div>
    </div>
  );
}
