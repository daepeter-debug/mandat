/** All selection is deterministic; a publication date is not evidence of causation. */
export function timelineEvents<T extends { id: string; published: string; rank?: number; category: string }>(items: readonly T[], start: string, end: string): T[] {
  const eligible = items.filter(n => n.published >= start && n.published <= end && n.category !== 'Prieskumy')
    .sort((a,b) => (a.rank ?? 99) - (b.rank ?? 99) || a.published.localeCompare(b.published) || a.id.localeCompare(b.id));
  const weeks = new Map<number,T>();
  for (const n of eligible) {
    const week = Math.floor((Date.parse(`${n.published}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / (7*86400000));
    if (!weeks.has(week)) weeks.set(week,n);
  }
  return [...weeks.values()].sort((a,b) => a.published.localeCompare(b.published)).slice(-8);
}

export function coalitionSelection(ids: readonly string[], allowed: readonly string[], id: string, selected: boolean): string[] {
  const clean = [...new Set(ids)].filter(value => allowed.includes(value));
  if (!allowed.includes(id)) return clean;
  return selected ? clean.includes(id) ? clean : [...clean,id] : clean.filter(value => value !== id);
}
