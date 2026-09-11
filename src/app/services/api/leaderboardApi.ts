import apiClient from './apiClient';

export interface LeaderboardEntry {
  user_id: number;
  full_name: string;
  employee_id: string | null;
  branch_id: number | null;
  branch_name: string | null;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_day_days: number;
  leave_days: number;
  early_departure_days: number;
  points: number;
  avg_check_in_time: string | null;
  rank: number;
}

export type LeaderboardPeriod = 'week' | 'month' | 'year';

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  offset: number;
  periodLabel: string;
  canGoOlder: boolean;
  startDate: string;
  endDate: string;
  company: LeaderboardEntry[];
  branch: LeaderboardEntry[];
  currentUser: {
    user_id: number;
    companyRank: number | null;
    branchRank: number | null;
    points: number;
  };
}

export const leaderboardApi = {
  // `offset` (0 = current period, -1 = previous, etc.) pages back through
  // past weeks/months/years using data already recorded.
  getLeaderboard: async (period: LeaderboardPeriod, offset: number = 0): Promise<{ success: boolean; data: LeaderboardResponse }> => {
    const response = await apiClient.get('/attendance/leaderboard', { params: { period, offset } });
    return response.data;
  },
};
