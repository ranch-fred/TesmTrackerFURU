import React, { useEffect, useRef, useState } from 'react';
import { Cpu, ChevronRight, ArrowRight, Check, Cable } from 'lucide-react';
import { canEdit } from './domain';
import { Modal } from './Records';
import { hardwarePortName } from './robot-rules';
import { useMotion } from './Motion';
import {
  ACTUATOR_LIMIT,
  robotKey,
  robotRecords,
  PORT_GROUPS,
  hubPort,
  portPosition,
} from './robot-workspace';
import HubWiring from './HubWiring';

const displayType = (type) => (type === 'I2C' ? 'I²C' : type === 'Power' ? '5V power' : type);
const shortType = (type) =>
  ({
    Motor: 'M',
    Servo: 'S',
    I2C: 'I',
    Digital: 'D',
    Analog: 'A',
    UART: 'U',
    RS485: 'R',
    Battery: 'B',
    Power: 'P',
  })[type];

export default function PhotoHardwareMap({ w, robot, firstRobot, onDirtyChange }) {
  const [hub, setHub] = useState('Control Hub');
  const [type, setType] = useState('Motor');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', device: '', encoderConnected: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(null);
  const [saved, setSaved] = useState(false);
  const editorRef = useRef(null);
  const { enabled } = useMotion();
  const records = robotRecords(w.data.hardware, robot, firstRobot);
  const editable = canEdit(w.member.role, w.member.mentor_edit);
  const recordAt = (port) => records.find((r) => r.hub === hub && hardwarePortName(r) === port);
  const totals = (kind) => records.filter((r) => r.kind === kind && r.name).length;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  useEffect(() => {
    editorRef.current?.scrollIntoView({ block: 'nearest', behavior: enabled ? 'smooth' : 'auto' });
  }, [selected?.port, selected?.hub, enabled]);
  function request(action) {
    if (dirty) setPending(() => action);
    else action();
  }
  function open(nextType, port) {
    if (selected?.port === port && selected.hub === hub) return;
    request(() => {
      const record = recordAt(port);
      setType(nextType);
      setSelected({ port, record, hub, type: nextType });
      setForm({
        name: record?.name || '',
        device: record?.device || '',
        encoderConnected: !!record?.encoderConnected,
      });
      setError('');
      setDirty(false);
      setSaved(false);
    });
  }
  function change(key, value) {
    setForm((old) => ({ ...old, [key]: value }));
    setDirty(true);
    setSaved(false);
  }
  async function save(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const name = form.name.trim();
      if (
        name &&
        records.some(
          (r) => r.id !== selected.record?.id && r.name?.toLowerCase() === name.toLowerCase(),
        )
      )
        throw Error('Use a unique hardware name for this robot.');
      const kind =
        selected.type === 'Motor' ? 'DC motor' : selected.type === 'Servo' ? 'Servo' : 'Sensor';
      if (
        name &&
        ['DC motor', 'Servo'].includes(kind) &&
        !selected.record?.name &&
        totals(kind) >= ACTUATOR_LIMIT
      )
        throw Error(`This robot already has 8 ${kind === 'Servo' ? 'servos' : 'motors'} assigned.`);
      if (!robot.robotKey) await w.save('robot', { ...robot, robotKey: robotKey(robot) });
      if (selected.record || name) {
        const record = await w.save('hardware', {
          ...selected.record,
          robotKey: robotKey(robot),
          name,
          device: form.device.trim(),
          hub: selected.hub,
          port: selected.port,
          kind,
          encoderConnected: kind === 'DC motor' && Boolean(name) && form.encoderConnected,
        });
        setSelected((old) => ({ ...old, record }));
      }
      setDirty(false);
      setSaved(true);
      if (!name) setForm({ name: '', device: '', encoderConnected: false });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function editor() {
    return (
      <form className="rw-inline-port-editor" onSubmit={save} ref={editorRef}>
        <label>
          Hardware name
          <input
            disabled={!editable || busy}
            value={form.name}
            onChange={(e) => change('name', e.target.value)}
            placeholder="frontLeft, claw, mainBattery…"
          />
        </label>
        <label>
          Purpose
          <textarea
            rows={2}
            disabled={!editable || busy}
            value={form.device}
            onChange={(e) => change('device', e.target.value)}
            placeholder="What does this connection do?"
          />
        </label>
        {type === 'Motor' && (
          <label className="rw-encoder-option">
            <input
              type="checkbox"
              disabled={!editable || busy}
              checked={form.encoderConnected}
              onChange={(e) => change('encoderConnected', e.target.checked)}
            />
            <Cable size={15} />
            <span>
              Encoder wire<small>Connect this motor's matching encoder port.</small>
            </span>
          </label>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="rw-port-saved" role="status">
            <Check size={12} />
            Connection saved
          </p>
        )}
        <div className="rw-port-editor-actions">
          <button
            type="button"
            className="outline"
            disabled={busy}
            onClick={() => {
              setSelected(null);
              setDirty(false);
            }}
          >
            Close
          </button>
          {editable && (
            <button className="primary" disabled={busy || (!form.name.trim() && !selected.record)}>
              {busy ? 'Saving…' : form.name.trim() ? 'Save' : 'Clear port'}
            </button>
          )}
        </div>
      </form>
    );
  }
  return (
    <div className="rw-hardware">
      <div className="rw-map-heading">
        <div>
          <span className="rw-kicker">{robot.name} / HARDWARE MAP</span>
          <h2>Plug in. Give it purpose.</h2>
          <p>Choose any connector. Its settings open alongside the hub.</p>
        </div>
        <div className="rw-map-counts">
          <span>
            <b>{totals('DC motor')}</b>/8 motors
          </span>
          <span>
            <b>{totals('Servo')}</b>/8 servos
          </span>
        </div>
      </div>
      <div className="rw-hub-switch" role="group" aria-label="Choose a hub">
        {['Control Hub', 'Expansion Hub'].map((name) => (
          <button
            key={name}
            disabled={busy}
            aria-pressed={hub === name}
            onClick={() => {
              if (hub !== name)
                request(() => {
                  setHub(name);
                  setSelected(null);
                  setDirty(false);
                  setSaved(false);
                });
            }}
          >
            <Cpu size={18} />
            <span>
              {name}
              <small>
                {name === 'Control Hub' ? 'PRIMARY CONTROLLER' : 'ADDITIONAL CONNECTIONS'}
              </small>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      <div className="rw-map-layout">
        <div className="rw-hub-photo">
          <img
            src={`/assets/hubs/${hub === 'Control Hub' ? 'control' : 'expansion'}.png`}
            alt={`REV ${hub}, select a connector to configure it`}
            draggable="false"
          />
          <HubWiring hub={hub} records={records} />
          {PORT_GROUPS.flatMap(([name, count]) =>
            Array.from({ length: count }, (_, i) => {
              const port = hubPort(name, i),
                record = recordAt(port),
                [x, y] = portPosition(hub, name, i);
              return (
                <button
                  key={port}
                  disabled={busy}
                  className={`rw-port-hotspot ${name === type ? 'active-type' : 'inactive-type'} ${record?.name ? 'assigned' : ''} ${selected?.port === port ? 'selected' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => open(name, port)}
                  aria-label={`${hub} ${port}: ${record?.name || 'Unassigned'}`}
                  aria-pressed={selected?.port === port}
                  title={`${port} · ${record?.name || 'Click to assign'}`}
                >
                  <span>
                    {shortType(name)}
                    {['Digital', 'Analog'].includes(name) ? `${i * 2}/${i * 2 + 1}` : i}
                  </span>
                </button>
              );
            }),
          )}
          {Array.from({ length: 4 }, (_, i) => {
            const [x, y] = portPosition(hub, 'Encoder', i),
              motor = recordAt(`Motor ${i}`);
            return (
              <button
                key={`encoder${i}`}
                className={`rw-port-hotspot rw-encoder-hotspot ${type === 'Motor' ? 'active-type' : 'inactive-type'} ${motor?.name && motor.encoderConnected ? 'assigned' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                disabled={busy}
                onClick={() => open('Motor', `Motor ${i}`)}
                aria-label={`${hub} Motor ${i} encoder settings`}
                title={`Motor ${i} encoder`}
              >
                <span>E{i}</span>
              </button>
            );
          })}
        </div>
        <aside className="rw-port-panel">
          <span className="rw-kicker">CONNECTION SETTINGS</span>
          <div className="rw-port-types" role="group" aria-label="Port type">
            {PORT_GROUPS.map(([name, count]) => (
              <button
                key={name}
                disabled={busy}
                aria-pressed={type === name}
                onClick={() => {
                  if (name !== type)
                    request(() => {
                      setType(name);
                      setSelected(null);
                      setDirty(false);
                      setSaved(false);
                    });
                }}
              >
                {displayType(name)}
                <span>{count}</span>
              </button>
            ))}
          </div>
          <div className="rw-port-list">
            {Array.from({ length: PORT_GROUPS.find(([name]) => name === type)[1] }, (_, i) => {
              const port = hubPort(type, i),
                record = recordAt(port),
                active = selected?.port === port;
              return (
                <div key={port} className={`rw-port-entry ${active ? 'selected' : ''}`}>
                  <button
                    type="button"
                    disabled={busy}
                    aria-expanded={active}
                    onClick={() => open(type, port)}
                  >
                    <span className={record?.name ? 'assigned' : ''} />
                    <div>
                      <strong>{record?.name || port}</strong>
                      <small>
                        {record?.name
                          ? `${port} · ${record.device || 'No purpose recorded'}`
                          : 'Available · click to configure'}
                      </small>
                      {type === 'Motor' && record?.name && record.encoderConnected && (
                        <small className="rw-encoder-status">Encoder connected</small>
                      )}
                    </div>
                    <ArrowRight size={14} />
                  </button>
                  {active && editor()}
                </div>
              );
            })}
          </div>
          <p className="rw-map-note">
            Changes belong to {robot.name}. Use Robot Controller names for programmable devices.
          </p>
        </aside>
      </div>
      {pending && (
        <Modal title="Leave unsaved connection changes?" onClose={() => setPending(null)}>
          <p>Your connection edits have not been saved.</p>
          <div className="modal-actions">
            <button className="outline" onClick={() => setPending(null)}>
              Keep editing
            </button>
            <button
              className="primary"
              onClick={() => {
                pending();
                setPending(null);
              }}
            >
              Discard edits
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
