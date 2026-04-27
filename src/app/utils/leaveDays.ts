export interface LeavePolicySettings {
  exclude_sundays_from_leave: boolean;
}

const toDateOnly = (value: unknown): Date | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    const s = value.trim();
    // Common backend format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    // ISO or other date string
    const dt = new Date(s);
    if (Number.isNaN(dt.getTime())) return null;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }

  // Date object or timestamp
  const dt = new Date(value as any);
  if (Number.isNaN(dt.getTime())) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

export const calculateLeaveDays = (
  startDate: any,
  endDate: any,
  excludeSundays = false
): number => {
  if (!startDate || !endDate) return 0;

  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    if (!excludeSundays || current.getDay() !== 0) {
      count += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};
