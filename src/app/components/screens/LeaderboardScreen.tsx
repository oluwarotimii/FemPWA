import { useEffect, useMemo, useState } from 'react';
import { Trophy, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { leaderboardApi, type LeaderboardEntry, type LeaderboardPeriod, type LeaderboardResponse } from '@/app/services/api';
import { useAuth } from '@/app/contexts/AuthContext';

const TOP_N = 10;

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function LeaderboardScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const [scope, setScope] = useState<'branch' | 'company'>('company');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Changing period with a stale offset (e.g. "-3" from Week) would silently
  // jump to an unrelated month/year 3 periods back — always reset to current.
  const changePeriod = (p: LeaderboardPeriod) => {
    setPeriod(p);
    setOffset(0);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    leaderboardApi
      .getLeaderboard(period, offset)
      .then((res) => {
        if (!cancelled && res.success) setData(res.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, offset]);

  const entries = scope === 'company' ? data?.company ?? [] : data?.branch ?? [];
  const currentUserRank = scope === 'company' ? data?.currentUser.companyRank : data?.currentUser.branchRank;

  const { topEntries, currentUserEntry, currentUserInTop } = useMemo(() => {
    const top = entries.slice(0, TOP_N);
    const mine = entries.find((e) => e.user_id === user?.id) ?? null;
    const inTop = Boolean(mine && top.some((e) => e.user_id === mine.user_id));
    return { topEntries: top, currentUserEntry: mine, currentUserInTop: inTop };
  }, [entries, user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <Trophy className="w-6 h-6 text-yellow-500" />
      </div>

      <Tabs value={period} onValueChange={(v) => changePeriod(v as LeaderboardPeriod)} className="mb-3">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => setOffset((o) => o - 1)}
          disabled={data?.canGoOlder === false}
          className="disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-600">{data?.periodLabel ?? ' '}</span>
        <button
          onClick={() => setOffset((o) => o + 1)}
          disabled={offset === 0}
          className="disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-medium border ${scope === 'branch' ? 'bg-[#1A2B3C] text-white border-[#1A2B3C]' : 'bg-white text-gray-600 border-gray-200'}`}
          onClick={() => setScope('branch')}
        >
          My Branch
        </button>
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-medium border ${scope === 'company' ? 'bg-[#1A2B3C] text-white border-[#1A2B3C]' : 'bg-white text-gray-600 border-gray-200'}`}
          onClick={() => setScope('company')}
        >
          Company
        </button>
      </div>

      {currentUserRank != null && (
        <Card className="mb-4 bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50] text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium">Your rank ({scope === 'company' ? 'Company' : 'Branch'})</span>
            <span className="text-2xl font-bold">#{currentUserRank}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 divide-y">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading…
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No attendance data for this period yet.
            </div>
          ) : (
            <>
              {topEntries.map((entry) => (
                <LeaderboardRow key={entry.user_id} entry={entry} isCurrentUser={entry.user_id === user?.id} showBranch={scope === 'company'} />
              ))}
              {currentUserEntry && !currentUserInTop && (
                <LeaderboardRow entry={currentUserEntry} isCurrentUser showBranch={scope === 'company'} pinned />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  showBranch,
  pinned = false,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  showBranch: boolean;
  pinned?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-3 ${isCurrentUser ? 'bg-green-50' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-6 text-sm font-semibold text-gray-500">{pinned ? '·' : entry.rank}</span>
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-[#1A2B3C] shrink-0">
          {initials(entry.full_name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {entry.full_name}
            {isCurrentUser ? ' (You)' : ''}
          </p>
          {showBranch && entry.branch_name && (
            <p className="text-xs text-gray-500 truncate">{entry.branch_name}</p>
          )}
        </div>
      </div>
      <Badge variant={entry.points >= 0 ? 'secondary' : 'destructive'}>{entry.points}</Badge>
    </div>
  );
}
