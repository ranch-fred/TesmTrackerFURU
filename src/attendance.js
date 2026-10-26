import { localDate } from './logs.js';

export function monthKey(year, month) {
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthDays(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  return [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: count }, (_, index) => {
      const day = index + 1;
      const date = new Date(year, month, day);
      return { day, key: localDate(date), mandatory: date.getDay() === 0 || date.getDay() === 6 };
    }),
  ];
}

export function attendanceStatus(day, todayKey, present, joinedKey) {
  if (!day || (joinedKey && day.key < joinedKey)) return 'inactive';
  if (present) return day.mandatory ? 'present-required' : 'present-extra';
  if (day.key < todayKey && day.mandatory) return 'missed';
  if (day.key === todayKey) return 'today';
  return day.mandatory ? 'required' : 'optional';
}

export function checkinsForMember(rows, member) {
  return new Set(
    rows
      .filter((row) =>
        row.attendanceCheckin
          ? row.attendanceUserId === member.user_id
          : Array.isArray(row.attendees) && row.attendees.includes(member.name),
      )
      .map((row) => row.date)
      .filter(Boolean),
  );
}

export function joinDate(member) {
  return member?.created_at ? localDate(new Date(member.created_at)) : null;
}

export function approvedMembers(members) {
  return members.filter((member) => member.status === 'approved');
}
