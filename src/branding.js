export function teamMonogram(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'FTC';
  return (
    words.length > 1
      ? words
          .slice(0, 3)
          .map((word) => word[0])
          .join('')
      : words[0].slice(0, 3)
  ).toUpperCase();
}

export function seasonBadge(season) {
  const value = String(season || '').trim();
  const years = value.match(/(20\d{2})\s*[-–—/]\s*(?:20)?(\d{2})/);
  return {
    years: years ? `${years[1].slice(2)}/${years[2]}` : 'FTC',
    label: years ? value.replace(years[0], '').trim() || 'TEAM SEASON' : value || 'TEAM SEASON',
  };
}

export function teamPageTitle(team) {
  return team?.name && team?.number
    ? `${team.name} #${team.number} • Team Tracker`
    : 'FTC Team Tracker • Sign in or sign up';
}
