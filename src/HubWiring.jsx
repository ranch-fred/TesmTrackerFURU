import React from 'react';
import { hardwarePortName } from './robot-rules';
import { portPosition, portSize } from './robot-workspace';

const colors = {
  Motor: ['#e84536', '#191b20'],
  Encoder: ['#191b20', '#ed493b', '#5bbee6', '#ecece7'],
  Servo: ['#53392b', '#e84636', '#f4a13c'],
  I2C: ['#191b20', '#e84636', '#5cbae3', '#eeeeea'],
  Digital: ['#191b20', '#eeeeea'],
  Analog: ['#191b20', '#e84636', '#eeeeea'],
  UART: ['#191b20', '#e84636', '#5cbae3', '#eeeeea'],
  RS485: ['#5cbae3', '#eeeeea'],
  Power: ['#e84536', '#191b20'],
};

function Plug({ hub, type, index }) {
  const [px, py] = portPosition(hub, type, index);
  const x = px * 10,
    y = py * 10;
  const bottom = type === 'Servo' || type === 'Power';
  const left = ['Motor', 'Encoder', 'Battery'].includes(type);
  const wires = colors[type] || colors.I2C;
  const housing = type === 'Battery' ? '#e8b62d' : type === 'Motor' ? '#deded8' : '#272a2f';
  const [portWidth, portHeight] = portSize(type);
  const width = portWidth * 9;
  const height = portHeight * 9;
  return (
    <g>
      {wires.map((color, i) => {
        const offset = (i - (wires.length - 1) / 2) * 5;
        const path = bottom
          ? `M${x + offset} ${y}V1030`
          : `M${x} ${y + offset}H${left ? -30 : 1030}`;
        return (
          <g key={i}>
            <path
              d={path}
              stroke="#08090b"
              strokeWidth={type === 'Motor' || type === 'Battery' ? 5.6 : 3.5}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={path}
              stroke={color}
              strokeWidth={type === 'Motor' || type === 'Battery' ? 3.7 : 2.1}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={path}
              stroke="#ffffff"
              strokeOpacity=".18"
              strokeWidth=".5"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
      <g transform={`translate(${x} ${y})`}>
        <rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          rx="4"
          fill={housing}
          stroke="#a5a8ad"
          strokeWidth="1"
        />
        <rect
          x={-width / 2 + 3}
          y={-height / 2 + 3}
          width={width - 6}
          height={height - 6}
          rx="2"
          fill="#15171a"
          stroke="#54585d"
          strokeWidth="1"
        />
        {wires.map((color, i) => (
          <rect
            key={i}
            x={bottom ? (i - (wires.length - 1) / 2) * 5 - 1.5 : -3}
            y={bottom ? -4 : (i - (wires.length - 1) / 2) * 5 - 1.5}
            width={bottom ? 3 : 6}
            height={bottom ? 8 : 3}
            fill={color}
          />
        ))}
        <path
          d={bottom ? 'M-11-8H11' : 'M-9-11V11'}
          stroke="#fff"
          strokeOpacity=".35"
          strokeWidth="1.5"
        />
      </g>
    </g>
  );
}

export default function HubWiring({ hub, records }) {
  return (
    <svg
      className="rw-wiring"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {records
        .filter((record) => record.hub === hub && record.name)
        .map((record) => {
          const port = hardwarePortName(record);
          const type = port.split(' ')[0];
          const raw = Number(port.match(/\d+/)?.[0]);
          const index = ['Digital', 'Analog'].includes(type)
            ? raw / 2
            : type === 'UART'
              ? raw - 1
              : raw;
          if (!Number.isFinite(index) || !colors[type]) return null;
          return (
            <g key={record.id}>
              <Plug hub={hub} type={type} index={index} />
              {type === 'Motor' && record.encoderConnected && (
                <Plug hub={hub} type="Encoder" index={index} />
              )}
            </g>
          );
        })}
    </svg>
  );
}
