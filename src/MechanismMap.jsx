import React, { useMemo, useRef, useState } from 'react';
import {
  Blocks,
  Bot,
  Box,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Hammer,
  Maximize2,
  Plus,
  Wrench,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { canDelete, canEdit, rosterWithMembers, uid } from './domain';
import { localDate } from './logs';
import {
  NODE,
  STAGES,
  layoutChart,
  logKind,
  makeMechanismEntry,
  mechanismSummary,
  safeUrl,
} from './mechanisms';
import { Badge, Modal } from './Records';
import './mechanism-map.css';

const STAGE_ICON = { mechanism: Wrench, cad: Box, build: Hammer, parts: Blocks, code: Code2 };
const STATUS_TEXT = { empty: 'Not started', active: 'In progress', done: 'Done' };

function Person({ value, onChange, people, label, disabled }) {
  return (
    <label>
      {label}
      <select value={value || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value="">Not assigned</option>
        {value && !people.includes(value) && <option>{value}</option>}
        {people.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
    </label>
  );
}

function MechanismFields({ initial, people, canWrite, onSave, submitLabel }) {
  const [form, setForm] = useState({ name: '', purpose: '', builder: '', ...initial });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form
      className="mm-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <label>
        Mechanism name
        <input
          required
          disabled={!canWrite}
          value={form.name}
          placeholder="Intake, Lift, Launcher…"
          onChange={(e) => set('name')(e.target.value)}
        />
      </label>
      <label>
        What does it do?
        <textarea
          disabled={!canWrite}
          rows={2}
          value={form.purpose}
          onChange={(e) => set('purpose')(e.target.value)}
        />
      </label>
      <Person
        label="Who is building it?"
        value={form.builder}
        onChange={set('builder')}
        people={people}
        disabled={!canWrite}
      />
      {canWrite && <button className="primary small">{submitLabel}</button>}
    </form>
  );
}

function EntryList({ rows, render, empty }) {
  if (!rows.length) return <p className="muted mm-empty">{empty}</p>;
  return (
    <ul className="mm-entries">
      {[...rows].reverse().map((r) => (
        <li key={r.id}>{render(r)}</li>
      ))}
    </ul>
  );
}

function LinkOut({ href, children }) {
  const url = safeUrl(href);
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mm-link">
      <ExternalLink size={13} /> {children}
    </a>
  ) : null;
}

function CopyCode({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="icon-button"
      aria-label="Copy code"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

// add-entry form shared by the CAD, build and programming stages
function EntryForm({ stage, onSubmit }) {
  const [f, setF] = useState({ date: localDate(), result: 'Needs testing' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (await onSubmit(f)) setF({ date: localDate(), result: 'Needs testing' });
  };
  return (
    <form className="mm-form" onSubmit={submit}>
      {stage === 'cad' ? (
        <>
          <label>
            CAD entry name
            <input required value={f.title || ''} onChange={set('title')} placeholder="Intake v2" />
          </label>
          <label>
            Link to the CAD file
            <input
              type="url"
              value={f.link || ''}
              onChange={set('link')}
              placeholder="Google Drive, Onshape, GitHub…"
            />
          </label>
          <label>
            Notes
            <textarea rows={2} value={f.notes || ''} onChange={set('notes')} />
          </label>
        </>
      ) : (
        <>
          <label>
            Date
            <input required type="date" value={f.date} onChange={set('date')} />
          </label>
          <label>
            What did you do?
            <textarea required rows={2} value={f.whatDone || ''} onChange={set('whatDone')} />
          </label>
          {stage === 'build' && (
            <label>
              Extra notes
              <textarea rows={2} value={f.notes || ''} onChange={set('notes')} />
            </label>
          )}
          {stage === 'code' && (
            <>
              <label>
                GitHub link
                <input
                  type="url"
                  value={f.github || ''}
                  onChange={set('github')}
                  placeholder="https://github.com/team/repo/blob/main/Intake.java"
                />
              </label>
              <label>
                Code snippet
                <textarea
                  className="mm-code-input"
                  rows={5}
                  spellCheck={false}
                  value={f.snippet || ''}
                  onChange={set('snippet')}
                />
              </label>
              <label>
                Test result
                <select value={f.result} onChange={set('result')}>
                  {['Needs testing', 'Pass', 'Fail'].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </>
      )}
      <button className="primary small">
        <Plus size={14} /> Add {stage === 'cad' ? 'CAD entry' : 'log'}
      </button>
    </form>
  );
}

function PartsPanel({ mech, canWrite, saveMech }) {
  const [name, setName] = useState('');
  const parts = mech.parts || [];
  const update = (next) => saveMech({ ...mech, parts: next });
  return (
    <>
      <p className="muted">
        List the pieces of code this mechanism needs, such as classes, methods or OpMode steps.
      </p>
      <ul className="mm-entries">
        {parts.map((p) => (
          <li key={p.id} className="mm-part">
            <label className="check-label">
              <input
                type="checkbox"
                checked={!!p.done}
                disabled={!canWrite}
                onChange={() =>
                  update(parts.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)))
                }
              />{' '}
              <span className={p.done ? 'mm-struck' : ''}>{p.name}</span>
            </label>
            {canWrite && (
              <button
                className="icon-button"
                aria-label={`Remove ${p.name}`}
                onClick={() => update(parts.filter((x) => x.id !== p.id))}
              >
                <X size={14} />
              </button>
            )}
          </li>
        ))}
        {!parts.length && <p className="muted mm-empty">No code parts yet.</p>}
      </ul>
      {canWrite && (
        <form
          className="mm-inline"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            update([...parts, { id: uid(), name: name.trim(), done: false }]);
            setName('');
          }}
        >
          <input
            aria-label="New code part"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="IntakeController class"
          />
          <button className="primary small">
            <Plus size={14} /> Add
          </button>
        </form>
      )}
    </>
  );
}

function Drawer({ mech, stage, summary, w, people, canWrite, onClose, saveMech, addEntry }) {
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const Icon = STAGE_ICON[stage];
  const info = summary[stage];
  const label = STAGES.find((s) => s.id === stage).label;
  const guard = async (fn) => {
    setError('');
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  const toggleDone = () =>
    guard(() => saveMech({ ...mech, done: { ...mech.done, [stage]: !mech.done?.[stage] } }));
  return (
    <aside className="mm-drawer" aria-label={`${mech.name} ${label}`}>
      <header>
        <span className="mm-drawer-icon">
          <Icon size={18} />
        </span>
        <div>
          <small>{mech.name}</small>
          <h2>{stage === 'mechanism' ? 'Mechanism details' : label}</h2>
        </div>
        <button className="icon-button" aria-label="Close panel" onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {stage !== 'mechanism' && (
        <div className="mm-status-row">
          <Badge tone={info.status === 'done' ? 'green' : info.status === 'active' ? 'orange' : ''}>
            {STATUS_TEXT[info.status]}
          </Badge>
          {canWrite && (
            <button className="outline small" onClick={toggleDone}>
              {mech.done?.[stage] ? 'Reopen' : 'Mark as done'}
            </button>
          )}
        </div>
      )}

      {stage === 'mechanism' && (
        <>
          <MechanismFields
            key={mech.id}
            initial={mech}
            people={people}
            canWrite={canWrite}
            submitLabel="Save changes"
            onSave={(f) => guard(() => saveMech({ ...mech, ...f }))}
          />
          {summary.hardware.length > 0 && (
            <p className="muted">
              Wired to {summary.hardware.length} hardware map{' '}
              {summary.hardware.length === 1 ? 'entry' : 'entries'}:{' '}
              {summary.hardware.map((h) => h.name).join(', ')}.
            </p>
          )}
          {canDelete(w.member.role) &&
            (confirm ? (
              <div className="mm-confirm">
                <p>Delete {mech.name}? Its CAD, build and programming logs are kept.</p>
                <button
                  className="primary danger-button small"
                  onClick={() =>
                    guard(async () => {
                      await w.remove('subsystems', mech.id);
                      onClose();
                    })
                  }
                >
                  Delete mechanism
                </button>
                <button className="outline small" onClick={() => setConfirm(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="text-button" onClick={() => setConfirm(true)}>
                Delete this mechanism
              </button>
            ))}
        </>
      )}

      {stage === 'cad' && (
        <>
          <EntryList
            rows={info.items}
            empty="No CAD entries yet. Add the first one below."
            render={(r) => (
              <>
                <strong>{r.title}</strong>
                <small>{r.proposedBy}</small>
                {r.description && <p>{r.description}</p>}
                <LinkOut href={r.cadLink}>Open CAD file</LinkOut>
              </>
            )}
          />
          {canWrite && <EntryForm stage="cad" onSubmit={(f) => guard(() => addEntry('cad', f))} />}
        </>
      )}

      {stage === 'build' && (
        <>
          <Person
            label="Who is building it?"
            value={mech.builder}
            people={people}
            disabled={!canWrite}
            onChange={(v) => guard(() => saveMech({ ...mech, builder: v }))}
          />
          <EntryList
            rows={info.items}
            empty="No build logs yet."
            render={(r) => (
              <>
                <strong>{r.date}</strong> <small>{r.author}</small>
                <p>{r.whatDone}</p>
                {r.notes && r.notes !== r.whatDone && <p className="muted">{r.notes}</p>}
              </>
            )}
          />
          {canWrite && (
            <EntryForm stage="build" onSubmit={(f) => guard(() => addEntry('build', f))} />
          )}
        </>
      )}

      {stage === 'parts' && (
        <PartsPanel mech={mech} canWrite={canWrite} saveMech={(m) => guard(() => saveMech(m))} />
      )}

      {stage === 'code' && (
        <>
          {!summary.readyForCode && (
            <p className="muted">
              Tip: mark the build as done, then assign a programmer so they can start on working
              hardware.
            </p>
          )}
          <Person
            label="Who is programming it?"
            value={mech.programmer}
            people={people}
            disabled={!canWrite}
            onChange={(v) => guard(() => saveMech({ ...mech, programmer: v }))}
          />
          <EntryList
            rows={info.items}
            empty="No programming logs yet."
            render={(r) => (
              <>
                <strong>{r.date}</strong> <small>{r.author}</small>{' '}
                {r.result && <Badge>{r.result}</Badge>}
                <p>{r.whatDone}</p>
                <LinkOut href={r.github}>View on GitHub</LinkOut>
                {r.snippet && (
                  <div className="mm-code">
                    <CopyCode text={r.snippet} />
                    <pre>{r.snippet}</pre>
                  </div>
                )}
              </>
            )}
          />
          {canWrite && (
            <EntryForm stage="code" onSubmit={(f) => guard(() => addEntry('code', f))} />
          )}
        </>
      )}
    </aside>
  );
}

function nodeText(stage, mech, s) {
  if (stage === 'mechanism')
    return [mech.builder ? `Builder: ${mech.builder}` : 'Assign a builder', mech.purpose || ''];
  if (stage === 'cad')
    return [`${s.cad.items.length} CAD ${s.cad.items.length === 1 ? 'entry' : 'entries'}`, ''];
  if (stage === 'build')
    return [
      `${s.build.items.length} build ${s.build.items.length === 1 ? 'log' : 'logs'}`,
      mech.builder || 'No builder yet',
    ];
  if (stage === 'parts') {
    const done = s.parts.items.filter((p) => p.done).length;
    return [`${done} of ${s.parts.items.length} parts done`, ''];
  }
  return [
    `${s.code.items.length} code ${s.code.items.length === 1 ? 'log' : 'logs'}`,
    mech.programmer || (s.readyForCode ? 'Ready: assign a programmer' : 'No programmer yet'),
  ];
}

export default function MechanismMap({ w }) {
  const mechs = w.data.subsystems;
  const canWrite = canEdit(w.member.role, w.member.mentor_edit);
  const [sel, setSel] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const viewport = useRef(null);
  const pan = useRef(null);
  const people = useMemo(
    () => [
      ...new Set(
        rosterWithMembers(w.data.roster, w.members)
          .map((r) => r.name)
          .filter(Boolean),
      ),
    ],
    [w.data.roster, w.members],
  );
  const layout = useMemo(() => layoutChart(mechs.length), [mechs.length]);
  const summaries = useMemo(() => mechs.map((m) => mechanismSummary(m, w.data)), [mechs, w.data]);
  const robot = w.data.robot[0];
  const selected = sel && mechs.find((m) => m.id === sel.id);

  const saveMech = (m) => w.save('subsystems', m);
  async function addEntry(stage, fields) {
    const entry = makeMechanismEntry(stage, selected, fields, w.member, w.user.id);
    await w.save(logKind(stage), entry);
  }
  const fit = () => {
    const room = viewport.current?.clientWidth || layout.width;
    setZoom(Math.min(1, Math.max(0.4, (room - 8) / layout.width)));
  };
  const zoomBy = (d) => setZoom((z) => Math.min(1.4, Math.max(0.4, +(z + d).toFixed(2))));

  // drag empty space to pan the chart
  const onDown = (e) => {
    if (e.target.closest('button, a, input, select, textarea')) return;
    const v = viewport.current;
    pan.current = { x: e.clientX, y: e.clientY, l: v.scrollLeft, t: v.scrollTop };
    v.setPointerCapture(e.pointerId);
    v.classList.add('panning');
  };
  const onMove = (e) => {
    const p = pan.current;
    if (!p) return;
    viewport.current.scrollLeft = p.l - (e.clientX - p.x);
    viewport.current.scrollTop = p.t - (e.clientY - p.y);
  };
  const onUp = () => {
    pan.current = null;
    viewport.current?.classList.remove('panning');
  };

  return (
    <>
      <div className="page-intro compact-intro">
        <div className="eyebrow">ROBOT / MECHANISM CHART</div>
        <h1>
          FROM IDEA TO <span>CODE.</span>
        </h1>
        <p className="muted">
          Add each mechanism, then follow it from CAD to build to code. Click any box to assign
          people and add logs. Everything you add also appears in the Build, Programming and Design
          logs.
        </p>
      </div>
      {error && (
        <p role="alert" className="error notice">
          {error}
        </p>
      )}
      <section className="panel mm-panel">
        <div className="mm-toolbar">
          <div className="mm-legend" aria-label="Status key">
            <span className="empty">Not started</span>
            <span className="active">In progress</span>
            <span className="done">Done</span>
          </div>
          <div className="mm-tools">
            {canWrite && (
              <button className="primary small" onClick={() => setAdding(true)}>
                <Plus size={15} /> Add mechanism
              </button>
            )}
            <button className="icon-button" aria-label="Zoom out" onClick={() => zoomBy(-0.1)}>
              <ZoomOut size={17} />
            </button>
            <button className="icon-button" aria-label="Zoom in" onClick={() => zoomBy(0.1)}>
              <ZoomIn size={17} />
            </button>
            <button className="icon-button" aria-label="Fit chart to screen" onClick={fit}>
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
        <div
          ref={viewport}
          className="mm-viewport"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div
            className="mm-sizer"
            style={{ width: layout.width * zoom, height: layout.height * zoom }}
          >
            <div
              className="mm-stage"
              style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}
            >
              <svg
                className="mm-links"
                width={layout.width}
                height={layout.height}
                aria-hidden="true"
              >
                {layout.links.map((l, i) => {
                  const s = summaries[l.from.row]?.[l.from.stage];
                  const live =
                    l.from.stage === 'root' ||
                    l.from.stage === 'mechanism' ||
                    (s && s.status !== 'empty');
                  return <path key={i} d={l.d} className={live ? 'live' : ''} />;
                })}
              </svg>
              <div
                className="mm-root"
                style={{
                  left: layout.root.x,
                  top: layout.root.y,
                  width: layout.root.w,
                  height: layout.root.h,
                }}
              >
                <Bot size={20} />
                <strong>{robot?.name || 'Your robot'}</strong>
                <small>
                  {mechs.length} {mechs.length === 1 ? 'mechanism' : 'mechanisms'}
                </small>
              </div>
              {mechs.length === 0 && (
                <p className="mm-blank muted">
                  No mechanisms yet.{' '}
                  {canWrite
                    ? 'Press Add mechanism to start the chart.'
                    : 'A teammate can add them.'}
                </p>
              )}
              {layout.nodes.map((n) => {
                const mech = mechs[n.row],
                  s = summaries[n.row],
                  Icon = STAGE_ICON[n.stage],
                  [line1, line2] = nodeText(n.stage, mech, s),
                  state = n.stage === 'mechanism' ? 'active' : s[n.stage].status,
                  chosen = sel && sel.id === mech.id && sel.stage === n.stage;
                return (
                  <button
                    key={`${mech.id}-${n.stage}`}
                    className={`mm-node ${state} ${chosen ? 'chosen' : ''} ${n.stage === 'code' && s.readyForCode && state === 'empty' ? 'ready' : ''}`}
                    style={{ left: n.x, top: n.y, width: NODE.w, height: NODE.h }}
                    onClick={() => setSel({ id: mech.id, stage: n.stage })}
                    aria-label={`${mech.name}, ${STAGES.find((x) => x.id === n.stage).label}`}
                    aria-pressed={chosen}
                  >
                    <span className="mm-node-top">
                      <Icon size={15} />
                      {n.stage === 'mechanism'
                        ? mech.name
                        : STAGES.find((x) => x.id === n.stage).label}
                      {n.stage !== 'mechanism' && <i>{STATUS_TEXT[state]}</i>}
                    </span>
                    <b>{line1}</b>
                    {line2 && <small>{line2}</small>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      {selected && (
        <Drawer
          key={`${selected.id}-${sel.stage}`}
          mech={selected}
          stage={sel.stage}
          summary={summaries[mechs.indexOf(selected)]}
          w={w}
          people={people}
          canWrite={canWrite}
          onClose={() => setSel(null)}
          saveMech={saveMech}
          addEntry={addEntry}
        />
      )}
      {adding && (
        <Modal title="Add a mechanism" onClose={() => setAdding(false)}>
          <MechanismFields
            people={people}
            canWrite
            submitLabel="Add to chart"
            onSave={async (f) => {
              try {
                const saved = await saveMech({ ...f, name: f.name.trim(), parts: [], done: {} });
                setAdding(false);
                setSel({ id: saved.id, stage: 'mechanism' });
              } catch (e) {
                setError(e.message);
                setAdding(false);
              }
            }}
          />
        </Modal>
      )}
    </>
  );
}
