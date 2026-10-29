import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Radio,
  KanbanSquare,
  Users,
  CalendarDays,
  NotebookPen,
  Bot,
  Lightbulb,
  Flag,
  BookOpen,
  Wallet,
  ShoppingCart,
  FileText,
  Settings as SettingsIcon,
  Activity,
  Search,
  Bell,
  ArrowUpRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  ScrollText,
} from 'lucide-react';
import Auth, { Brand } from './Auth';
import { useWorkspace } from './store';
import { sections, labels, entities } from './schema';
import { canView } from './domain';
import Records, { Modal, Badge } from './Records';
import { Dashboard, Finance, Robot } from './Views';
import { AttendanceHub, CompetitionHub } from './Hubs';
import DesignLibrary from './DesignLibrary';
import LogsHub from './LogsHub';
import ResourcesCenter from './ResourcesCenter';
import Settings from './Settings';
import { MotionScene, MotionToggle } from './Motion';
import { teamMonogram, teamPageTitle } from './branding';
import IsoLoop from './IsoLoop';
const icons = {
  dashboard: LayoutDashboard,
  announcements: Radio,
  tasks: KanbanSquare,
  attendance: Users,
  meetings: NotebookPen,
  robot: Bot,
  logs: ScrollText,
  designs: Lightbulb,
  competition: Flag,
  resources: BookOpen,
  finance: Wallet,
  purchases: ShoppingCart,
};
const hiddenKinds = new Set([
  'subsystems',
  'rules',
  'judging',
  'portfolio',
  'reports',
  'parts',
  'roster',
  'sessions',
]);
function pageForKind(kind) {
  if (['sessions', 'roster'].includes(kind)) return 'attendance';
  if (['matches', 'events', 'milestones', 'risks', 'packing'].includes(kind)) return 'competition';
  if (['expenses', 'income', 'budgets'].includes(kind)) return 'finance';
  if (['hardware', 'inspection'].includes(kind)) return 'robot';
  if (['programming', 'build', 'outreach'].includes(kind)) return 'logs';
  return kind;
}
export default function App() {
  const w = useWorkspace(),
    [page, setPage] = useState('dashboard'),
    [innerPage, setInnerPage] = useState(null),
    [menu, setMenu] = useState(false),
    [search, setSearch] = useState(''),
    [showSearch, setShowSearch] = useState(false),
    [showNotifications, setShowNotifications] = useState(false),
    [help, setHelp] = useState(false),
    [seen, setSeen] = useState(() => localStorage.getItem('cnp-notifications-seen') || '');
  function navigate(p, inner = null) {
    setPage(p);
    setInnerPage(inner);
    setMenu(false);
    setShowSearch(false);
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  useEffect(() => {
    // Ctrl/Cmd+K or / opens search from anywhere outside a text field
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(true);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (w.member && !canView(w.member.role, page)) setPage('dashboard');
  }, [w.member?.role, page]);
  useEffect(() => {
    document.title = teamPageTitle(w.member?.status === 'approved' ? w.team : null);
  }, [w.team?.name, w.team?.number, w.member?.status]);
  if (!w.user || !w.team || !w.member || w.member.status !== 'approved')
    return (
      <>
        <Auth w={w} />
        {w.error && (
          <div className="toast error" role="alert">
            {w.error}
            <button onClick={() => w.setError('')}>×</button>
          </div>
        )}
      </>
    );
  if (!w.member.onboarded)
    return (
      <div className="welcome-screen">
        <Brand team={w.team} />
        <div className="panel">
          <IsoLoop name="field" />
          <div className="eyebrow">YOU’RE PART OF THE CREW</div>
          <h1>
            WELCOME <span>ABOARD.</span>
          </h1>
          <p>
            {w.member.name}, your workspace for {w.team.name} is ready.
          </p>
          <div className="onboarding-steps">
            <p>
              01 / Your sub-teams: {w.member.subteams?.join(', ') || 'Choose with your captain'}
            </p>
            <p>02 / Check your task board and team announcements.</p>
            <p>03 / Log your work. Build the evidence as you go.</p>
          </div>
          <button className="primary" onClick={() => w.preferences(true, true)}>
            Let’s get building <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    );
  const role = w.member.role,
    unread = w.member.notification_preferences
      ? w.notifications.filter((n) => n.created_at > seen)
      : [];
  const results = Object.entries(w.data)
    .filter(([k]) => !hiddenKinds.has(k) && canView(role, k) && canView(role, pageForKind(k)))
    .flatMap(([kind, rows]) =>
      rows
        .filter((r) => Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase()))
        .map((r) => ({ kind, r })),
    )
    .slice(0, 20);
  let view;
  if (page === 'dashboard') view = <Dashboard w={w} navigate={navigate} />;
  else if (page === 'finance') view = <Finance w={w} />;
  else if (page === 'robot') view = <Robot w={w} initial={innerPage || 'robot'} />;
  else if (page === 'attendance')
    view = <AttendanceHub key={innerPage || 'sessions'} w={w} initial={innerPage || 'sessions'} />;
  else if (page === 'competition')
    view = <CompetitionHub key={innerPage || 'matches'} w={w} initial={innerPage || 'matches'} />;
  else if (page === 'resources') view = <ResourcesCenter w={w} initial={innerPage || 'official'} />;
  else if (page === 'logs') view = <LogsHub key={innerPage || ''} w={w} initial={innerPage} />;
  else if (page === 'designs') view = <DesignLibrary w={w} />;
  else if (page === 'settings') view = <Settings w={w} />;
  else if (page === 'activity')
    view = (
      <section className="panel">
        <div className="panel-heading">
          <h2>Activity log</h2>
          <button className="outline" onClick={w.refresh}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <p className="muted">Recorded changes, including who changed what and when.</p>
        <input
          aria-label="Search activity"
          placeholder="Search activity…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="activity-feed">
          {w.activity
            .filter((a) => JSON.stringify(a).toLowerCase().includes(search.toLowerCase()))
            .map((a) => (
              <details key={a.id}>
                <summary>
                  <Badge>{a.action}</Badge> {labels[a.kind] || a.kind}{' '}
                  <small>
                    {w.members.find((m) => m.user_id === a.actor_id)?.name || a.actor_id} ·{' '}
                    {new Date(a.created_at).toLocaleString()}
                  </small>
                </summary>
                <pre>{JSON.stringify({ before: a.before_data, after: a.after_data }, null, 2)}</pre>
              </details>
            ))}
          {!w.activity.length && <p className="muted">Your first change will appear here.</p>}
        </div>
      </section>
    );
  else
    view = (
      <>
        <div className="page-intro compact-intro">
          <div className="eyebrow">
            {entities[page]?.group} / TEAM {w.team.number}
          </div>
          <h1>
            {labels[page]?.toUpperCase()}
            <span>.</span>
          </h1>
        </div>
        <Records key={page} kind={page} w={w} />
      </>
    );
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Brand team={w.team} />
          <button
            className="mobile-only icon-button"
            onClick={() => setMenu(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <div className="team-switch">
          <span className="team-monogram">{teamMonogram(w.team.name)}</span>
          <div>
            <strong>{w.team.name}</strong>
            <small>
              #{w.team.number} · {w.team.season}
            </small>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav aria-label="Team navigation">
          {sections.map(([group, items]) => {
            const visible = items.filter((p) => canView(role, p));
            if (!visible.length) return null;
            return (
              <div className="nav-group" key={group}>
                <div className="nav-heading">{group}</div>
                {visible.map((p) => {
                  const Icon = icons[p] || FileText;
                  const highlight =
                    (p === 'logs' && w.member.subteams?.includes('Programming')) ||
                    (p === 'designs' && w.member.subteams?.includes('CAD')) ||
                    (p === 'robot' && w.member.subteams?.includes('Mechanical'));
                  return (
                    <button
                      key={p}
                      onClick={() => navigate(p)}
                      aria-current={p === page ? 'page' : undefined}
                      className={`nav-item ${page === p ? 'active' : ''}`}
                    >
                      <Icon size={17} />
                      <span>{labels[p]}</span>
                      {p === 'tasks' && (
                        <small>{w.data.tasks.filter((t) => t.status !== 'Done').length}</small>
                      )}
                      {highlight && <i className="subteam-dot" title="Your sub-team" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          {role !== 'Parent/Sponsor' && (
            <button
              className={`nav-item ${page === 'activity' ? 'active' : ''}`}
              onClick={() => navigate('activity')}
            >
              <Activity size={16} />
              Activity log
            </button>
          )}
          <button
            className={`nav-item ${page === 'settings' ? 'active' : ''}`}
            onClick={() => navigate('settings')}
          >
            <SettingsIcon size={16} />
            Team settings
          </button>
          <button className="help-link" onClick={() => setHelp(true)}>
            <span>
              New to the console?<small>Get your bearings.</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-only icon-button"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <span>Team console</span>
            <ChevronRight size={13} />
            <strong>{labels[page]}</strong>
          </div>
          <div className="top-actions">
            <MotionToggle />
            <button className="global-search" onClick={() => setShowSearch(true)}>
              <Search size={16} />
              <span>Search anything</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className="notification-button icon-button"
              aria-label={`Notifications, ${unread.length} unread`}
              onClick={() => {
                setShowNotifications(true);
                const value = new Date().toISOString();
                setSeen(value);
                localStorage.setItem('cnp-notifications-seen', value);
              }}
            >
              <Bell size={19} />
              {unread.length > 0 && <i />}
            </button>
            <span className="top-divider" />
            <div className="user-info">
              <div className="avatar">
                {w.member.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <span>
                {w.member.name}
                <small>{w.member.role}</small>
              </span>
              <button
                className="icon-button"
                title="Sign out"
                aria-label="Sign out"
                onClick={w.logout}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
        {w.demo && (
          <div className="demo-bar">
            <span>
              <i className="dot" /> DEMO WORKSPACE{' '}
              <b>Fictional sample data · Saved on this device</b>
            </span>
            <button onClick={w.logout}>
              Connect your team <ArrowUpRight size={13} />
            </button>
          </div>
        )}
        <main
          id="main-content"
          className={`main-content page-${page}`}
          key={`${page}:${innerPage || ''}`}
        >
          {w.error && (
            <div className="error notice" role="alert">
              {w.error}
              <button onClick={() => w.setError('')}>Dismiss</button>
            </div>
          )}
          {w.busy && (
            <div className="sync-status" role="status">
              <RefreshCw size={12} className="spin" /> Syncing team data
            </div>
          )}
          <MotionScene>{view}</MotionScene>
          <footer className="workspace-footer">
            <span>
              {w.team.name} <b>#{w.team.number}</b>
            </span>
            <span>BUILD. TEST. ITERATE. REPEAT.</span>
            <button onClick={() => setHelp(true)}>
              Need a hand? <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {showSearch && (
        <Modal title="Find anything" onClose={() => setShowSearch(false)}>
          <div className="search">
            <Search size={18} />
            <input
              autoFocus
              placeholder="Search records and people…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="search-results">
            {search ? (
              results.map(({ kind, r }) => (
                <button key={r.id} onClick={() => navigate(pageForKind(kind), kind)}>
                  <Badge>{labels[kind]}</Badge>
                  <span>
                    {r.title ||
                      r.name ||
                      r.component ||
                      r.description ||
                      r.company ||
                      r.date ||
                      r.risk ||
                      r.question}
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))
            ) : (
              <p className="muted">Start typing to search your team’s accessible records.</p>
            )}
            {search && !results.length && <p className="muted">No matches found.</p>}
          </div>
        </Modal>
      )}
      {showNotifications && (
        <Modal title="Team notifications" onClose={() => setShowNotifications(false)}>
          {w.member.notification_preferences ? (
            w.notifications.length ? (
              w.notifications.map((n) => (
                <div key={n.id} className="notification-entry">
                  <h3>{n.title}</h3>
                  <small>{new Date(n.created_at).toLocaleString()}</small>
                  <button
                    className="text-button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('announcements');
                    }}
                  >
                    Read announcement <ArrowUpRight size={13} />
                  </button>
                </div>
              ))
            ) : (
              <p>Your team is all caught up.</p>
            )
          ) : (
            <p>In-app notifications are off. Enable them in Team settings.</p>
          )}
        </Modal>
      )}
      {help && (
        <Modal title="Your quick-start field guide" onClose={() => setHelp(false)}>
          <div className="guide">
            <h3>1 / Start your team</h3>
            <p>
              Sign in with Google, then choose Create team. Enter the team profile. You become the
              first captain and owner.
            </p>
            <h3>2 / Bring the crew</h3>
            <p>
              Copy the invite from Team settings → Invites. Members sign up, enter their profile,
              and request a role. A captain or coach approves them under Members.
            </p>
            <h3>3 / Keep the books</h3>
            <p>
              Finance & expenses → Log funding or add an expense. Enter the funding source, date,
              and amount, or record an expense with its receipt.
            </p>
            <h3>4 / Learn from every match</h3>
            <p>
              Competition → Matches → Add record. Enter match details, the BIOBUZZ metrics, recorded
              points, and mechanism issues.
            </p>
            <h3>5 / Keep everyone organized</h3>
            <p>
              Attendance & roster shows the team calendar and everyone who joined through the app.
              Check in when you arrive on Saturday, Sunday, or an extra weekday.
            </p>
            <p className="note">
              Demo mode stores only on this device. Live accounts, files and shared data require the
              Supabase setup included in the project.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
