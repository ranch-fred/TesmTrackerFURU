import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight as Out,
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Users,
  Package,
  AlertTriangle,
  Radio,
  Target,
  Flame,
  ChevronRight,
  Download,
  Shuffle,
  FileText,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { finance, money, sum, trend, attendance, legality, canEdit } from './domain';
import Records, { Badge, RecordForm } from './Records';
import { entities } from './schema';
import { pdf, csv } from './exports';
import { AnimatedValue, useMotion } from './Motion';
const palette = ['#ff6b00', '#ff9d55', '#ffbf87', '#9a633e', '#5a4635', '#39332e'];
export function Stat({ label, value, note, icon: Icon, tone = '' }) {
  return (
    <article className={`stat-card ${tone}`}>
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
              <stop offset="0%" stopColor="#ff6b00" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#ff6b00" stopOpacity={0} />
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
              stroke={i ? '#929292' : '#ff6b00'}
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
export function Dashboard({ w, navigate }) {
  const [form, setForm] = useState(null);
  const d = w.data,
    f = w.member.role === 'Parent/Sponsor' && w.summary ? w.summary : finance(d),
    robot = d.robot[0] || w.dashboard?.robot || {},
    rules = legality(robot, d.hardware, d.rules[0]),
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
            26<span>/</span>27
          </strong>
          <small>{w.team.season.replace('2026–27 ', '')}</small>
        </div>
        <div className="banner-grid" />
      </section>
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
            <button onClick={() => setForm('outreach')}>
              <Users size={15} /> Log outreach <ArrowUpRight size={14} />
            </button>
          </div>
        ) : (
          <button className="text-button" onClick={() => navigate('announcements')}>
            Latest announcements <ArrowRight size={15} />
          </button>
        )}
      </div>
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
        />
        <Stat
          label="OUTREACH HOURS"
          value={sum(d.outreach, 'hours').toString().padStart(2, '0')}
          note={`${sum(d.outreach, 'reached')} people reached`}
          icon={Users}
        />
        <Stat
          label="NEXT COMPETITION"
          value={days === null ? '—' : days + 'd'}
          note={next?.name || 'Add a competition event'}
          icon={CalendarDays}
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
              <div className="wheel w1" />
              <div className="wheel w2" />
              <div className="wheel w3" />
              <div className="wheel w4" />
              <span className="schematic-core">30439</span>
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
              <Badge tone={rules.verified ? (rules.pass ? 'green' : 'red') : 'yellow'}>
                {rules.verified ? (rules.pass ? 'PASS' : 'CHECK') : 'UNVERIFIED'}
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
                <Flame size={16} className="orange" /> Showing up matters.
              </h3>
              <span className="muted">ATTENDANCE</span>
            </div>
            {d.roster.slice(0, 3).map((p) => {
              const a = attendance(p.name, d.sessions);
              return (
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
                      {a.hours.toFixed(1)} team hours ·{' '}
                      {a.streak === -1 ? d.sessions.length : a.streak} session streak
                    </small>
                  </span>
                  <b>{a.percent}%</b>
                </div>
              );
            })}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h3>
                <Target size={16} className="orange" /> Field notes.
              </h3>
              <button
                className="icon-button"
                aria-label="Open match analytics"
                onClick={() => navigate('matches')}
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
  const [tab, setTab] = useState('overview'),
    [form, setForm] = useState(null);
  const d = w.data,
    parent = w.member.role === 'Parent/Sponsor',
    f = parent && w.summary ? w.summary : finance(d);
  const categories = d.budgets.map((b) => ({
    category: b.category,
    budget: Number(b.amount),
    actual: sum(
      d.expenses.filter((e) => e.category === b.category),
      'amount',
    ),
  }));
  const split = [...new Set(d.expenses.map((e) => e.category))].map((category) => ({
    name: category,
    value: sum(
      d.expenses.filter((e) => e.category === category),
      'amount',
    ),
  }));
  function report() {
    pdf(
      'Finance report',
      [
        {
          title: 'Season finances',
          lines: [
            `Received: ${money(f.received)}`,
            `Spent: ${money(f.spent)}`,
            `Balance: ${money(f.balance)}`,
            `Pledged: ${money(f.pledged)}`,
          ],
        },
        {
          title: 'Budget vs actual',
          lines: categories.map(
            (c) => `${c.category}: budget ${money(c.budget)} / actual ${money(c.actual)}`,
          ),
        },
      ],
      w.team,
    );
  }
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">BUSINESS / THE BIG PICTURE</div>
        <h1>
          FUND THE <span>MISSION.</span>
        </h1>
        <p>Every receipt. Every relationship. Every next possibility.</p>
      </div>
      <div className="stats-grid">
        <Stat
          label="CURRENT BALANCE"
          value={money(f.balance)}
          note="Received less recorded expenses"
          icon={Wallet}
          tone="accent"
        />
        <Stat
          label="MONEY RECEIVED"
          value={money(f.received)}
          note="Funds received this season"
          icon={ArrowDownLeft}
        />
        <Stat label="MONEY SPENT" value={money(f.spent)} note="All recorded expenses" icon={Out} />
        <Stat
          label="PLEDGED, NOT RECEIVED"
          value={money(f.pledged - f.received)}
          note="Keep those conversations moving"
          icon={Clock3}
        />
      </div>
      <div className="page-actions">
        <div className="tabs">
          {(parent ? ['overview'] : ['overview', 'expenses', 'income', 'purchases', 'budgets']).map(
            (t) => (
              <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>
                {t === 'overview' ? 'Overview' : entities[t].title}
              </button>
            ),
          )}
        </div>
        <div className="inline">
          <button className="outline" onClick={report}>
            <FileText size={16} /> Sponsor PDF
          </button>
          <button
            className="outline"
            onClick={() =>
              csv(
                'finance-summary',
                [f],
                ['received', 'spent', 'balance', 'pledged'].map((key) => ({ key, label: key })),
              )
            }
          >
            <Download size={15} /> Summary CSV
          </button>
          {!parent && canEdit(w.member.role, w.member.mentor_edit) && (
            <button className="primary" onClick={() => setForm('expenses')}>
              <Plus size={16} /> Log expense
            </button>
          )}
        </div>
      </div>
      {tab !== 'overview' ? (
        <Records key={tab} kind={tab} w={w} />
      ) : (
        <>
          <div className="finance-layout">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow subtle">CASH FLOW</span>
                  <h2>Resources for the road ahead.</h2>
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
                  <Chart data={trend(d)} height={280} />
                  <small className="chart-footnote">
                    Cumulative recorded totals · Funding is grouped by last contact date.
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
                    <div style={{ height: 210 }}>
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
            <>
              <div className="finance-layout">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow subtle">PLAN VS. REALITY</span>
                      <h2>Stay ahead of the budget.</h2>
                    </div>
                    <button className="text-button" onClick={() => setTab('budgets')}>
                      Edit budgets <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div style={{ height: 270 }}>
                    <ResponsiveContainer>
                      <BarChart data={categories}>
                        <CartesianGrid stroke="#303030" vertical={false} />
                        <XAxis
                          dataKey="category"
                          tick={{ fill: '#999', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#999', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{ background: '#222', border: '1px solid #555' }}
                          formatter={money}
                        />
                        <Bar
                          isAnimationActive={enabled}
                          dataKey="budget"
                          fill="#414141"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          isAnimationActive={enabled}
                          dataKey="actual"
                          fill="#ff6b00"
                          radius={[3, 3, 0, 0]}
                        />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {categories
                    .filter((c) => c.actual > c.budget)
                    .map((c) => (
                      <p className="error" key={c.category}>
                        {c.category} is {money(c.actual - c.budget)} over budget.
                      </p>
                    ))}
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow subtle">FOLLOW THROUGH</span>
                      <h2>Next conversations.</h2>
                    </div>
                  </div>
                  {[...d.income]
                    .filter((i) => i.followUp)
                    .sort((a, b) => a.followUp.localeCompare(b.followUp))
                    .slice(0, 4)
                    .map((i) => (
                      <div className="funding-row" key={i.id}>
                        <span className="funding-icon">{i.company?.[0]}</span>
                        <div>
                          <strong>{i.company}</strong>
                          <small>Follow up {i.followUp}</small>
                        </div>
                        <Badge>{i.status}</Badge>
                      </div>
                    ))}
                  <div className="finance-warning">
                    <AlertTriangle size={18} />
                    <div>
                      <b>
                        {d.expenses.filter((e) => e.reimbursement === 'Pending').length}{' '}
                        reimbursements pending
                      </b>
                      <small>Keep your team’s out-of-pocket costs in view.</small>
                    </div>
                  </div>
                </section>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Recent transactions</h2>
                  <button className="text-button" onClick={() => setTab('expenses')}>
                    View all expenses <ArrowRight size={16} />
                  </button>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Paid by</th>
                        <th>Status</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...d.expenses]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .slice(0, 5)
                        .map((e) => (
                          <tr key={e.id}>
                            <td>{e.date}</td>
                            <td>
                              <strong>{e.description}</strong>
                            </td>
                            <td>{e.category}</td>
                            <td>{e.paidBy}</td>
                            <td>
                              <Badge>{e.reimbursement}</Badge>
                            </td>
                            <td className="money">−{money(e.amount)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
      {form && <RecordForm w={w} kind={form} onClose={() => setForm(null)} />}
    </>
  );
}
export function Robot({ w }) {
  const [tab, setTab] = useState('robot'),
    r = w.data.robot[0],
    check = legality(r, w.data.hardware, w.data.rules[0]);
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">ROBOT / DESIGN. BUILD. VERIFY.</div>
        <h1>
          MEET THE <span>MACHINE.</span>
        </h1>
        <p>Every mechanism has a purpose. Every connection has a name.</p>
      </div>
      <div className="robot-top">
        <section className="panel robot-detail">
          <div className="blueprint-grid">
            <div className="technical-title">{r?.name || 'NO ROBOT CONFIGURED'}</div>
            <div className="technical-number">30439</div>
            <div className="technical-dims">
              L {r?.length || '—'}″ / W {r?.width || '—'}″ / H {r?.height || '—'}″
            </div>
            <span>SEASON DESIGN / DIMENSIONAL REFERENCE</span>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Legality checks</h2>
            <ShieldCheck className="orange" />
          </div>
          {!check.verified ? (
            <div className="rule-warning">
              <AlertTriangle />
              <h3>Ruleset needs verification.</h3>
              <p>
                Draft limits are for testing only. Enter limits and an official source under
                Legality limits, then mark the ruleset verified.
              </p>
            </div>
          ) : (
            <>
              <Badge tone={check.pass ? 'green' : 'red'}>
                {check.pass ? 'WITHIN CONFIGURED LIMITS' : 'OUTSIDE CONFIGURED LIMITS'}
              </Badge>
              {check.checks.map((c) => (
                <div key={c.name} className="check-row">
                  <span>{c.name}</span>
                  <b className={c.pass ? 'success' : 'error'}>
                    {c.actual} / {c.max} {c.pass ? '✓' : '!'}
                  </b>
                </div>
              ))}
              <p className="note">
                This checks recorded values only. It does not replace physical inspection.
              </p>
            </>
          )}
        </section>
      </div>
      <div className="tabs page-tabs">
        {['robot', 'subsystems', 'hardware', 'inspection', 'rules'].map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {entities[t].title}
          </button>
        ))}
      </div>
      <Records kind={tab} key={tab} w={w} />
    </>
  );
}
export function Matches({ w }) {
  const { enabled } = useMotion();
  const d = w.data.matches,
    [tab, setTab] = useState('matches'),
    best = d.length ? Math.max(...d.map((m) => Number(m.points) || 0)) : 0,
    worst = d.length ? Math.min(...d.map((m) => Number(m.points) || 0)) : 0;
  const avg = (k) => (d.length ? (sum(d, k) / d.length).toFixed(1) : '—');
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">COMPETITION / FIND YOUR EDGE</div>
        <h1>
          BUILT. TESTED. <span>BETTER.</span>
        </h1>
        <p>Turn each match into the next improvement.</p>
      </div>
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
          note="Official recorded totals"
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
        BIOBUZZ metrics follow your brief. Points are recorded manually; scoring rules have not been
        verified.
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
                stroke="#ff6b00"
                strokeWidth={3}
                dot={{ fill: '#ff6b00', r: 4 }}
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
export function Events({ w }) {
  const [tab, setTab] = useState('events');
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
export function Judging({ w }) {
  const [question, setQuestion] = useState(null),
    [answer, setAnswer] = useState(false);
  return (
    <>
      <section className="panel judging-practice">
        <div className="eyebrow">PRACTICE MAKES PREPARED</div>
        <h2>{question ? question.question : 'Tell the story behind the build.'}</h2>
        {question && (
          <>
            <Badge>{question.category}</Badge>
            <p className="muted">Lead speaker: {question.speaker}</p>
            {answer && <p className="practice-answer">{question.answer}</p>}
          </>
        )}
        <div className="inline">
          <button
            className="primary"
            disabled={!w.data.judging.length}
            onClick={() => {
              const questions = w.data.judging.filter((q) => q.id !== question?.id);
              setQuestion(
                (questions.length ? questions : w.data.judging)[
                  Math.floor(Math.random() * (questions.length || w.data.judging.length))
                ],
              );
              setAnswer(false);
            }}
          >
            <Shuffle size={16} /> Random question
          </button>
          {question && (
            <button className="outline" onClick={() => setAnswer((a) => !a)}>
              {answer ? 'Hide' : 'Show'} talking points
            </button>
          )}
        </div>
      </section>
      <Records kind="judging" w={w} />
    </>
  );
}
export function Portfolio({ w }) {
  const [busy, setBusy] = useState(false),
    [note, setNote] = useState('');
  async function pull() {
    setBusy(true);
    try {
      let count = 0;
      for (const kind of ['designs', 'programming', 'outreach', 'income', 'robot'])
        for (const r of w.data[kind]) {
          const source = kind + ':' + r.id;
          if (w.data.portfolio.some((p) => p.source === source)) continue;
          await w.save('portfolio', {
            title: r.title || r.name || r.company || r.subsystem || kind,
            body: entities[kind].fields
              .filter((f) => !['id', 'images', 'receipt'].includes(f.key))
              .map(
                (f) =>
                  `${f.label}: ${Array.isArray(r[f.key]) ? r[f.key].join(', ') : (r[f.key] ?? '')}`,
              )
              .join('\n'),
            source,
            order: ++count + w.data.portfolio.length,
          });
        }
      setNote(`${count} source entries added. Existing draft edits preserved.`);
    } catch (e) {
      setNote(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel portfolio-intro">
        <div>
          <div className="eyebrow">FROM WORKSHOP TO STORY</div>
          <h2>The evidence is already here.</h2>
          <p>
            Pull your team’s work into an editable draft. Refine the story, then take it to judging.
          </p>
        </div>
        <div className="inline">
          {canEdit(w.member.role, w.member.mentor_edit) && (
            <button disabled={busy} className="primary" onClick={pull}>
              <Plus size={16} />
              {busy ? 'Pulling entries…' : 'Pull source entries'}
            </button>
          )}
          <button
            className="outline"
            onClick={() =>
              pdf(
                'Engineering portfolio',
                [...w.data.portfolio]
                  .sort((a, b) => a.order - b.order)
                  .map((p) => ({ title: p.title, lines: [p.body] })),
                w.team,
              )
            }
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
        {note && <p role="status">{note}</p>}
      </section>
      <Records kind="portfolio" w={w} />
    </>
  );
}
export function Reports({ w }) {
  const d = w.data,
    f = finance(d);
  const reports = {
    season: [
      { title: 'Team', lines: [w.team.name + ' #' + w.team.number, w.team.season] },
      {
        title: 'Summary',
        lines: [
          `${d.matches.length} matches; ${d.tasks.filter((t) => t.status === 'Done').length} tasks completed`,
          `${sum(d.outreach, 'hours')} outreach hours; ${sum(d.outreach, 'reached')} people reached`,
          `Balance: ${money(f.balance)}`,
        ],
      },
    ],
    finance: [
      {
        title: 'Finances',
        lines: [
          `Received ${money(f.received)}`,
          `Spent ${money(f.spent)}`,
          `Balance ${money(f.balance)}`,
          ...d.budgets.map(
            (b) =>
              `${b.category}: budget ${money(b.amount)}, actual ${money(
                sum(
                  d.expenses.filter((e) => e.category === b.category),
                  'amount',
                ),
              )}`,
          ),
        ],
      },
    ],
    outreach: d.outreach.map((o) => ({
      title: o.name,
      lines: [`${o.date} / ${o.hours} hours / ${o.reached} people`, o.impact, o.followUp],
    })),
    attendance: d.roster.map((p) => {
      const a = attendance(p.name, d.sessions);
      return { title: p.name, lines: [`${a.percent}% attendance; ${a.hours.toFixed(1)} hours`] };
    }),
  };
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">REPORTS / READY WHEN YOU ARE</div>
        <h1>
          LET THE <span>WORK SPEAK.</span>
        </h1>
        <p>Clean reports for your team, sponsors, and judges.</p>
      </div>
      <div className="report-grid">
        {Object.entries(reports).map(([key, sections]) => (
          <section className="panel" key={key}>
            <FileText size={28} className="orange" />
            <h2>{key[0].toUpperCase() + key.slice(1)} report</h2>
            <p>Export the current team records in a shareable format.</p>
            <div className="inline">
              <button className="primary" onClick={() => pdf(key + ' report', sections, w.team)}>
                Download PDF <Download size={16} />
              </button>
              <button
                className="outline"
                onClick={() =>
                  csv(
                    key + '-report',
                    sections.map((s) => ({ title: s.title, summary: s.lines.join('\n') })),
                    [
                      { key: 'title', label: 'Section' },
                      { key: 'summary', label: 'Summary' },
                    ],
                  )
                }
              >
                CSV
              </button>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
