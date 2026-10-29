import React, { useEffect, useState } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Bot,
  Cable,
  ShieldCheck,
  Save,
  ArrowRight,
  Check,
} from 'lucide-react';
import { canEdit } from './domain';
import { Modal } from './Records';
import { InspectionChecklist } from './RobotTools';
import { ACTUATOR_LIMIT, robotKey, robotRecords, validateRobotCounts } from './robot-workspace';
import './robot-workspace.css';
import PhotoHardwareMap from './PhotoHardwareMap';

const sections = [
  ['robot', 'The machine', 'Specs & dimensions', Bot],
  ['hardware', 'Connections', 'Interactive hub map', Cable],
  ['inspection', 'Ready to roll', 'Inspection checklist', ShieldCheck],
];
const measurements = [
  ['length', 'Length', 'in'],
  ['width', 'Width', 'in'],
  ['height', 'Height', 'in'],
  ['weight', 'Weight', 'lb'],
];

function RobotSpecForm({ robot, w, onSaved, onCancel }) {
  const [draft, setDraft] = useState(
    robot || {
      robotKey: crypto.randomUUID(),
      name: '',
      drivetrain: '',
      motorsUsed: '',
      servosUsed: '',
    },
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const editable = canEdit(w.member.role, w.member.mentor_edit);
  const set = (key, value) => {
    setDraft((old) => ({ ...old, [key]: value }));
    setSaved(false);
  };
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const next = { ...draft, name: draft.name.trim(), robotKey: robotKey(draft) };
      for (const key of [
        'length',
        'width',
        'height',
        'weight',
        'motorsUsed',
        'servosUsed',
        'horizontalShort',
        'horizontal',
        'vertical',
      ])
        if (next[key] === '') delete next[key];
      validateRobotCounts(next);
      const record = await w.save('robot', next);
      setDraft(record);
      setSaved(true);
      onSaved(record);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="rw-spec-form" onSubmit={submit}>
      <div className="rw-spec-layout">
        <section className="rw-visual">
          <span className="rw-kicker">YOUR MACHINE / {w.team.number}</span>
          <h2>{draft.name || 'A new beginning.'}</h2>
          <div className="robot-schematic rw-live-schematic" aria-label="Robot dimensional diagram">
            <div
              className="schematic-body"
              style={{
                '--rw-body-width': `${Number(draft.width) > 0 ? Math.min(190, Math.max(12, Number(draft.width) * 7)) : 128}px`,
                '--rw-body-length': `${Number(draft.length) > 0 ? Math.min(190, Math.max(12, Number(draft.length) * 7)) : 128}px`,
              }}
            >
              <div
                className="rw-dimension-width"
                aria-label={`Width ${draft.width || 'not entered'} inches`}
              >
                {draft.width || '—'} IN
              </div>
              <div
                className="rw-dimension-length"
                aria-label={`Length ${draft.length || 'not entered'} inches`}
              >
                <span>{draft.length || '—'} IN</span>
              </div>
              <span className="schematic-core">{w.team.number}</span>
              <span className="schematic-line" />
            </div>
            <span className="schematic-caption">TOP VIEW / DIMENSIONAL REFERENCE</span>
          </div>
          <div className="rw-capacities">
            {[
              ['motorsUsed', 'MOTORS'],
              ['servosUsed', 'SERVOS'],
            ].map(([key, label]) => (
              <div key={key}>
                <span>{label}</span>
                <strong>
                  {draft[key] === '' || draft[key] === undefined ? '—' : draft[key]}
                  <small> / 8</small>
                </strong>
                <div className="rw-capacity-bars" aria-hidden="true">
                  {Array.from({ length: 8 }, (_, i) => (
                    <i key={i} className={i < Number(draft[key]) ? 'filled' : ''} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rw-spec-fields">
          <div className="rw-section-title">
            <span>01</span>
            <div>
              <h3>Make it yours.</h3>
              <p>The essentials, all in one place.</p>
            </div>
          </div>
          <fieldset disabled={!editable || busy}>
            <label>
              Robot name
              <input
                required
                value={draft.name || ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Give your robot a name"
                maxLength={120}
              />
            </label>
            <label>
              Drivetrain
              <input
                value={draft.drivetrain || ''}
                onChange={(e) => set('drivetrain', e.target.value)}
                placeholder="Mecanum, tank, swerve…"
              />
            </label>
            <div className="rw-fields-grid">
              {measurements.map(([key, label, unit]) => (
                <label key={key}>
                  {label} <span className="rw-unit">{unit}</span>
                  <input
                    aria-label={`${label} (${unit})`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={draft[key] ?? ''}
                    onChange={(e) => set(key, e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.0"
                  />
                </label>
              ))}
            </div>
            <div className="rw-fields-grid">
              {[
                ['motorsUsed', 'DC motors'],
                ['servosUsed', 'Servos'],
              ].map(([key, label]) => (
                <label key={key}>
                  {label} <span className="rw-unit">0–8</span>
                  <input
                    type="number"
                    min="0"
                    max={ACTUATOR_LIMIT}
                    step="1"
                    value={draft[key] ?? ''}
                    onChange={(e) => set(key, e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                  />
                </label>
              ))}
            </div>
            <details className="rw-extra">
              <summary>
                Expanded dimensions <ChevronDown size={14} />
              </summary>
              <div className="rw-fields-grid">
                {[
                  ['horizontalShort', 'Expanded short side'],
                  ['horizontal', 'Expanded long side'],
                  ['vertical', 'Expanded height'],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label} (in)
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={draft[key] ?? ''}
                      onChange={(e) =>
                        set(key, e.target.value === '' ? '' : Number(e.target.value))
                      }
                    />
                  </label>
                ))}
              </div>
            </details>
          </fieldset>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="rw-form-footer">
            {saved && (
              <span role="status">
                <Check size={14} /> Robot saved
              </span>
            )}
            {!robot && (
              <button type="button" className="outline" onClick={onCancel}>
                Cancel
              </button>
            )}
            {editable && (
              <button className="primary" disabled={busy}>
                <Save size={15} />
                {busy ? 'Saving…' : 'Save robot'}
              </button>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}

export default function RobotWorkspace({ w, initial = 'robot' }) {
  const [activeId, setActiveId] = useState(w.data.robot[0]?.id || null);
  const [adding, setAdding] = useState(!w.data.robot.length);
  const [collapsed, setCollapsed] = useState(false);
  const [newVersion, setNewVersion] = useState(0);
  const [tab, setTab] = useState(sections.some(([key]) => key === initial) ? initial : 'robot');
  const [confirm, setConfirm] = useState(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const editable = canEdit(w.member.role, w.member.mentor_edit);
  const active = w.data.robot.find((r) => r.id === activeId) || w.data.robot[0];
  useEffect(() => {
    if (sections.some(([key]) => key === initial)) setTab(initial);
  }, [initial]);
  function navigate(action) {
    if (draftDirty) setConfirm(() => action);
    else action();
  }
  function choose(id) {
    if (!adding && active?.id === id) {
      setCollapsed((value) => !value);
      return;
    }
    navigate(() => {
      setActiveId(id);
      setAdding(false);
      setCollapsed(false);
      setDraftDirty(false);
    });
  }
  const scoped = {
    ...w,
    data: { ...w.data, inspection: robotRecords(w.data.inspection, active, w.data.robot[0]) },
    save: async (kind, record) => {
      if (!active.robotKey) await w.save('robot', { ...active, robotKey: robotKey(active) });
      return w.save(kind, { ...record, robotKey: robotKey(active) });
    },
  };
  return (
    <div className="rw-workspace">
      <header className="rw-heading">
        <div>
          <span className="rw-kicker">ROBOT / YOUR BUILD STATION</span>
          <h1>
            Meet your <span>machine.</span>
          </h1>
          <p>A home for every robot. A purpose for every connection.</p>
        </div>
        {editable && (
          <button
            className="primary"
            onClick={() =>
              navigate(() => {
                setAdding(true);
                setCollapsed(false);
                setNewVersion((v) => v + 1);
                setTab('robot');
                setDraftDirty(false);
              })
            }
          >
            <Plus size={16} />
            Add robot
          </button>
        )}
      </header>
      <div className="rw-robot-roster" aria-label="Your robots">
        {w.data.robot.map((robot) => (
          <div
            key={robot.id}
            className={`rw-robot-entry ${!adding && !collapsed && active?.id === robot.id ? 'active' : ''}`}
          >
            <button
              aria-expanded={!adding && !collapsed && active?.id === robot.id}
              onClick={() => choose(robot.id)}
            >
              <Bot size={19} />
              <span>
                {robot.name || 'Unnamed robot'}
                <small>{robot.drivetrain || 'Robot profile'}</small>
              </span>
              {!adding && !collapsed && active?.id === robot.id ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          </div>
        ))}
        {adding && (
          <div className="rw-new-profile">
            <Plus size={16} /> New robot profile
          </div>
        )}
      </div>
      <div hidden={collapsed && !adding}>
        <nav className="rw-deck" aria-label="Robot sections">
          {sections.map(([key, title, subtitle, Icon], i) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              aria-current={tab === key ? 'page' : undefined}
              disabled={(adding && key !== 'robot') || (!active && key !== 'robot')}
              onClick={() => {
                if (tab !== key)
                  navigate(() => {
                    setTab(key);
                    setDraftDirty(false);
                  });
              }}
            >
              <span className="rw-deck-number">0{i + 1}</span>
              <Icon size={24} strokeWidth={1.4} />
              <div>
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </div>
              <ArrowRight size={17} />
            </button>
          ))}
        </nav>
        {tab === 'robot' && (editable || active) ? (
          <div onChange={() => setDraftDirty(true)}>
            <RobotSpecForm
              key={adding ? `new-${newVersion}` : active?.id}
              robot={adding ? null : active}
              w={w}
              onSaved={(r) => {
                setActiveId(r.id);
                setAdding(false);
                setDraftDirty(false);
              }}
              onCancel={() => {
                setAdding(false);
                setDraftDirty(false);
              }}
            />
          </div>
        ) : tab === 'hardware' && active ? (
          <PhotoHardwareMap
            key={active.id}
            robot={active}
            firstRobot={w.data.robot[0]}
            w={w}
            onDirtyChange={setDraftDirty}
          />
        ) : tab === 'inspection' && active ? (
          <div className="rw-inspection">
            <InspectionChecklist key={active.id} w={scoped} />
          </div>
        ) : (
          <div className="rw-blank">
            <Bot size={36} />
            <h2>No robot yet.</h2>
            <p>A team editor can add your first robot profile.</p>
          </div>
        )}
      </div>
      {confirm && (
        <Modal title="Leave unsaved robot changes?" onClose={() => setConfirm(null)}>
          <p>Your current edits have not been saved.</p>
          <div className="modal-actions">
            <button className="outline" onClick={() => setConfirm(null)}>
              Keep editing
            </button>
            <button
              className="primary"
              onClick={() => {
                confirm();
                setConfirm(null);
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
