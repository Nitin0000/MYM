import { TimeFilter, UnifiedEntry } from './types';

export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOccurrences(entry: UnifiedEntry, viewStart: string, viewEnd: string): UnifiedEntry[] {
  if (entry.frequency === 'one-time') {
    if (entry.date >= viewStart && entry.date <= viewEnd) return [entry];
    return [];
  }

  const occurrences: UnifiedEntry[] = [];
  let current = new Date(entry.date);

  // Use a fallback end date far in the future if none is provided, 
  // but strictly bound it by the viewEnd to prevent infinite loops
  const endLimit = entry.endDate ? new Date(entry.endDate) : new Date(viewEnd);
  const actualEnd = new Date(Math.min(endLimit.getTime(), new Date(viewEnd).getTime()));

  const vStart = new Date(viewStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to start of day for comparison

  while (current <= actualEnd) {
    if (current >= vStart) {
      const dateStr = current.toISOString().split('T')[0];
      const isPredicted = current > today;
      occurrences.push({
        ...entry,
        original_id: entry.original_id || entry.id, // preserve base id for DB operations
        id: `${entry.id}-${dateStr}`, // unique ID for list rendering
        date: dateStr,
        isPredicted,
      });
    }

    if (entry.frequency === 'monthly') {
      current.setMonth(current.getMonth() + 1);
    } else if (entry.frequency === 'quarterly') {
      current.setMonth(current.getMonth() + 3);
    } else if (entry.frequency === 'yearly') {
      current.setFullYear(current.getFullYear() + 1);
    } else {
      break; // failsafe
    }
  }

  return occurrences;
}

export function processEntries(
  rawEntries: UnifiedEntry[],
  timeFilter: TimeFilter,
  viewRange: { start: string; end: string } | null
): UnifiedEntry[] {
  // If 'all', view from 1970 to today. We don't predict infinitely into the future for 'all'.
  const vStart = viewRange ? viewRange.start : '1970-01-01';
  const vEnd = viewRange ? viewRange.end : toLocalDateString(new Date());
  const todayStr = toLocalDateString(new Date());

  let processed: UnifiedEntry[] = [];

  for (const entry of rawEntries) {
    const occs = getOccurrences(entry, vStart, vEnd);
    if (occs.length === 0) continue;

    if (timeFilter === 'month') {
      processed.push(...occs);
    } else {
      // For Yearly or All-Time, we aggregate occurrences into a single row
      const sum = occs.reduce((acc, o) => acc + o.amount, 0);
      const isAnyPredicted = occs.some((o) => o.isPredicted);

      processed.push({
        ...entry,
        amount: sum,
        isPredicted: isAnyPredicted,
        original_id: entry.original_id || entry.id,
      });
    }
  }

  // Calculate & Add Average Predictions if viewing a future period (month or year)
  if (viewRange && viewRange.start > todayStr) {
    let firstDateStr = todayStr;
    let varInc = 0, varExp = 0;

    // Only look at past one-time entries to establish a baseline
    for (const e of rawEntries) {
      if (e.frequency === 'one-time' && e.date <= todayStr) {
        if (e.date < firstDateStr) firstDateStr = e.date;
        if (e.kind === 'income') varInc += e.amount;
        if (e.kind === 'expense') varExp += e.amount;
      }
    }

    const firstDate = new Date(firstDateStr);
    const now = new Date();
    let monthsDiff = (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth()) + 1;
    if (monthsDiff < 1) monthsDiff = 1;

    const avgVarInc = varInc / monthsDiff;
    const avgVarExp = varExp / monthsDiff;

    // Scale for Yearly view if needed
    const multiplier = timeFilter === 'year' ? 12 : 1;

    if (avgVarInc > 0) {
      processed.push({
        id: `pred-inc-${viewRange.start}`,
        amount: Math.round(avgVarInc * multiplier),
        kind: 'income',
        label: 'Predicted Variable',
        date: viewRange.start,
        description: `Based on past avg (${monthsDiff} mos)`,
        frequency: 'one-time',
        isPredicted: true,
        created_at: new Date().toISOString(),
      });
    }
    if (avgVarExp > 0) {
      processed.push({
        id: `pred-exp-${viewRange.start}`,
        amount: Math.round(avgVarExp * multiplier),
        kind: 'expense',
        label: 'Predicted Variable',
        date: viewRange.start,
        description: `Based on past avg (${monthsDiff} mos)`,
        frequency: 'one-time',
        isPredicted: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Sort descending by date, then created_at
  processed.sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return b.created_at.localeCompare(a.created_at);
  });

  return processed;
}
