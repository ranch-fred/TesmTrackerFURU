import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Plus, Send } from 'lucide-react';
import { supabase } from './client';
import { canEdit } from './domain';
import { localDate } from './logs';
import {
  approvedMembers,
  attendanceStatus,
  checkinsForMember,
  joinDate,
  monthDays,
  monthKey,
} from './attendance';
import './attendance.css';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const statusLabels = {
  'present-required': 'Here on a required day',
  'present-extra': 'Here on an extra day',
  missed: 'Missed required day',
  required: 'Required day',
  optional: 'Optional day',
  today: 'Today, no check-in yet',
  inactive: 'Before joining the team',
};

export function TeamRoster({ w }) {
  const members = approvedMembers(w.members);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const canInvite = ['Captain', 'Coach'].includes(w.member.role);
  async function sendInvite(event) {
    event.preventDefault();
    setInviteMessage('');
    setInviteError('');
    setSending(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) throw Error('Sign in again to send invitations.');
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ email, teamId: w.team.id }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Could not send invitation.');
      setInviteMessage(`Invitation sent to ${email}.`);
      setEmail('');
      setInviteOpen(false);
    } catch (error) {
      setInviteError(error.message);
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="panel account-roster">
      <div className="panel-heading">
        <div>
          <h2>Team roster</h2>
          <p className="muted">
            Approved teammates who joined through FTC Manager appear here automatically.
          </p>
        </div>
        <div className="inline">
          {canInvite && (
            <button className="primary" onClick={() => setInviteOpen((open) => !open)}>
              <Plus size={15} /> Add teammate
            </button>
          )}
          <button className="outline" onClick={w.refresh}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>
      {inviteOpen && (
        <form className="roster-invite" onSubmit={sendInvite}>
          <label>
            Teammate email
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button className="primary" disabled={sending || w.demo}>
            <Send size={15} /> {sending ? 'Sending…' : 'Send invitation'}
          </button>
          {w.demo && <small>Sending invitations requires a live team account.</small>}
        </form>
      )}
      {inviteMessage && (
        <p className="attendance-message" role="status">
          {inviteMessage}
        </p>
      )}
      {inviteError && (
        <p className="error roster-invite-error" role="alert">
          {inviteError}
        </p>
      )}
      {members.length ? (
        <div className="account-roster-grid">
          {members.map((member) => (
            <article key={member.user_id} className="account-roster-card">
              <div className="account-roster-avatar">
                {member.name
                  ?.split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || '?'}
              </div>
              <div>
                <strong>{member.name}</strong>
                <span>
                  {member.role}
                  {member.grade ? ` · Grade ${member.grade}` : ''}
                </span>
                <small>
                  {member.subteams?.length ? member.subteams.join(' · ') : 'No sub-team selected'}
                </small>
                <small>
                  Joined{' '}
                  {member.created_at
                    ? new Date(member.created_at).toLocaleDateString()
                    : 'the team'}
                </small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="attendance-empty">
          No approved teammates yet. Join requests are handled in Team settings.
        </p>
      )}
    </section>
  );
}

export function AttendanceCalendar({ w }) {
  const [now, setNow] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedUserId, setSelectedUserId] = useState(w.user.id);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(!w.demo);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savedDate, setSavedDate] = useState('');
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const todayKey = localDate(now);
  const members = approvedMembers(w.members);
  const visibleMembers = members.length ? members : [w.member];
  const selected = members.find((member) => member.user_id === selectedUserId) || w.member;
  const self = members.find((member) => member.user_id === w.user.id) || w.member;
  const days = useMemo(() => monthDays(year, month), [year, month]);
  const presentDays = useMemo(() => checkinsForMember(rows, selected), [rows, selected]);
  const myPresentDays = useMemo(() => checkinsForMember(rows, self), [rows, self]);
  const checkedInToday =
    savedDate === todayKey ||
    myPresentDays.has(todayKey) ||
    (w.data.sessions || []).some(
      (row) => row.attendanceCheckin && row.date === todayKey && row.attendanceUserId === w.user.id,
    );
  const canCheckIn = canEdit(w.member.role, w.member.mentor_edit);
  const viewingCurrentMonth = monthKey(year, month) === monthKey(now.getFullYear(), now.getMonth());

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const interval = setInterval(updateClock, 60000);
    window.addEventListener('focus', updateClock);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateClock);
    };
  }, []);

  useEffect(() => {
    if (w.demo) {
      setRows(w.data.sessions || []);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      const start = monthKey(year, month);
      const end = monthKey(year, month + 1);
      const collected = [];
      try {
        for (let offset = 0; ; offset += 1000) {
          const result = await supabase
            .from('records')
            .select('id,data,created_by')
            .eq('team_id', w.team.id)
            .eq('kind', 'sessions')
            .gte('data->>date', `${start}-01`)
            .lt('data->>date', `${end}-01`)
            .order('created_at')
            .range(offset, offset + 999);
          if (result.error) throw result.error;
          collected.push(
            ...result.data.map((record) => ({
              ...record.data,
              id: record.id,
              attendanceUserId: record.created_by,
            })),
          );
          if (result.data.length < 1000) break;
        }
        if (!cancelled) setRows(collected);
      } catch (cause) {
        if (!cancelled) setError(`Could not load attendance: ${cause.message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [w.demo, w.team.id, year, month, w.data.sessions, reload]);

  function changeMonth(direction) {
    setVisibleMonth(new Date(year, month + direction, 1));
  }

  async function checkIn() {
    if (!canCheckIn || saving || checkedInToday) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await w.save('sessions', {
        date: localDate(),
        attendanceCheckin: true,
        attendanceUserId: w.user.id,
        attendeeName: w.member.name,
        attendees: [w.member.name],
      });
      setNow(new Date());
      setVisibleMonth(new Date());
      setSelectedUserId(w.user.id);
      setSavedDate(localDate());
      setReload((value) => value + 1);
      setNotice('Your attendance is saved for today.');
    } catch (cause) {
      setError(cause.message || 'Could not save your check-in.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel attendance-calendar">
      <div className="attendance-calendar-top">
        <div>
          <h2>Attendance</h2>
          <p>Saturday and Sunday are required team days. Check in when you arrive.</p>
        </div>
        <button
          className="primary"
          onClick={viewingCurrentMonth ? checkIn : () => setVisibleMonth(new Date())}
          disabled={!canCheckIn || (checkedInToday && viewingCurrentMonth) || saving || loading}
        >
          {!viewingCurrentMonth
            ? 'Go to today'
            : checkedInToday
              ? 'You came today ✓'
              : saving
                ? 'Saving…'
                : 'I came today'}
        </button>
      </div>
      {!canCheckIn && (
        <p className="note">
          Your account has view-only access. Ask a captain or coach to allow attendance check-ins
          for your role.
        </p>
      )}
      {notice && (
        <p className="attendance-message" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="attendance-calendar-tools">
        <div className="attendance-month">
          <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={18} />
          </button>
          <h3>{visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
          <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
        <label>
          View attendance for{' '}
          <select
            value={selected.user_id}
            onChange={(event) => setSelectedUserId(event.target.value)}
          >
            {visibleMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="attendance-key">
        <span>
          <i className="required-present" /> Came on required day
        </span>
        <span>
          <i className="extra-present" /> Came on weekday
        </span>
        <span>
          <i className="required-missed" /> Missed required day
        </span>
        <span>
          <i className="required-upcoming" /> Required day
        </span>
      </div>
      <div
        className="attendance-grid"
        aria-label={`${selected.name}'s attendance for ${visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}
      >
        {weekdays.map((day) => (
          <div className="attendance-weekday" key={day}>
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          if (!day) return <div className="attendance-blank" key={`blank-${index}`} />;
          const status = attendanceStatus(
            day,
            todayKey,
            presentDays.has(day.key),
            joinDate(selected),
          );
          return (
            <div
              className={`attendance-day ${status}`}
              key={day.key}
              aria-label={`${day.key}: ${statusLabels[status]}`}
            >
              <span>{day.day}</span>
              {status === 'present-required' || status === 'present-extra' ? (
                <strong>Here</strong>
              ) : status === 'missed' ? (
                <strong>Absent</strong>
              ) : day.mandatory && status !== 'inactive' ? (
                <small>Required</small>
              ) : null}
            </div>
          );
        })}
      </div>
      {loading && (
        <p className="attendance-loading" role="status">
          Updating attendance…
        </p>
      )}
      <p className="attendance-footnote">
        A required day turns red after that day ends if no attendance was recorded. Weekdays stay
        unmarked unless you check in.
      </p>
    </section>
  );
}
