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

function WireRun({ hub, type, index }) {
  const [px, py] = portPosition(hub, type, index);
  const [width, height] = portSize(type);
  const bottom = type === 'Servo' || type === 'Power';
  const left = type === 'Motor' || type === 'Encoder';
  // Start at the connector edge, leaving the original socket face visible.
  const x = px * 10 + (bottom ? 0 : (left ? -1 : 1) * width * 5);
  const y = py * 10 + (bottom ? height * 5 : 0);
  const wires = colors[type];
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
              strokeWidth={type === 'Motor' ? 5.6 : 3.5}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={path}
              stroke={color}
              strokeWidth={type === 'Motor' ? 3.7 : 2.1}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={path}
              stroke="#fff"
              strokeOpacity=".18"
              strokeWidth=".5"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
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
              <WireRun hub={hub} type={type} index={index} />
              {type === 'Motor' && record.encoderConnected && (
                <WireRun hub={hub} type="Encoder" index={index} />
              )}
            </g>
          );
        })}
    </svg>
  );
}
