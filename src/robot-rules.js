export const MANUAL_URL = 'https://ftc-resources.firstinspires.org/ftc/game/cm-html';
export const INSPECTION_URL =
  'https://ftc-resources.firstinspires.org/ftc/archive/2027/event/inspection-check';
export const officialRules = Object.freeze({
  name: '2026–27 BIOBUZZ · TU06',
  motors: 8,
  servos: 8,
  cube: 18,
  horizontalShort: 18,
  horizontal: 24,
  vertical: 29,
  horizontalAllowance: 6,
  verticalAllowance: 11,
  weight: 0,
  verified: true,
  source: MANUAL_URL,
});

export function remainingCapacity(used, limit) {
  if (
    used === '' ||
    used === null ||
    used === undefined ||
    !Number.isFinite(Number(used)) ||
    Number(used) < 0
  )
    return null;
  return Number(limit) - Number(used);
}

// Paraphrased from FIRST's Inspection Checklist V26-27.2 (October 22, 2026).
export const inspectionGroups = [
  {
    title: 'Ready for inspection',
    items: [
      [
        'ready',
        'Robot present and ready; bring every mechanism and component used at the event.',
        'I301, E117',
      ],
      ['signs-both', 'Bring robot signs for both alliance colors.', 'R401'],
      [
        'console',
        'Complete operator console and gamepads are present; robot and driver station power on.',
        'I301',
      ],
    ],
  },
  {
    title: 'Control system',
    items: [
      [
        'controller',
        'Use one legal robot controller and at most one optional REV Expansion Hub.',
        'R701',
      ],
      [
        'coprocessor',
        'Coprocessor or camera software follows its permitted manufacturer configuration, if used.',
        'R702',
      ],
      ['usb', 'Only permitted devices use robot USB connections.', 'R707'],
      [
        'driver-station',
        'One permitted driver station is in use and its touchscreen is accessible to field staff.',
        'R901, R902',
      ],
      [
        'self-inspect',
        'Robot Controller and Driver Station self-inspect screens show no red errors.',
        'R711',
      ],
    ],
  },
  {
    title: 'Size and power',
    items: [
      [
        'starting-size',
        'Starting configuration fits inside an 18 × 18 × 18 inch cube and can be maintained.',
        'R102, R103',
      ],
      [
        'expanded-size',
        'Maximum mechanical extension stays within an 18 × 24 × 29 inch volume in a stable position.',
        'R105',
      ],
      ['operator-size', 'Operator console fits within 36 × 18 × 24 inches.', 'R903'],
      ['main-battery', 'Exactly one unaltered legal main battery is installed.', 'R601'],
      [
        'switch',
        'Exactly one legal main power switch is connected directly to the battery and accessible.',
        'R603',
      ],
      [
        'fuses',
        'Any replaced battery fuse has the original or lower rating; no self-resetting fuse.',
        'R604',
      ],
      ['main-wire', 'Main 12 V positive and ground wiring uses permitted colors.', 'R610'],
      [
        'other-batteries',
        'Any additional onboard batteries power only permitted devices and meet limits.',
        'R601, R602',
      ],
    ],
  },
  {
    title: 'Motors and electrical',
    items: [
      ['motors', 'No more than eight legal DC motors are used.', 'R501, R503'],
      [
        'servos',
        'No more than eight servos meeting the required specifications are used.',
        'R502, R503',
      ],
      [
        'actuator-mods',
        'Motor, servo, and actuator modifications are permitted under the manual.',
        'R504',
      ],
      [
        'regulators',
        'Actuator power regulation is permitted and servo port load is within limits.',
        'R505',
      ],
      [
        'no-relays',
        'No prohibited relays, electromagnets, or solenoid actuators are used.',
        'R506',
      ],
      ['usb-power', 'Powered USB hubs, if present, use an allowed power source.', 'R611'],
      ['grounding', 'Grounding, if used, follows an approved configuration.', 'R605'],
      [
        'custom-circuits',
        'Custom circuits, if present, follow output power restrictions.',
        'R607, R612',
      ],
    ],
  },
  {
    title: 'Safety and signs',
    items: [
      ['lasers', 'Lasers, if present, meet sensor and safety-class restrictions.', 'R710'],
      ['recording', 'Video recorders, if present, have wireless communication disabled.', 'R709'],
      ['damage', 'Robot has no parts likely to harm people, robots, or field elements.', 'R201'],
      ['interference', 'Robot and operator console have no unsafe or interfering parts.', 'R202'],
      ['cots', 'Purchased mechanisms comply with the legal COTS mechanism rules.', 'R301, R303'],
      ['pneumatics', 'No prohibited pneumatic devices are used.', 'R801'],
      [
        'sign-placement',
        'Robot signs are secure, visible from two sides at least 90° apart.',
        'R401',
      ],
      [
        'sign-legibility',
        'Team number and alliance color are legible on each robot sign.',
        'R402, R403',
      ],
      [
        'certification',
        'Team confirms schedule responsibility, honest inspection, and competition integrity.',
        'G301, G202',
      ],
    ],
  },
];

export const hubPorts = [
  ['Motor', 4],
  ['Servo', 6],
  ['I2C', 4],
];
export function hardwarePortName(record) {
  if (/^(Motor|Servo|I2C|Digital|Analog|UART|RS485|Battery|Power) \d+(?:\/\d+)?$/.test(String(record.port ?? '')))
    return String(record.port);
  const type = record.kind === 'DC motor' ? 'Motor' : record.kind === 'Servo' ? 'Servo' : 'I2C';
  const raw = String(record.port ?? '');
  const number = raw.match(/(\d+)\s*$/)?.[1];
  return number === undefined ? '' : `${type} ${number}`;
}
