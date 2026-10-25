import React, { useState } from 'react';
import { Check, PlugZap, ShieldCheck, X } from 'lucide-react';
import { canEdit, legality } from './domain';
import { Modal } from './Records';
import {
  hardwarePortName,
  hubPorts,
  inspectionGroups,
  INSPECTION_URL,
  MANUAL_URL,
  officialRules,
  remainingCapacity,
} from './robot-rules';

export function HardwareMap({ w }) {
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [device, setDevice] = useState('');
  const [error, setError] = useState('');
  const editable = canEdit(w.member.role, w.member.mentor_edit);
  function recordAt(hub, port) {
    return w.data.hardware.find((r) => r.hub === hub && hardwarePortName(r) === port);
  }
  function open(hub, port, kind) {
    const record = recordAt(hub, port);
    setSelected({ hub, port, kind, record });
    setName(record?.name || '');
    setDevice(record?.device || '');
    setError('');
  }
  async function save(event) {
    event.preventDefault();
    if (
      name.trim() &&
      w.data.hardware.some(
        (r) => r.id !== selected.record?.id && r.name?.toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      setError('That configuration name is already used on another port.');
      return;
    }
    try {
      if (selected.record || name.trim())
        await w.save('hardware', {
          ...selected.record,
          name: name.trim(),
          device: device.trim(),
          kind: selected.kind,
          hub: selected.hub,
          port: selected.port,
        });
      setSelected(null);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <section className="panel robot-tool-intro">
        <div className="eyebrow">ROBOT / CONFIGURATION MAP</div>
        <h2>Every port has a name.</h2>
        <p>
          Choose a port and enter the exact name used in your robot configuration. The Control Hub
          and Expansion Hub each have four motor, six servo, and four I²C ports. This map is a team
          reference; update the Robot Controller configuration separately.
        </p>
        <a
          href="https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/connecting_devices/index.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          FTC wiring guide ↗
        </a>
      </section>
      <div className="hub-grid">
        {['Control Hub', 'Expansion Hub'].map((hub) => (
          <section className="panel hub-card" key={hub}>
            <div className="panel-heading">
              <h2>
                <PlugZap size={19} /> {hub}
              </h2>
              <span className="muted">REV Robotics</span>
            </div>
            {hubPorts.map(([type, count]) => (
              <div className="hub-port-group" key={type}>
                <h3>{type === 'I2C' ? 'I²C' : type} ports</h3>
                <div className="hub-ports">
                  {Array.from({ length: count }, (_, index) => {
                    const port = `${type} ${index}`;
                    const record = recordAt(hub, port);
                    return (
                      <button
                        type="button"
                        key={port}
                        className={`hub-port ${record?.name ? 'assigned' : ''}`}
                        onClick={() =>
                          open(
                            hub,
                            port,
                            type === 'Motor' ? 'DC motor' : type === 'Servo' ? 'Servo' : 'Sensor',
                          )
                        }
                        aria-label={`${hub} ${port}${record?.name ? `, ${record.name}` : ', unassigned'}`}
                      >
                        <span className="port-number">{index}</span>
                        <span>
                          <strong>{record?.name || 'Unassigned'}</strong>
                          <small>{record?.device || (type === 'I2C' ? 'I²C sensor' : type)}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
      {selected && (
        <Modal title={`${selected.hub} · ${selected.port}`} onClose={() => setSelected(null)}>
          <form onSubmit={save}>
            <p>
              Use the exact configuration name that your code requests, such as{' '}
              <code>frontLeft</code> or <code>claw</code>.
            </p>
            <label>
              Configuration name
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editable}
                placeholder="frontLeft"
              />
            </label>
            <label>
              Device or purpose
              <input
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                disabled={!editable}
                placeholder="Left front drive motor"
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="outline" onClick={() => setSelected(null)}>
                Cancel
              </button>
              {editable && <button className="primary">{name ? 'Save port' : 'Clear port'}</button>}
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function InspectionChecklist({ w }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  const editable = canEdit(w.member.role, w.member.mentor_edit);
  const items = inspectionGroups.flatMap((group) => group.items);
  const byKey = new Map(
    w.data.inspection.filter((row) => row.checkKey).map((row) => [row.checkKey, row]),
  );
  const completed = items.filter(([key]) => ['pass', 'na'].includes(byKey.get(key)?.status)).length;
  async function change(item, status) {
    const [checkKey, label, rule] = item;
    const old = byKey.get(checkKey);
    try {
      setError('');
      setSaving(checkKey);
      await w.save('inspection', {
        ...old,
        checkKey,
        item: label,
        rule,
        checked: status === 'pass',
        status,
        notes: old?.notes || '',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving('');
    }
  }
  return (
    <>
      <section className="panel robot-tool-intro">
        <div className="eyebrow">BIOBUZZ / SELF-INSPECTION</div>
        <h2>Be ready before the event.</h2>
        <p>
          This checklist follows FIRST's 2026–27 inspection sheet (V26-27.2, October 22, 2026). Mark
          each item Pass, Needs work, or N/A where conditional. Passing this self-check does not
          replace the event inspector.
        </p>
        <p className="inspection-progress">
          <ShieldCheck size={18} /> {completed} of {items.length} reviewed
        </p>
        <a href={INSPECTION_URL} target="_blank" rel="noopener noreferrer">
          Open the full official checklist (PDF) ↗
        </a>
      </section>
      {error && (
        <p role="alert" className="error notice">
          {error}
        </p>
      )}
      {inspectionGroups.map((group) => (
        <section className="panel inspection-group" key={group.title}>
          <h2>{group.title}</h2>
          <div className="inspection-items">
            {group.items.map((item) => {
              const [key, label, rule] = item;
              const status = byKey.get(key)?.status || 'unchecked';
              return (
                <div className="inspection-item" key={key}>
                  <div>
                    <strong>{label}</strong>
                    <a href={MANUAL_URL} target="_blank" rel="noopener noreferrer">
                      {rule} ↗
                    </a>
                  </div>
                  <div className="inspection-actions" role="group" aria-label={label}>
                    <button
                      disabled={!editable || !!saving}
                      className={status === 'pass' ? 'selected pass' : ''}
                      onClick={() => change(item, 'pass')}
                      aria-pressed={status === 'pass'}
                    >
                      <Check size={13} /> Pass
                    </button>
                    <button
                      disabled={!editable || !!saving}
                      className={status === 'needs' ? 'selected needs' : ''}
                      onClick={() => change(item, 'needs')}
                      aria-pressed={status === 'needs'}
                    >
                      <X size={13} /> Needs work
                    </button>
                    <button
                      disabled={
                        !editable ||
                        !!saving ||
                        ![
                          'coprocessor',
                          'usb',
                          'fuses',
                          'other-batteries',
                          'usb-power',
                          'grounding',
                          'custom-circuits',
                          'lasers',
                          'recording',
                          'cots',
                          'pneumatics',
                        ].includes(key)
                      }
                      className={status === 'na' ? 'selected' : ''}
                      onClick={() => change(item, 'na')}
                      aria-pressed={status === 'na'}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

const numberFields = [
  ['motorsUsed', 'DC motors used', 1],
  ['servosUsed', 'Servos used', 1],
  ['length', 'Starting length (in)', 0.1],
  ['width', 'Starting width (in)', 0.1],
  ['height', 'Starting height (in)', 0.1],
  ['horizontalShort', 'Expanded short horizontal side (in)', 0.1],
  ['horizontal', 'Expanded long horizontal side (in)', 0.1],
  ['vertical', 'Expanded height (in)', 0.1],
  ['weight', 'Robot weight (lb; informational)', 0.1],
];
export function LimitPanel({ w }) {
  const robot = w.data.robot[0];
  const [values, setValues] = useState(() =>
    Object.fromEntries(numberFields.map(([key]) => [key, robot?.[key] ?? ''])),
  );
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const editable = canEdit(w.member.role, w.member.mentor_edit);
  const preview = { ...robot, ...values };
  const result = legality(preview, [], officialRules);
  async function save(event) {
    event.preventDefault();
    const next = { ...robot, name: robot?.name || 'Team robot' };
    for (const [key, value] of Object.entries(values)) {
      if (value === '') delete next[key];
      else next[key] = Number(value);
    }
    try {
      setBusy(true);
      setError('');
      setNote('');
      await w.save('robot', next);
      setNote('Robot measurements and counts saved for the team.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const capacity = (key, label, limit) => {
    const value = remainingCapacity(values[key], limit);
    return (
      <div className={`capacity-card ${value !== null && value < 0 ? 'over' : ''}`}>
        <small>{label}</small>
        <strong>{value === null ? '—' : value >= 0 ? value : Math.abs(value)}</strong>
        <span>
          {value === null
            ? 'Enter count below'
            : value >= 0
              ? `remaining of ${limit}`
              : `over the ${limit} limit`}
        </span>
      </div>
    );
  };
  return (
    <>
      <section className="panel robot-tool-intro">
        <div className="eyebrow">OFFICIAL 2026–27 BIOBUZZ LIMITS</div>
        <h2>Know the limit. Count your build.</h2>
        <p>
          These values come from the current FIRST Competition Manual: R102, R104, R105, and R503.
          The 6-inch and 11-inch allowances shown below are differences from the 18-inch starting
          cube, not independent extension tests. The fully expanded robot must fit the whole 18 × 24
          × 29-inch volume.
        </p>
        <a href={MANUAL_URL} target="_blank" rel="noopener noreferrer">
          Read the current competition manual ↗
        </a>
      </section>
      <div className="capacity-grid">
        {capacity('motorsUsed', 'DC MOTORS', 8)}
        {capacity('servosUsed', 'SERVOS', 8)}
      </div>
      <div className="table-scroll panel limits-table">
        <table>
          <thead>
            <tr>
              {[
                'Ruleset name',
                'Max DC motors',
                'Max servos',
                'Sizing cube (in)',
                'Max horizontal envelope (in)',
                'Max vertical envelope (in)',
                'Horizontal extension difference (in)',
                'Vertical extension difference (in)',
                'Weight limit (lb, 0 = none)',
                'Verified against manual',
                'Official source',
              ].map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{officialRules.name}</td>
              <td>8</td>
              <td>8</td>
              <td>18 × 18 × 18</td>
              <td>18 × 24</td>
              <td>29</td>
              <td>6</td>
              <td>11</td>
              <td>0 · none</td>
              <td>Yes · TU06</td>
              <td>
                <a href={MANUAL_URL} target="_blank" rel="noopener noreferrer">
                  FIRST manual ↗
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <section className="panel settings-panel">
        <h2>Enter what your team uses</h2>
        <p>
          The counts and measurements are shared with your team. Check them after robot changes.
        </p>
        <form onSubmit={save}>
          <div className="form-grid">
            {numberFields.map(([key, label, step]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min="0"
                  step={step}
                  value={values[key]}
                  disabled={!editable || busy}
                  onChange={(event) => setValues((old) => ({ ...old, [key]: event.target.value }))}
                />
              </label>
            ))}
          </div>
          <p className="note">
            The port map currently lists{' '}
            {w.data.hardware.filter((h) => h.kind === 'DC motor' && h.name).length} motors and{' '}
            {w.data.hardware.filter((h) => h.kind === 'Servo' && h.name).length} servos. Enter the
            actual total installed on the robot above.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {note && (
            <p role="status" className="success">
              {note}
            </p>
          )}
          {editable && (
            <button className="primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save counts & measurements'}
            </button>
          )}
        </form>
      </section>
      <section className="panel">
        <h2>Measured value check</h2>
        <p className="note">
          A missing value means this comparison is incomplete. The event inspector makes the
          official decision.
        </p>
        <div className="limit-checks">
          {result.checks.map((check) => (
            <div className="check-row" key={check.name}>
              <span>{check.name}</span>
              <b
                className={check.actual === 'Missing' ? 'muted' : check.pass ? 'success' : 'error'}
              >
                {check.actual} / {check.max}
              </b>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
