import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight as Out,
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Users,
  Package,
  Radio,
  Target,
  Flame,
  ChevronRight,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { finance, money, sum, trend, legality, canEdit, canDelete } from './domain';
import Records, { Badge, Modal, RecordForm } from './Records';
import { entities } from './schema';
import { AnimatedValue, useMotion } from './Motion';
import { loggedToday } from './logs';
import { seasonBadge } from './branding';
import { approvedMembers } from './attendance';
import RobotWorkspace from './RobotWorkspace';
import { officialRules } from './robot-rules';
import PillTabs from './PillTabs';
import IsoLoop from './IsoLoop';
import './finance.css';
const palette = [
  'var(--orange)',
  'color-mix(in srgb, var(--orange) 78%, white)',
  'color-mix(in srgb, var(--orange) 58%, white)',
  'color-mix(in srgb, var(--orange) 72%, black)',
  'color-mix(in srgb, var(--orange) 50%, black)',
  'color-mix(in srgb, var(--orange) 30%, black)',
];
export function Stat({ label, value, note, icon: Icon, tone = '', onClick }) {
  return (
    <article
      className={`stat-card ${tone} ${onClick ? 'stat-card-link' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? `Open ${label.toLowerCase()}` : undefined}
    >
      <div className="stat-top">
        <span>{label}</span>
        {Icon && <Icon size={17} />}
      </div>
      <strong>
        <AnimatedValue value={value} />
      </strong>
      <small>{note}</small>
    </article>
  );
}
export function Chart({ data, series = ['raised', 'spent'], height = 220 }) {
  const { enabled } = useMotion();
  return data.length ? (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="orangeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--orange)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--orange)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2b2b2b" vertical={false} strokeDasharray="3 5" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#858585', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            width={50}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#858585', fontSize: 11 }}
            tickFormatter={(n) => '$' + (n >= 1000 ? n / 1000 + 'k' : n)}
          />
          <Tooltip
            contentStyle={{ background: '#1b1b1b', border: '1px solid #444', borderRadius: 8 }}
            formatter={(v) => money(v)}
          />
          {series.map((key, i) => (
            <Area
              key={key}
              isAnimationActive={enabled}
              type="monotone"
              dataKey={key}
              name={key === 'raised' ? 'Money in' : key === 'spent' ? 'Money out' : 'Balance'}
              stroke={i ? '#929292' : 'var(--orange)'}
              strokeWidth={2.5}
              fill={i ? 'transparent' : 'url(#orangeFill)'}
              strokeDasharray={i ? '4 4' : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <div className="chart-empty">Add funding and expenses to see your trend.</div>
  );
}
function FinanceBalanceChart({ data }) {
  const { enabled } = useMotion();
  if (!data.length)
    return <div className="chart-empty">Add funding or an expense to see your balance.</div>;
  const points = [
    { date: 'Start', balance: 0 },
    ...data.map(({ date, balance }) => ({ date, balance })),
  ];
  const low = Math.min(0, ...points.map((point) => point.balance));
  const high = Math.max(0, ...points.map((point) => point.balance));
  const zeroOffset = high === low ? 50 : (100 * high) / (high - low);
  const balanceColor = (value) => (value < 0 ? '#ef5a55' : value > 0 ? '#58c582' : '#aaa');
  const dot = ({ cx, cy, payload }) => (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={balanceColor(payload.balance)}
      stroke="#fff"
      strokeWidth={2}
    />
  );
  return (
    <div className="finance-balance-chart">
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="financeBalanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#58c582" stopOpacity={0.23} />
              <stop offset={`${zeroOffset}%`} stopColor="#58c582" stopOpacity={0.14} />
              <stop offset={`${zeroOffset}%`} stopColor="#ef5a55" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#ef5a55" stopOpacity={0.23} />
            </linearGradient>
            <linearGradient id="financeBalanceStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={`${zeroOffset}%`} stopColor="#58c582" />
              <stop offset={`${zeroOffset}%`} stopColor="#ef5a55" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#333" vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#929292', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            width={52}
            domain={low === high ? [-1, 1] : [low, high]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#929292', fontSize: 11 }}
            tickFormatter={money}
          />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="finance-balance-tooltip">
                  <small>{label}</small>
                  <strong style={{ color: balanceColor(payload[0].value) }}>
                    Balance: {money(payload[0].value)}
                  </strong>
                </div>
              ) : null
            }
          />
          <Area
            isAnimationActive={enabled}
            type="monotone"
            dataKey="balance"
            stroke="url(#financeBalanceStroke)"
            strokeWidth={3}
            fill="url(#financeBalanceFill)"
            dot={dot}
            activeDot={dot}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
// Live days / hours / minutes / seconds until the next competition.
function Countdown({ event }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(`${event.date}T${event.time || '08:00'}:00`).getTime();
  const left = Math.max(0, target - now);
  const parts = [
    ['DAYS', Math.floor(left / 864e5)],
    ['HRS', Math.floor(left / 36e5) % 24],
    ['MIN', Math.floor(left / 6e4) % 60],
    ['SEC', Math.floor(left / 1e3) % 60],
  ];
  return (
    <section
      className="panel accent countdown-panel"
      aria-label={`${parts[0][1]} days until ${event.name}`}
    >
      <div>
        <div className="eyebrow">NEXT COMPETITION</div>
        <h2>{event.name}</h2>
        <small className="muted">
          {event.date}
          {event.location ? ` · ${event.location}` : ''}
        </small>
      </div>
      <div className="countdown" role="timer">
        {parts.map(([label, value]) => (
          <div key={label} className="countdown-cell">
            <b>{String(value).padStart(2, '0')}</b>
            <small>{label}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
export function Dashboard({ w, navigate }) {
  const [form, setForm] = useState(null);
  const d = w.data,
    f = w.member.role === 'Parent/Sponsor' && w.summary ? w.summary : finance(d),
    robot = d.robot[0] || w.dashboard?.robot || {},
    rules = legality(robot, d.hardware, officialRules),
    upcoming = [...(d.events.length ? d.events : w.dashboard?.events || [])]
      .filter(
        (e) =>
          (!e.type || ['Competition', 'Scrimmage'].includes(e.type)) &&
          e.date >= new Date().toISOString().slice(0, 10),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0],
    days = next
      ? Math.max(0, Math.ceil((new Date(next.date + 'T12:00:00') - new Date()) / 86400000))
      : null;
  const parent = w.member.role === 'Parent/Sponsor';
  const season = seasonBadge(w.team.season);
  return (
    <>
      <section className="welcome-banner">
        <div>
          <div className="eyebrow">
            <span className="dot" /> ALL SYSTEMS, ONE TEAM
          </div>
          <h1>
            LET’S GET <span>BUILDING.</span>
          </h1>
          <p>Good to see you, {w.member.name.split(' ')[0]}. Here’s where the team stands.</p>
        </div>
        <div className="season-mark">
          <span>SEASON</span>
          <strong>
            {season.years.split('/')[0]}
            {season.years.includes('/') && <span>/</span>}
            {season.years.split('/')[1] || ''}
          </strong>
          <small>{season.label}</small>
        </div>
        <div className="banner-grid" />
      </section>
      {next && <Countdown event={next} />}
      <div className="command-strip">
        <div className="command-label">
          <span className="dot" />
          <span>
            YOUR NEXT MOVE
            <small>
              {next ? `${next.name} · ${next.date}` : 'Make progress, one step at a time.'}
            </small>
          </span>
        </div>
        {!parent && canEdit(w.member.role, w.member.mentor_edit) ? (
          <div className="command-actions">
            <button onClick={() => setForm('tasks')}>
              <Plus size={15} /> Add task <ArrowUpRight size={14} />
            </button>
            <button onClick={() => setForm('expenses')}>
              <Wallet size={15} /> Log expense <ArrowUpRight size={14} />
            </button>
            <button onClick={() => navigate('attendance')}>
              <Users size={15} /> Attendance <ArrowUpRight size={14} />
            </button>
            {['Captain', 'Coach'].includes(w.member.role) && (
              <button onClick={() => navigate('settings', 'members')}>
                <Plus size={15} /> Add teammate <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <button className="text-button" onClick={() => navigate('announcements')}>
            Latest announcements <ArrowRight size={15} />
          </button>
        )}
      </div>
      {!parent && canEdit(w.member.role, w.member.mentor_edit) && (
        <section className="panel daily-log-reminder">
          <IsoLoop name="log" size="sm" />
          <div>
            <div className="eyebrow">YOUR DAILY LOG</div>
            <h2>
              {loggedToday(d, w.member, w.user.id)
                ? 'Today’s work is logged.'
                : 'What did you do today?'}
            </h2>
            <p>Each time you come in, add a dated entry for the work you did.</p>
          </div>
          <div className="daily-log-links">
            <button onClick={() => navigate('logs')}>
              Open logs <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}
      <div className="dashboard-heading">
        <div>
          <h2>Team at a glance</h2>
          <p className="muted">Small details. Big progress.</p>
        </div>
        <span className="mini-status">
          <span className="dot" />
          {w.demo ? 'SAMPLE WORKSPACE' : 'TEAM WORKSPACE'}
        </span>
      </div>
      <div className="stats-grid">
        <Stat
          label="AVAILABLE BALANCE"
          value={money(f.balance)}
          note={`${money(f.received)} raised this season`}
          icon={Wallet}
          tone="accent"
          onClick={() => navigate('finance')}
        />
        <Stat
          label="OPEN TASKS"
          value={
            parent
              ? '—'
              : d.tasks
                  .filter((t) => t.status !== 'Done')
                  .length.toString()
                  .padStart(2, '0')
          }
          note={
            parent
              ? 'Visible to operational members'
              : `${d.tasks.filter((t) => t.status === 'In Progress').length} in progress · ${d.tasks.filter((t) => t.status === 'Blocked').length} blocked`
          }
          icon={CheckCircle2}
          onClick={parent ? undefined : () => navigate('tasks')}
        />
        <Stat
          label="TEAM MEMBERS"
          value={parent ? '—' : approvedMembers(w.members).length.toString().padStart(2, '0')}
          note={parent ? 'Visible to operational members' : 'Approved app accounts'}
          icon={CalendarDays}
          onClick={
            parent || !['Captain', 'Coach'].includes(w.member.role)
              ? undefined
              : () => navigate('settings', 'members')
          }
        />
        <Stat
          label="NEXT COMPETITION"
          value={days === null ? '—' : days + 'd'}
          note={next?.name || 'Add a competition event'}
          icon={CalendarDays}
          onClick={parent ? undefined : () => navigate('competition', 'events')}
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel finance-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow subtle">BUSINESS / FINANCE</span>
              <h2>Making every dollar count.</h2>
            </div>
            <button
              className="icon-button"
              aria-label="Open finance"
              onClick={() => navigate('finance')}
            >
              <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="finance-numbers">
            <div>
              <span>
                <i className="legend-dot" />
                Money in
              </span>
              <b>{money(f.received)}</b>
            </div>
            <div>
              <span>
                <i className="legend-dot gray" />
                Money out
              </span>
              <b>{money(f.spent)}</b>
            </div>
            <Badge tone="orange">THIS SEASON</Badge>
          </div>
          {parent ? (
            <div className="sponsor-summary">
              <p>Your support makes the next build possible.</p>
              <div className="progress">
                <span
                  style={{ width: `${Math.min(100, (f.spent / Math.max(f.received, 1)) * 100)}%` }}
                />
              </div>
              <small>{money(f.spent)} invested in the team</small>
            </div>
          ) : (
            <Chart data={trend(d)} />
          )}
          <button className="panel-link" onClick={() => navigate('finance')}>
            View finance overview <ArrowRight size={16} />
          </button>
        </section>
        <section className="panel robot-vitals">
          <div className="panel-heading">
            <div>
              <span className="eyebrow subtle">ROBOT / STATUS</span>
              <h2>{robot.name || 'Your next great build'}</h2>
            </div>
            <Activity size={20} className="orange" />
          </div>
          <div className="robot-schematic" aria-label="Robot dimensional diagram">
            <div className="dimension top">{robot.length || '—'} IN</div>
            <div className="schematic-body">
              <span className="schematic-core">{w.team.number}</span>
              <span className="schematic-line" />
            </div>
            <div className="dimension side">{robot.width || '—'} IN</div>
            <span className="schematic-caption">TOP VIEW / DIMENSIONAL REFERENCE</span>
          </div>
          <div className="vitals-stats">
            <div>
              <small>WEIGHT</small>
              <b>
                {robot.weight || '—'} <span>LB</span>
              </b>
            </div>
            <div>
              <small>HEIGHT</small>
              <b>
                {robot.height || '—'} <span>IN</span>
              </b>
            </div>
            <div>
              <small>LEGALITY</small>
              <Badge
                tone={
                  rules.checks.some((c) => c.actual === 'Missing')
                    ? 'yellow'
                    : rules.pass
                      ? 'green'
                      : 'red'
                }
              >
                {rules.checks.some((c) => c.actual === 'Missing')
                  ? 'MEASURE'
                  : rules.pass
                    ? 'WITHIN LIMITS'
                    : 'CHECK'}
              </Badge>
            </div>
          </div>
          {!parent && (
            <button className="panel-link" onClick={() => navigate('robot')}>
              Open robot specs <ArrowRight size={16} />
            </button>
          )}
        </section>
        <section className="panel priorities">
          <div className="panel-heading">
            <div>
              <span className="eyebrow subtle">UP NEXT</span>
              <h2>Keep the build moving.</h2>
            </div>
            {!parent && (
              <button
                className="outline small"
                onClick={() => setForm('tasks')}
                disabled={!canEdit(w.member.role, w.member.mentor_edit)}
              >
                <Plus size={14} /> Task
              </button>
            )}
          </div>
          {!parent &&
            d.tasks
              .filter((t) => t.status !== 'Done')
              .slice(0, 3)
              .map((t) => (
                <button key={t.id} className="priority-row" onClick={() => navigate('tasks')}>
                  <span className="task-square" />
                  <div>
                    <strong>{t.title}</strong>
                    <small>
                      {t.subteam} · Due {t.due || 'not set'}
                    </small>
                  </div>
                  <Badge tone={t.status === 'Blocked' ? 'yellow' : ''}>{t.status}</Badge>
                  <ChevronRight size={15} />
                </button>
              ))}
          {upcoming.slice(0, 2).map((e) => (
            <div key={e.id} className="event-row">
              <div className="date-tile">
                <small>
                  {new Date(e.date + 'T12:00').toLocaleString('en-US', { month: 'short' })}
                </small>
                <b>{e.date.slice(-2)}</b>
              </div>
              <div>
                <strong>{e.name}</strong>
                <small>{e.location || 'Team event'}</small>
              </div>
              <Badge>
                {Math.max(0, Math.ceil((new Date(e.date + 'T12:00') - new Date()) / 86400000))} DAYS
              </Badge>
            </div>
          ))}
          <button
            className="panel-link"
            onClick={() => navigate(parent ? 'announcements' : 'tasks')}
          >
            {parent ? 'Team announcements' : 'Open task board'} <ArrowRight size={16} />
          </button>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow subtle">FROM THE CREW</span>
              <h2>The latest word.</h2>
            </div>
            <Radio size={18} className="muted" />
          </div>
          {[...d.announcements]
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
            .slice(0, 2)
            .map((a) => (
              <article key={a.id} className="announcement-preview">
                <div className="inline">
                  {a.pinned && <Badge tone="orange">PINNED</Badge>}
                  <small className="muted">{a.date}</small>
                </div>
                <h3>{a.title}</h3>
                <p>{a.message}</p>
                <small>{a.author}</small>
              </article>
            ))}
          {!d.announcements.length && (
            <p className="empty-copy">No announcements yet. Your next update starts here.</p>
          )}
          <button className="panel-link" onClick={() => navigate('announcements')}>
            All announcements <ArrowRight size={16} />
          </button>
        </section>
      </div>
      {!parent && (
        <div className="bottom-grid">
          <section className="panel">
            <div className="panel-heading">
              <h3>
                <Flame size={16} className="orange" /> Your crew.
              </h3>
              <span className="muted">TEAM ROSTER</span>
            </div>
            {approvedMembers(w.members)
              .slice(0, 3)
              .map((p) => (
                <div className="member-row" key={p.id}>
                  <div className="avatar">
                    {p.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <span>
                    {p.name}
                    <small>
                      {p.role} · {p.subteams?.join(', ') || 'Team member'}
                    </small>
                  </span>
                  <b>Joined</b>
                </div>
              ))}
            {['Captain', 'Coach'].includes(w.member.role) && (
              <button className="panel-link" onClick={() => navigate('settings', 'members')}>
                Manage members <ArrowRight size={16} />
              </button>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h3>
                <Target size={16} className="orange" /> Field notes.
              </h3>
              <button
                className="icon-button"
                aria-label="Open competition"
                onClick={() => navigate('competition')}
              >
                <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="match-highlight">
              <strong>{d.matches.at(-1)?.points ?? '—'}</strong>
              <span>
                LATEST MATCH POINTS<small>{d.matches.at(-1)?.event || 'No matches logged'}</small>
              </span>
            </div>
            <p className="muted">Record. Review. Come back stronger.</p>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h3>
                <span className="dot" /> Who’s on the console?
              </h3>
            </div>
            {w.demo ? (
              <p className="muted">
                Demo mode · {w.member.name} ({w.member.role})<br />
                <small>Live presence is available with connected accounts.</small>
              </p>
            ) : w.presence.length ? (
              w.presence.map((p) => (
                <div className="member-row" key={p.user_id}>
                  <div className="avatar">{p.name?.[0]}</div>
                  <span>
                    {p.name}
                    <small>{p.role}</small>
                  </span>
                  <span className="dot" />
                </div>
              ))
            ) : (
              <p className="muted">Connecting presence…</p>
            )}
          </section>
        </div>
      )}
      {form && <RecordForm kind={form} w={w} onClose={() => setForm(null)} />}
    </>
  );
}
export function Finance({ w }) {
  const { enabled } = useMotion();
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const d = w.data,
    parent = w.member.role === 'Parent/Sponsor',
    f = parent && w.summary ? w.summary : finance(d);
  const split = [...new Set(d.expenses.map((e) => e.category))].map((category) => ({
    name: category,
    value: sum(
      d.expenses.filter((e) => e.category === category),
      'amount',
    ),
  }));
  const transactions = [
    ...d.income.map((record) => ({
      kind: 'income',
      record,
      date: record.lastContact || '',
      amount: record.received,
    })),
    ...d.expenses.map((record) => ({
      kind: 'expenses',
      record,
      date: record.date || '',
      amount: record.amount,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const editable = !parent && canEdit(w.member.role, w.member.mentor_edit);
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">BUSINESS / THE BIG PICTURE</div>
        <h1>
          FUND THE <span>MISSION.</span>
        </h1>
        <p>Every receipt. Every relationship. Every next possibility.</p>
        {editable && (
          <div className="finance-actions" data-tour="finance-add">
            <button className="primary" onClick={() => setForm({ kind: 'income' })}>
              <Plus size={16} /> Add funding
            </button>
            <button className="outline" onClick={() => setForm({ kind: 'expenses' })}>
              <Plus size={16} /> Add expense
            </button>
          </div>
        )}
      </div>
      <div className="stats-grid finance-stats">
        <Stat
          label="CURRENT BALANCE"
          value={money(f.balance)}
          note="Received less recorded expenses"
          icon={Wallet}
          tone={
            f.balance < 0 ? 'finance-negative' : f.balance > 0 ? 'finance-positive' : 'finance-zero'
          }
        />
        <Stat
          label="MONEY RECEIVED"
          value={money(f.received)}
          note="Funds received this season"
          icon={ArrowDownLeft}
        />
        <Stat label="MONEY SPENT" value={money(f.spent)} note="All recorded expenses" icon={Out} />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <>
        <div className="finance-layout finance-overview">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow subtle">CASH FLOW</span>
                <h2>Balance over time.</h2>
              </div>
              <Badge tone="orange">SEASON TO DATE</Badge>
            </div>
            {parent ? (
              <div className="sponsor-summary">
                <h2>{money(f.balance)} available for the next build.</h2>
                <p>Thank you for helping the team turn ideas into working engineering.</p>
              </div>
            ) : (
              <>
                <FinanceBalanceChart data={trend(d)} />
                <small className="chart-footnote">
                  Running balance by recorded funding and expense date.
                </small>
              </>
            )}
          </section>
          {!parent && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow subtle">SPENDING MIX</span>
                  <h2>Where it goes.</h2>
                </div>
              </div>
              {split.length ? (
                <>
                  <div className="finance-donut">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          isAnimationActive={enabled}
                          data={split}
                          dataKey="value"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={4}
                          stroke="none"
                        >
                          {split.map((c, i) => (
                            <Cell key={c.name} fill={palette[i % palette.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#222', border: '1px solid #555' }}
                          formatter={money}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="finance-donut-center">
                      <strong>{money(f.spent)}</strong>
                      <small>spent</small>
                    </div>
                  </div>
                  <div className="chart-legend">
                    {split.map((c, i) => (
                      <div key={c.name}>
                        <i style={{ background: palette[i % palette.length] }} />
                        {c.name}
                        <b>{money(c.value)}</b>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="empty-copy">Log an expense to see your spending mix.</p>
              )}
            </section>
          )}
        </div>
        {!parent && (
          <section className="panel finance-timeline">
            <div className="panel-heading">
              <div>
                <span className="eyebrow subtle">ACTIVITY</span>
                <h2>Transaction timeline.</h2>
              </div>
            </div>
            {transactions.length ? (
              <div className="finance-timeline-list">
                {transactions.map(({ kind, record, date, amount }) => {
                  const incoming = kind === 'income';
                  const title = incoming
                    ? record.company || 'Funding source'
                    : record.description || 'Expense';
                  return (
                    <div className="finance-transaction" key={`${kind}-${record.id}`}>
                      <time dateTime={date}>{date || 'No date'}</time>
                      <span className={`finance-transaction-dot ${incoming ? 'incoming' : ''}`} />
                      <div className="finance-transaction-card">
                        <span className="funding-icon">{incoming ? title[0] : '−'}</span>
                        <strong className="finance-transaction-title">{title}</strong>
                        <span className={`finance-category ${incoming ? 'incoming' : ''}`}>
                          {incoming ? 'Funding' : record.category || 'Other'}
                        </span>
                        <strong
                          className={`finance-transaction-amount ${incoming ? 'incoming' : ''}`}
                        >
                          {incoming ? '+' : '−'}
                          {money(amount)}
                        </strong>
                        {editable && (
                          <button
                            className="icon-button"
                            aria-label={`Edit ${incoming ? 'funding from' : 'expense'} ${title}`}
                            onClick={() => setForm({ kind, record })}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {canDelete(w.member.role) && (
                          <button
                            className="icon-button danger"
                            aria-label={`Delete ${incoming ? 'funding from' : 'expense'} ${title}`}
                            onClick={() => setDeleting({ kind, record })}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="empty-copy">No transactions logged yet.</p>
            )}
          </section>
        )}
      </>
      {form && (
        <RecordForm w={w} kind={form.kind} record={form.record} onClose={() => setForm(null)} />
      )}
      {deleting && (
        <Modal title="Delete this record?" onClose={() => setDeleting(null)}>
          <p>This permanently removes the record from your team finances.</p>
          <div className="modal-actions">
            <button className="outline" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              className="primary danger-button"
              onClick={async () => {
                try {
                  await w.remove(deleting.kind, deleting.record.id);
                  setDeleting(null);
                } catch (e) {
                  setError(e.message);
                  setDeleting(null);
                }
              }}
            >
              Delete record
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Robot({ w, initial = 'robot' }) {
  return <RobotWorkspace w={w} initial={initial} />;
}
export function Matches({ w, embedded = false }) {
  const { enabled } = useMotion();
  const d = w.data.matches,
    [tab, setTab] = useState('matches'),
    best = d.length ? Math.max(...d.map((m) => Number(m.points) || 0)) : 0,
    worst = d.length ? Math.min(...d.map((m) => Number(m.points) || 0)) : 0;
  const avg = (k) => (d.length ? (sum(d, k) / d.length).toFixed(1) : '—');
  return (
    <>
      {!embedded && (
        <div className="page-intro">
          <div className="eyebrow">COMPETITION / FIND YOUR EDGE</div>
          <h1>
            BUILT. TESTED. <span>BETTER.</span>
          </h1>
          <p>Turn each match into the next improvement.</p>
        </div>
      )}
      {!d.length && (
        <section className="panel iso-empty">
          <IsoLoop name="hive" />
          <div>
            <h2>No matches yet</h2>
            <p>Log a match below, or pull official results from the FTC Scout live tab.</p>
          </div>
        </section>
      )}
      <div className="stats-grid">
        <Stat
          label="AVERAGE POINTS"
          value={avg('points')}
          note={`${d.length} matches logged`}
          icon={Target}
          tone="accent"
        />
        <Stat
          label="BEST / WORST MATCH"
          value={`${best} / ${worst}`}
          note="Recorded and practice totals"
        />
        <Stat
          label="HIVE / FLOWER HIT RATE"
          value={`${avg('hiveHit')} / ${avg('flowerHit')}%`}
          note="Mean of logged percentages"
        />
        <Stat
          label="INTAKE SUCCESS"
          value={avg('intake') + '%'}
          note={`${avg('hiveTime')}s hive · ${avg('flowerTime')}s flower`}
        />
      </div>
      <p className="note">
        Use Practice matches for point-by-point BIOBUZZ scoring. Other match totals are entered
        manually.
      </p>
      <section className="panel">
        <div className="panel-heading">
          <h2>Points over time</h2>
        </div>
        <div style={{ height: 230 }}>
          <ResponsiveContainer>
            <LineChart data={[...d].sort((a, b) => (a.date || '').localeCompare(b.date || ''))}>
              <CartesianGrid stroke="#303030" vertical={false} />
              <XAxis dataKey="number" tick={{ fill: '#888' }} />
              <YAxis tick={{ fill: '#888' }} />
              <Tooltip contentStyle={{ background: '#222', border: '1px solid #555' }} />
              <Line
                isAnimationActive={enabled}
                type="monotone"
                dataKey="points"
                stroke="var(--orange)"
                strokeWidth={3}
                dot={{ fill: 'var(--orange)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <h3>Partner comparison</h3>
        <div className="partner-grid">
          {[...new Set(d.map((r) => r.partner).filter(Boolean))].map((p) => {
            const matches = d.filter((m) => m.partner === p);
            return (
              <div key={p}>
                <strong>{p}</strong>
                <b>{(sum(matches, 'points') / matches.length).toFixed(1)} avg points</b>
                <small>{matches.length} matches</small>
              </div>
            );
          })}
        </div>
      </section>
      <Records kind="matches" w={w} />
    </>
  );
}
export function Events({ w, initial = 'events' }) {
  const [tab, setTab] = useState(initial);
  return (
    <>
      <div className="tabs page-tabs">
        {['events', 'milestones', 'risks'].map((t) => (
          <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>
            {entities[t].title}
          </button>
        ))}
      </div>
      {tab === 'milestones' && (
        <section className="panel timeline">
          {[...w.data.milestones]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((m) => (
              <div key={m.id}>
                <span className="dot" />
                <small>{m.date}</small>
                <strong>{m.title}</strong>
                <Badge>{m.status}</Badge>
              </div>
            ))}
        </section>
      )}
      <Records key={tab} kind={tab} w={w} />
    </>
  );
}
