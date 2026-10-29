import React from 'react';

function ProgrammingScene() {
  return (
    <svg viewBox="0 0 400 300" role="presentation" focusable="false">
      <defs>
        <linearGradient id="logScreen" x2="1" y2="1">
          <stop stopColor="#152d2a" />
          <stop offset="1" stopColor="#0c1418" />
        </linearGradient>
      </defs>
      <path
        className="scene-grid"
        d="M0 55H400M0 110H400M0 165H400M0 220H400M55 0V300M110 0V300M165 0V300M220 0V300M275 0V300M330 0V300"
      />
      <circle className="scene-orbit" cx="273" cy="120" r="94" />
      <path className="scene-glow-line" d="M25 264H375" />
      <rect className="scene-desk" x="23" y="224" width="355" height="12" rx="6" />
      <path className="scene-desk" d="M52 237v56m295-56v56" />
      <rect className="scene-screen-frame" x="169" y="75" width="188" height="133" rx="12" />
      <rect x="179" y="85" width="168" height="111" rx="5" fill="url(#logScreen)" />
      <g className="scene-code-lines">
        <path d="M196 110h41m18 0h32M207 128h62m16 0h35m-123 18h27m12 0h73m-101 18h53m10 0h28" />
      </g>
      <path className="scene-code-pulse" d="M299 164h23" />
      <path className="scene-screen-frame" d="M254 209v15m-38 0h76" />
      <ellipse className="scene-person" cx="92" cy="124" rx="28" ry="31" />
      <path className="scene-person" d="M63 122q3-43 33-39 24 3 25 34-10-10-18-13-11 16-39 18Z" />
      <path className="scene-person-body" d="M51 157q44-28 86 0l25 79H39Z" />
      <path className="scene-arm scene-coder-arm-left" d="M66 178q19 16 43 35l52 12" />
      <path className="scene-arm scene-coder-arm-right" d="M117 177q18 17 41 29l51 17" />
      <rect className="scene-keyboard" x="139" y="216" width="96" height="9" rx="4" />
      <g className="scene-brackets">
        <path d="M293 38l-10 10 10 10m36-20 10 10-10 10m-18-24-7 28" />
      </g>
    </svg>
  );
}

function BuildScene() {
  return (
    <svg viewBox="0 0 400 300" role="presentation" focusable="false">
      <path
        className="scene-grid"
        d="M0 55H400M0 110H400M0 165H400M0 220H400M55 0V300M110 0V300M165 0V300M220 0V300M275 0V300M330 0V300"
      />
      <circle className="scene-orbit" cx="207" cy="155" r="107" />
      <rect className="scene-desk" x="22" y="239" width="356" height="13" rx="6" />
      <path className="scene-desk" d="M48 252v40m304-40v40" />
      <path className="scene-build-frame" d="M121 168h167l-17 65H139Z" />
      <path className="scene-build-frame" d="M142 169v-36h124v36m-91-36v-20h58v20" />
      <circle className="scene-wheel" cx="148" cy="235" r="25" />
      <circle className="scene-wheel" cx="264" cy="235" r="25" />
      <circle className="scene-wheel-core" cx="148" cy="235" r="9" />
      <circle className="scene-wheel-core" cx="264" cy="235" r="9" />
      <path className="scene-build-frame" d="M170 187h75m-62 16h48" />
      <path className="scene-crane" d="M50 46h298M79 46v138m-17 0h34" />
      <path className="scene-crane" d="M221 46v49" />
      <g className="scene-lift">
        <path className="scene-crane" d="M221 95v32m-24 0 12 20m36-20-12 20" />
        <rect className="scene-motor" x="197" y="147" width="48" height="33" rx="6" />
        <circle className="scene-motor" cx="221" cy="164" r="9" />
      </g>
      <g className="scene-gear">
        <circle className="scene-gear-ring" cx="323" cy="177" r="25" />
        <circle className="scene-gear-ring" cx="323" cy="177" r="8" />
        <path
          className="scene-gear-ring"
          d="M323 143v11m0 46v11m-34-34h11m46 0h11m-58-24 8 8m32 32 8 8m0-48-8 8m-32 32-8 8"
        />
      </g>
      <g className="scene-sparks">
        <path d="M178 174l-11-9m10 25-13 5m87-15 13-8m-9 22 14 8" />
      </g>
      <path className="scene-glow-line" d="M24 264H376" />
    </svg>
  );
}

function Person({ x, y, color = '#f7bb87', presenter = false }) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      className={presenter ? 'scene-presenter' : 'scene-audience-person'}
    >
      <circle cx="0" cy="0" r="13" fill={color} />
      <path d="M-10-6q5-17 19-8 5 3 5 13-7-6-13-6-4 7-11 7Z" fill="#2c1c16" />
      <path
        d="M-20 16q20-12 40 0l8 46h-56Z"
        fill={presenter ? '#f08234' : '#684b43'}
        stroke="#ffd3b6"
        strokeWidth="2"
      />
    </g>
  );
}

function OutreachScene() {
  return (
    <svg viewBox="0 0 400 300" role="presentation" focusable="false">
      <path
        className="scene-grid"
        d="M0 55H400M0 110H400M0 165H400M0 220H400M55 0V300M110 0V300M165 0V300M220 0V300M275 0V300M330 0V300"
      />
      <rect className="scene-presentation-board" x="90" y="28" width="225" height="115" rx="10" />
      <path
        className="scene-presentation-content"
        d="M112 62h86m-86 18h131m-131 18h69m76-45 30 19-30 18Z"
      />
      <path className="scene-stage" d="M35 212H365v12H35Z" />
      <Person x={92} y={164} />
      <Person x={156} y={162} color="#d98f63" />
      <Person x={249} y={164} color="#c78560" />
      <Person x={314} y={161} presenter />
      <path className="scene-pointer" d="M296 183l-32-47" />
      <path className="scene-speech" d="M329 112q24-5 35 7m-35 3q16-2 23 5" />
      <g className="scene-audience">
        <circle cx="38" cy="247" r="14" />
        <path d="M10 300q5-37 28-37t28 37" />
        <circle cx="111" cy="251" r="13" />
        <path d="M84 300q5-34 27-34t27 34" />
        <circle cx="188" cy="245" r="15" />
        <path d="M157 300q5-39 31-39t31 39" />
        <circle cx="270" cy="252" r="13" />
        <path d="M244 300q4-34 26-34t26 34" />
        <circle cx="349" cy="247" r="14" />
        <path d="M321 300q5-37 28-37t28 37" />
      </g>
      <path className="scene-raised-hand" d="M185 271l-10-39" />
      <path className="scene-glow-line" d="M20 225H380" />
    </svg>
  );
}

export default function LogScene({ kind, banner = false }) {
  return (
    <span
      className={`log-scene log-scene-${kind} ${banner ? 'log-scene-banner' : ''}`}
      aria-hidden="true"
    >
      {kind === 'programming' ? (
        <ProgrammingScene />
      ) : kind === 'build' ? (
        <BuildScene />
      ) : (
        <OutreachScene />
      )}
    </span>
  );
}
