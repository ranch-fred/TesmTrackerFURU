import { canView } from './domain.js';

// Sidebar structure. `page` is the App page key; `inner` opens a tab inside it.
// Everyday pages sit in the main list, the three logs get their own group so
// logging work is one click, and rarely used pages live under "More".
export const mainNav = [
  { id: 'dashboard', label: 'Home', page: 'dashboard' },
  { id: 'tasks', label: 'Tasks', page: 'tasks' },
  { id: 'roster', label: 'Team roster', page: 'roster' },
  { id: 'attendance', label: 'Attendance', page: 'attendance' },
  { id: 'announcements', label: 'Announcements', page: 'announcements' },
  { id: 'finance', label: 'Funds', page: 'finance' },
  { id: 'competition', label: 'Competitions', page: 'competition' },
  { id: 'robot', label: 'Robot', page: 'robot' },
  { id: 'mechanisms', label: 'Mechanism chart', page: 'mechanisms' },
];
export const logNav = [
  { id: 'cad', label: 'CAD log', page: 'designs' },
  { id: 'build', label: 'Build log', page: 'logs', inner: 'build' },
  { id: 'programming', label: 'Programming log', page: 'logs', inner: 'programming' },
  { id: 'outreach', label: 'Outreach log', page: 'logs', inner: 'outreach' },
];
export const moreNav = [
  { id: 'meetings', label: 'Meeting notes', page: 'meetings' },
  { id: 'designs', label: 'Design ideas', page: 'designs' },
  { id: 'purchases', label: 'Purchase requests', page: 'purchases' },
  { id: 'resources', label: 'FTC resources', page: 'resources' },
  { id: 'activity', label: 'Activity log', page: 'activity' },
];
// logs are gated per log (a sponsor can see outreach, not build)
const allowed = (role, item) => canView(role, item.inner || item.page);
export function visibleNav(role) {
  return {
    main: mainNav.filter((i) => allowed(role, i)),
    logs: logNav.filter((i) => allowed(role, i)),
    more: moreNav.filter((i) => allowed(role, i)),
  };
}
export function isMoreActive(page) {
  return moreNav.some((i) => i.page === page);
}
