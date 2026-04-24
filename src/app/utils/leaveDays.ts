export interface LeavePolicySettings {
  exclude_sundays_from_leave: boolean;
}

export const calculateLeaveDays = (
  startDate: string,
  endDate: string,
  excludeSundays = false
): number => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
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
