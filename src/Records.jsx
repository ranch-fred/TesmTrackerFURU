import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  ArrowDownToLine,
  Pencil,
  Trash2,
  X,
  ArrowUpRight,
  Check,
  MessageSquare,
  ExternalLink,
  CalendarDays,
  LayoutList,
} from 'lucide-react';
import { entities } from './schema';
import { canEdit, canDelete, csvText, attendance, sum } from './domain';
import { csv } from './exports';
import { supabase } from './client';
export function Badge({ children, tone = '' }) {
  return (
    <span
      className={`badge ${tone || (/Done|Pass|Received|Complete|Reimbursed|approved/.test(children) ? 'green' : /Blocked|Fail|Pending|Critical|Overdue/.test(children) ? 'yellow' : '')}`}
    >
      {children}
    </span>
  );
}
export function Modal({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const before = document.activeElement;
    ref.current.showModal();
    return () => before?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button aria-label="Close dialog" className="icon-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function RecordForm({ kind, record, w, onClose, onSaved }) {
  const schema = entities[kind];
  const [form, setForm] = useState(
      record ||
        Object.fromEntries(
          schema.fields.map((f) => [
            f.key,
            f.type === 'checkbox'
              ? false
              : ['members', 'multi', 'parts', 'hardware'].includes(f.type)
                ? []
                : ['number', 'percent', 'score'].includes(f.type)
                  ? 0
                  : f.type === 'select'
                    ? f.options[0]
                    : f.type === 'date' && ['date', 'assigned', 'joined'].includes(f.key)
                      ? new Date().toISOString().slice(0, 10)
                      : '',
          ]),
        ),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const set = (key, value) => setForm((a) => ({ ...a, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (kind === 'rules' && form.verified && !/^https:\/\//.test(form.source || ''))
        throw Error('Add an official HTTPS manual source before verifying a ruleset.');
      if (kind === 'sessions' && form.end <= form.start)
        throw Error('End time must be after start time.');
      await w.save(kind, form);
      onSaved?.();
      onClose();
    } catch (ex) {
      setError(ex.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`${record ? 'Edit' : 'New'} ${schema.title.toLowerCase()}`} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          {schema.fields.map((f, index) => {
            let options = f.options || [];
            if (f.type === 'members') options = w.data.roster.map((x) => x.name);
            if (f.type === 'hardware') options = w.data.hardware.map((x) => x.name);
            const multi = ['multi', 'members', 'hardware'].includes(f.type);
            return (
              <label
                className={
                  ['textarea', 'multi', 'members', 'file', 'parts', 'hardware'].includes(f.type)
                    ? 'span-2'
                    : ''
                }
                key={f.key}
              >
                {f.label}
                {f.type === 'parts' ? (
                  <textarea
                    rows={3}
                    placeholder="One item per line"
                    value={(form[f.key] || []).join('\n')}
                    onChange={(e) =>
                      set(
                        f.key,
                        e.target.value
                          .split('\n')
                          .map((v) => v.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                ) : f.type === 'textarea' ? (
                  <textarea
                    rows={4}
                    value={form[f.key] || ''}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : f.type === 'checkbox' ? (
                  <span className="check-label">
                    <input
                      type="checkbox"
                      checked={!!form[f.key]}
                      onChange={(e) => set(f.key, e.target.checked)}
                    />{' '}
                    Enabled
                  </span>
                ) : multi ? (
                  <span className="choice-grid">
                    {options.length ? (
                      options.map((o) => (
                        <span key={o} className="choice">
                          <input
                            aria-label={o}
                            type="checkbox"
                            checked={(form[f.key] || []).includes(o)}
                            onChange={(e) =>
                              set(
                                f.key,
                                e.target.checked
                                  ? [...(form[f.key] || []), o]
                                  : (form[f.key] || []).filter((v) => v !== o),
                              )
                            }
                          />
                          {o}
                        </span>
                      ))
                    ) : (
                      <small className="muted">
                        Add{' '}
                        {f.type === 'hardware'
                          ? 'hardware'
                          : f.type === 'parts'
                            ? 'inventory items'
                            : 'roster members'}{' '}
                        first.
                      </small>
                    )}
                  </span>
                ) : f.type === 'select' ? (
                  <select value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)}>
                    {options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : f.type === 'file' ? (
                  <>
                    <input
                      placeholder="https://… or upload below"
                      value={form[f.key] || ''}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                    <input
                      aria-label={`Upload ${f.label}`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                      disabled={busy}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setBusy(true);
                        try {
                          set(f.key, await w.upload(file));
                        } catch (ex) {
                          setError(ex.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  </>
                ) : (
                  <input
                    required={index === 0}
                    type={
                      ['number', 'percent', 'score'].includes(f.type)
                        ? 'number'
                        : ['email', 'tel', 'url', 'date', 'time'].includes(f.type)
                          ? f.type
                          : 'text'
                    }
                    min={
                      f.type === 'score'
                        ? 1
                        : ['number', 'percent'].includes(f.type)
                          ? 0
                          : undefined
                    }
                    max={f.type === 'score' ? 5 : f.type === 'percent' ? 100 : undefined}
                    step={f.type === 'score' ? '1' : 'any'}
                    value={form[f.key] ?? ''}
                    onChange={(e) =>
                      set(
                        f.key,
                        ['number', 'score', 'percent'].includes(f.type)
                          ? Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                )}
              </label>
            );
          })}
        </div>
        {kind === 'roster' && (
          <p className="note">
            Roster roles describe the team. Change account permissions in Team settings.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="outline" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save record'}
            <Check size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Comments({ row, kind, w, onClose }) {
  const [comments, setComments] = useState([]),
    [message, setMessage] = useState(''),
    [err, setErr] = useState('');
  async function load() {
    if (w.demo) {
      try {
        setComments(JSON.parse(localStorage.getItem(`comments-${row.id}`)) || []);
      } catch {}
      return;
    }
    const r = await supabase
      .from('comments')
      .select('*')
      .eq('record_id', row.id)
      .order('created_at');
    if (r.error) setErr(r.error.message);
    else setComments(r.data);
  }
  useEffect(() => {
    load();
  }, [row.id]);
  async function send(e) {
    e.preventDefault();
    try {
      if (w.demo) {
        const next = [
          ...comments,
          {
            id: crypto.randomUUID(),
            message,
            user_id: w.member.name,
            created_at: new Date().toISOString(),
          },
        ];
        setComments(next);
        localStorage.setItem(`comments-${row.id}`, JSON.stringify(next));
      } else {
        const { error } = await supabase
          .from('comments')
          .insert({ team_id: w.team.id, record_id: row.id, message });
        if (error) throw error;
        await load();
      }
      setMessage('');
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <Modal title="Record discussion" onClose={onClose}>
      <p className="muted">
        {entities[kind].title} · {row.title || row.name || row.description || row.id}
      </p>
      <div className="comments">
        {comments.map((c) => (
          <article key={c.id}>
            <small>
              {w.members.find((m) => m.user_id === c.user_id)?.name || c.user_id} ·{' '}
              {new Date(c.created_at).toLocaleString()}
            </small>
            <p>{c.message}</p>
          </article>
        ))}
        {!comments.length && <p className="muted">Start a discussion with your crew.</p>}
      </div>
      {w.member.role !== 'Parent/Sponsor' && (
        <form onSubmit={send}>
          <label>
            Comment
            <textarea
              value={message}
              required
              maxLength={5000}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <button className="primary">Post comment</button>
        </form>
      )}
      {err && <p className="error">{err}</p>}
    </Modal>
  );
}
export default function Records({ kind, w, compact = false }) {
  const schema = entities[kind];
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState(''),
    [sort, setSort] = useState(''),
    [descending, setDescending] = useState(false),
    [edit, setEdit] = useState(null),
    [deleting, setDeleting] = useState(null),
    [discussion, setDiscussion] = useState(null),
    [err, setErr] = useState(''),
    [calendar, setCalendar] = useState(false),
    [month, setMonth] = useState('2026-10');
  const editAllowed = canEdit(w.member.role, w.member.mentor_edit);
  const filterField =
    schema.fields.find((f) => f.type === 'select') ||
    schema.fields.find((f) => f.type === 'date') ||
    schema.fields[0];
  const filterOptions = filterField.options || [
    ...new Set(
      (w.data[kind] || []).map((r) => r[filterField.key]).filter((v) => typeof v === 'string' && v),
    ),
  ];
  const rows = useMemo(() => {
    let rows = (w.data[kind] || []).filter(
      (r) =>
        Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase()) &&
        (!filter || r[filterField?.key] === filter),
    );
    rows = [...rows].sort((a, b) => {
      const key = sort || schema.fields[0].key;
      const aa = a[key] ?? '',
        bb = b[key] ?? '';
      return (
        (typeof aa === 'number' ? aa - (Number(bb) || 0) : String(aa).localeCompare(String(bb))) *
        (descending ? -1 : 1)
      );
    });
    if (kind === 'announcements') rows.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return rows;
  }, [w.data, kind, search, filter, sort, descending]);
  async function update(row, changes) {
    try {
      await w.save(kind, { ...row, ...changes });
    } catch (e) {
      setErr(e.message);
    }
  }
  function actions(r) {
    return (
      <div className="row-actions">
        <button
          title="Comments"
          aria-label="Open record comments"
          className="icon-button"
          onClick={() => setDiscussion(r)}
        >
          <MessageSquare size={15} />
        </button>
        {editAllowed && (
          <button
            title="Edit"
            aria-label="Edit record"
            className="icon-button"
            onClick={() => setEdit(r)}
          >
            <Pencil size={15} />
          </button>
        )}
        {canDelete(w.member.role) && (
          <button
            title="Delete"
            aria-label="Delete record"
            className="icon-button danger"
            onClick={() => setDeleting(r)}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    );
  }
  function value(r, f) {
    const v = r[f.key];
    if (f.type === 'checkbox')
      return <span className={v ? 'success' : 'muted'}>{v ? '✓ Yes' : '—'}</span>;
    if (f.type === 'file' && v)
      return (
        <button
          className="text-button"
          onClick={async () => {
            try {
              window.open(await w.fileUrl(v), '_blank', 'noopener,noreferrer');
            } catch (e) {
              setErr(e.message);
            }
          }}
        >
          Open file <ExternalLink size={13} />
        </button>
      );
    if (f.type === 'url' && v)
      return /^https?:\/\//i.test(v) ? (
        <a href={v} target="_blank" rel="noreferrer">
          Open <ArrowUpRight size={12} />
        </a>
      ) : (
        <span>Invalid link</span>
      );
    if (
      f.key === 'status' ||
      f.key === 'priority' ||
      f.key === 'stage' ||
      f.key === 'reimbursement' ||
      f.key === 'result'
    )
      return <Badge>{v || '—'}</Badge>;
    if (Array.isArray(v)) return v.join(', ') || '—';
    return String(v ?? '—');
  }
  return (
    <section className={compact ? 'record-section' : 'record-section panel'}>
      <div className="section-toolbar">
        <div>
          <h2>{schema.title}</h2>
          <small className="muted">
            {rows.length} {rows.length === 1 ? 'record' : 'records'}
          </small>
        </div>
        <div className="toolbar-actions">
          {['sessions', 'events'].includes(kind) && (
            <button className="outline" onClick={() => setCalendar((v) => !v)}>
              {calendar ? <LayoutList size={15} /> : <CalendarDays size={15} />}{' '}
              {calendar ? 'List' : 'Calendar'}
            </button>
          )}
          <button className="outline" onClick={() => csv(kind, rows, schema.fields)}>
            <ArrowDownToLine size={15} /> CSV
          </button>
          {editAllowed && (
            <button className="primary" onClick={() => setEdit({})}>
              <Plus size={16} /> Add {kind === 'tasks' ? 'task' : 'record'}
            </button>
          )}
        </div>
      </div>
      <div className="list-controls">
        <div className="search">
          <Search size={16} />
          <input
            aria-label={`Search ${schema.title}`}
            placeholder={`Search ${schema.title.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filterField && (
          <select
            aria-label={`Filter by ${filterField.label}`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All {filterField.label.toLowerCase()}s</option>
            {filterOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        )}
        <select aria-label="Sort records" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort by…</option>
          {schema.fields.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
        <button className="outline" onClick={() => setDescending((v) => !v)}>
          {descending ? '↓ Desc' : '↑ Asc'}
        </button>
      </div>
      {err && (
        <p className="error" role="alert">
          {err}
        </p>
      )}
      {kind === 'tasks' ? (
        <div className="kanban">
          {['To Do', 'In Progress', 'Blocked', 'Done'].map((status) => (
            <div
              key={status}
              className="kanban-column"
              onDragOver={(e) => {
                if (editAllowed) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!editAllowed) return;
                const r = w.data.tasks.find((x) => x.id === e.dataTransfer.getData('text/plain'));
                if (r) update(r, { status });
              }}
            >
              <h3>
                <span className={`status-dot status-${status.replaceAll(' ', '')}`} />
                {status}
                <small>{rows.filter((r) => r.status === status).length}</small>
              </h3>
              {rows
                .filter((r) => r.status === status)
                .map((r) => (
                  <article
                    key={r.id}
                    draggable={editAllowed}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', r.id)}
                    className="task-card"
                  >
                    <Badge>{r.subteam}</Badge>
                    <h3>{r.title}</h3>
                    <p>{r.description}</p>
                    <div className="task-meta">
                      <span
                        className={
                          r.due < new Date().toISOString().slice(0, 10) && r.status !== 'Done'
                            ? 'overdue'
                            : ''
                        }
                      >
                        {r.due || 'No due date'}
                      </span>
                      <Badge>{r.priority}</Badge>
                    </div>
                    <p className="muted">{r.assignees?.join(', ')}</p>
                    {actions(r)}
                    {editAllowed && (
                      <select
                        aria-label={`Move ${r.title}`}
                        value={r.status}
                        onChange={(e) => update(r, { status: e.target.value })}
                      >
                        {['To Do', 'In Progress', 'Blocked', 'Done'].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </article>
                ))}
            </div>
          ))}
        </div>
      ) : calendar ? (
        <>
          <label className="month-picker">
            Month
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <div className="calendar">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <strong key={d}>{d}</strong>
            ))}
            {Array.from({ length: new Date(`${month}-01T12:00:00`).getDay() }, (_, i) => (
              <div key={'empty' + i} />
            ))}
            {Array.from(
              { length: new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate() },
              (_, i) => {
                const date = month + '-' + String(i + 1).padStart(2, '0');
                return (
                  <div key={date}>
                    <span>{i + 1}</span>
                    {rows
                      .filter((r) => r.date === date)
                      .map((r) => (
                        <button
                          key={r.id}
                          onClick={() => (editAllowed ? setEdit(r) : setDiscussion(r))}
                        >
                          {r.name || r.location || r.start}
                        </button>
                      ))}
                  </div>
                );
              },
            )}
          </div>
        </>
      ) : kind === 'announcements' ? (
        <div className="announcement-list">
          {rows.map((r) => (
            <article key={r.id}>
              <div>
                <div className="inline">
                  <Badge tone={r.pinned ? 'orange' : ''}>{r.pinned ? 'PINNED' : 'UPDATE'}</Badge>
                  <small className="muted">
                    {r.date} · {r.author}
                  </small>
                </div>
                <h3>{r.title}</h3>
                <p>{r.message}</p>
                <small className="muted">To: {r.targets?.join(', ') || 'Whole team'}</small>
              </div>
              {actions(r)}
            </article>
          ))}
        </div>
      ) : kind === 'roster' ? (
        <div className="roster-grid">
          {rows.map((r) => {
            const stats = attendance(r.name, w.data.sessions);
            return (
              <article className="profile-card" key={r.id}>
                <div className="avatar large">
                  {r.name
                    ?.split(' ')
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <h3>{r.name}</h3>
                <p>
                  {r.role} · Grade {r.grade}
                </p>
                <div className="inline">
                  {r.subteams?.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
                <div className="profile-stats">
                  <div>
                    <b>{stats.percent}%</b>
                    <small>Attendance</small>
                  </div>
                  <div>
                    <b>{stats.hours.toFixed(1)}h</b>
                    <small>Team hours</small>
                  </div>
                </div>
                <p className="muted">
                  {
                    w.data.tasks.filter((t) => t.assignees?.includes(r.name) && t.status !== 'Done')
                      .length
                  }{' '}
                  open tasks
                </p>
                <details>
                  <summary>Profile details</summary>
                  {schema.fields.map((f) => (
                    <p key={f.key}>
                      <small>{f.label}: </small>
                      {value(r, f)}
                    </p>
                  ))}
                </details>
                {actions(r)}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {schema.fields.map((f) => (
                  <th key={f.key}>
                    <button
                      onClick={() => {
                        if (sort === f.key) setDescending((v) => !v);
                        else setSort(f.key);
                      }}
                    >
                      {f.label}
                      {sort === f.key ? (descending ? ' ↓' : ' ↑') : ''}
                    </button>
                  </th>
                ))}
                {['designs', 'risks'].includes(kind) && <th>Total score</th>}
                <th className="sticky-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={
                    kind === 'parts' && Number(r.quantity) <= Number(r.lowStock)
                      ? 'stock-warning'
                      : ''
                  }
                >
                  {schema.fields.map((f) => (
                    <td key={f.key}>
                      {kind === 'packing' && f.key === 'packed' && editAllowed ? (
                        <input
                          aria-label={`Packed ${r.component}`}
                          type="checkbox"
                          checked={!!r.packed}
                          onChange={(e) => update(r, { packed: e.target.checked })}
                        />
                      ) : kind === 'sessions' && f.key === 'attendees' ? (
                        <div className="attendance-toggles">
                          {w.data.roster.map((p) => (
                            <button
                              disabled={!editAllowed}
                              key={p.id}
                              className={r.attendees?.includes(p.name) ? 'present' : ''}
                              onClick={() =>
                                update(r, {
                                  attendees: r.attendees?.includes(p.name)
                                    ? r.attendees.filter((n) => n !== p.name)
                                    : [...(r.attendees || []), p.name],
                                })
                              }
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <>
                          {value(r, f)}
                          {kind === 'parts' &&
                            f.key === 'quantity' &&
                            Number(r.quantity) <= Number(r.lowStock) && (
                              <Badge tone="yellow">Low stock</Badge>
                            )}
                        </>
                      )}
                    </td>
                  ))}
                  {kind === 'designs' && (
                    <td>
                      <b className="orange">
                        {['performance', 'reliability', 'simplicity', 'cost'].reduce(
                          (n, k) => n + (Number(r[k]) || 0),
                          0,
                        )}{' '}
                        / 20
                      </b>
                    </td>
                  )}
                  {kind === 'risks' && (
                    <td>{(Number(r.likelihood) || 0) * (Number(r.impact) || 0)} / 25</td>
                  )}
                  <td className="sticky-end">
                    {actions(r)}
                    {kind === 'meetings' && editAllowed && (
                      <button
                        className="text-button"
                        onClick={async () => {
                          try {
                            for (const title of (r.actions || '').split('\n').filter(Boolean)) {
                              if (
                                !w.data.tasks.some((t) => t.meetingId === r.id && t.title === title)
                              )
                                await w.save('tasks', {
                                  title,
                                  description: r.summary,
                                  assignees: r.attendees || [],
                                  subteam: 'Mechanical',
                                  priority: 'Medium',
                                  assigned: r.date,
                                  due: '',
                                  status: 'To Do',
                                  meetingId: r.id,
                                });
                            }
                            setErr('Action items added to the task board.');
                          } catch (e) {
                            setErr(e.message);
                          }
                        }}
                      >
                        Create tasks <ArrowUpRight size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!rows.length && (
        <div className="empty-state">
          <div className="empty-hex">◇</div>
          <h3>Every build starts with a first step.</h3>
          <p>
            {search || filter
              ? 'No records match. Try another search or filter.'
              : `Add your first ${schema.title.toLowerCase()} record to get the crew moving.`}
          </p>
          {editAllowed && (
            <button className="primary" onClick={() => setEdit({})}>
              <Plus size={16} /> Add record
            </button>
          )}
        </div>
      )}
      {kind === 'packing' && (
        <div className="section-footer">
          <button className="outline" onClick={() => window.print()}>
            Print checklist
          </button>
        </div>
      )}
      {kind === 'sessions' && (
        <div className="section-footer attendance-summary">
          {w.data.roster.map((p) => {
            const a = attendance(p.name, w.data.sessions);
            return (
              <div key={p.id}>
                <b>{p.name}</b>
                <span>
                  {a.percent}% · {a.hours.toFixed(1)} hours
                </span>
              </div>
            );
          })}
        </div>
      )}
      {edit && (
        <RecordForm
          kind={kind}
          record={edit.id ? edit : null}
          w={w}
          onClose={() => setEdit(null)}
        />
      )}
      {discussion && (
        <Comments row={discussion} kind={kind} w={w} onClose={() => setDiscussion(null)} />
      )}
      {deleting && (
        <Modal title="Delete this record?" onClose={() => setDeleting(null)}>
          <p>This permanently removes the record. The change remains in the team activity log.</p>
          <div className="modal-actions">
            <button className="outline" onClick={() => setDeleting(null)}>
              Keep record
            </button>
            <button
              className="primary danger-button"
              onClick={async () => {
                try {
                  await w.remove(kind, deleting.id);
                  setDeleting(null);
                } catch (e) {
                  setErr(e.message);
                  setDeleting(null);
                }
              }}
            >
              Delete record
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
