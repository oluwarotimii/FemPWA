import { useState, useEffect } from 'react';
import { Clock, Calendar, Briefcase, TrendingUp, Timer, UserCheck } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { attendanceApi } from '@/app/services/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useAutoCheckout } from '@/app/hooks/useAutoCheckout';

export function DashboardScreen() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track today's attendance status
  const [todayRecord, setTodayRecord] = useState<any | null>(null);

  // Derived states
  const hasCheckedInToday = todayRecord?.check_in_time !== null && todayRecord?.check_in_time !== undefined;
  const hasCheckedOutToday = todayRecord?.check_out_time !== null && todayRecord?.check_out_time !== undefined;
  const isClocked = hasCheckedInToday && !hasCheckedOutToday;

  // Auto-checkout hook - automatically checks out user at 6:30 PM
  const {
    nextAutoCheckoutTime,
  } = useAutoCheckout({
    isEnabled: isClocked,
    onCheckoutComplete: () => {
      refreshAttendance();
    },
  });

  // Refresh attendance records
  const refreshAttendance = async () => {
    try {
      // Get today's date in local timezone
      const today = new Date().toLocaleDateString('en-CA', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }); // Returns YYYY-MM-DD in local timezone
      
      // Fetch records for the entire month to find today's record
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
      
      console.log('=== Refreshing Attendance ===');
      console.log('Today (local):', today);
      console.log('Date range:', startDate, 'to', endDate);
      
      const response = await attendanceApi.getMyAttendance({ 
        startDate,
        endDate,
        limit: 100 
      });
      const records = response.data?.attendance || [];
      setAttendanceRecords(records);
      
      console.log('Total records fetched:', records.length);
      console.log('All record dates:', records.map((r: any) => ({
        id: r.id,
        date: r.date,
        dateOnly: r.date.split('T')[0],
        localDate: new Date(r.date).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        check_in_time: r.check_in_time,
        check_out_time: r.check_out_time,
        status: r.status
      })));
      
      // Find today's record - convert API date to local timezone
      const todaysRecord = records.find((r: any) => {
        // Convert API UTC date to local date
        const localRecordDate = new Date(r.date).toLocaleDateString('en-CA', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        });
        const matches = localRecordDate === today;
        if (matches) {
          console.log('✓ Found today\'s record:', r);
        }
        return matches;
      });
      
      if (!todaysRecord) {
        console.log('✗ No record found for today');
      }
      console.log('Today\'s record:', todaysRecord);
      console.log('check_in_time:', todaysRecord?.check_in_time);
      console.log('check_out_time:', todaysRecord?.check_out_time);
      console.log('hasCheckedInToday:', todaysRecord?.check_in_time !== null && todaysRecord?.check_in_time !== undefined);
      console.log('hasCheckedOutToday:', todaysRecord?.check_out_time !== null && todaysRecord?.check_out_time !== undefined);
      
      setTodayRecord(todaysRecord || null);
    } catch (error: any) {
      console.error('Failed to fetch attendance records:', error);
      setAttendanceRecords([]);
      setTodayRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Update time every minute and fetch attendance on mount
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    refreshAttendance();

    return () => clearInterval(timer);
  }, []);

  const handleClockAction = async () => {
    try {
      if (isClocked) {
        // Check out
        const checkOutData = {
          date: new Date().toISOString().split('T')[0],
          check_out_time: new Date().toTimeString().substring(0, 8),
          location: 'Office'
        };
        const response = await attendanceApi.checkOut(checkOutData);

        toast.success(response?.message || 'Successfully clocked out', {
          description: `Successfully clocked out at ${new Date().toLocaleTimeString()}`
        });
      } else {
        // Check in
        const checkInData = {
          date: new Date().toISOString().split('T')[0],
          check_in_time: new Date().toTimeString().substring(0, 8),
          location: 'Office',
          status: 'present'
        };
        const response = await attendanceApi.checkIn(checkInData);

        toast.success(response?.message || 'Successfully clocked in', {
          description: `Welcome back, ${user?.fullName}!`
        });

        // Immediately set today's record to prevent double check-in
        setTodayRecord({
          check_in_time: new Date().toTimeString().substring(0, 8),
          check_out_time: null,
        });
        return; // Don't refresh, we already updated state
      }

      // Refresh attendance records after clock out
      await refreshAttendance();
    } catch (error: any) {
      toast.error('Failed to update attendance', {
        description: error.response?.data?.message || 'Please try again'
      });
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format the next auto-checkout time for display
  const formatAutoCheckoutTime = () => {
    if (!nextAutoCheckoutTime) return '';
    return nextAutoCheckoutTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.fullName}
          </h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <img src={user?.avatar} alt={user?.fullName} className="w-full h-full rounded-full" />
        </div>
      </div>

      {/* Punch Card */}
      <Card className="bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50] border-none shadow-xl">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
              <Clock className="w-4 h-4" />
              <span>Current Time & Date</span>
            </div>

            <div className="text-white">
              <div className="text-4xl font-bold mb-1">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="text-white/70 text-sm">
                {currentTime.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge
                variant={isClocked ? 'default' : 'secondary'}
                className={`${
                  isClocked
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                {isClocked ? '● On Shift' : '○ Off Duty'}
              </Badge>

              {/* Auto-checkout status indicator */}
              {isClocked && (
                <Badge
                  variant="outline"
                  className="bg-purple-500/20 border-purple-400 text-purple-100"
                >
                  <Timer className="w-3 h-3 mr-1" />
                  Auto-checkout at {formatAutoCheckoutTime()}
                </Badge>
              )}
            </div>

            {/* Info messages */}
            {isClocked && (
              <div className="text-xs text-white/60 flex items-center gap-1 justify-center">
                <Timer className="w-3 h-3" />
                <span>Auto-checkout at 6:30 PM - No manual checkout needed</span>
              </div>
            )}

            {hasCheckedOutToday && (
              <div className="text-xs text-white/60 flex items-center gap-1 justify-center">
                <UserCheck className="w-3 h-3" />
                <span>Checked out for the day</span>
              </div>
            )}

            {/* Clock In/Out Button */}
            <motion.div whileTap={hasCheckedInToday ? {} : { scale: 0.95 }}>
              <Button
                size="lg"
                className={`w-full h-16 text-lg font-semibold rounded-2xl ${
                  hasCheckedInToday
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isClocked
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                disabled={loading || hasCheckedInToday}
                onClick={hasCheckedInToday ? undefined : handleClockAction}
              >
                {loading
                  ? 'Processing...'
                  : hasCheckedInToday
                  ? hasCheckedOutToday
                    ? '✓ Checked Out'
                    : '✓ Checked In'
                  : isClocked
                  ? 'Clock Out'
                  : 'Clock In'}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Summary */}
      {/* <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#1A2B3C]">
              {attendanceRecords.length > 0 && attendanceRecords[0].hours_worked !== undefined
                ? `${attendanceRecords[0].hours_worked}h`
                : '-'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Hours Today</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#1A2B3C]">42h</div>
            <div className="text-xs text-gray-500 mt-1">This Week</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">Feb 10</div>
            <div className="text-xs text-gray-500 mt-1">Next Holiday</div>
          </CardContent>
        </Card>
      </div> */}

      {/* Recent Log */}
      <Card className="shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <Briefcase className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading attendance records...</div>
            ) : attendanceRecords.length > 0 ? (
              attendanceRecords.slice(0, 3).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {record.check_in_time} - {record.check_out_time || 'In Progress'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {record.hours_worked ? `${record.hours_worked}h` : '-'}
                    </div>
                    <Badge
                      variant={record.status === 'present' ? 'default' : 'destructive'}
                      className={`text-xs ${
                        record.status === 'present'
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {record.status === 'present' ? 'Present' : record.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">No attendance records found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
