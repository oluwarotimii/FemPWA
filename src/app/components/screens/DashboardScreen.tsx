import { useState, useEffect } from 'react';
import { Clock, Calendar, Briefcase, TrendingUp } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { attendanceApi } from '@/app/services/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function DashboardScreen() {
  const { user } = useAuth();
  const [isClocked, setIsClocked] = useState(false); // Default to not clocked in
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    // Fetch attendance records on mount
    const fetchAttendance = async () => {
      try {
        const response = await attendanceApi.getAttendance({ limit: 5 });
        setAttendanceRecords(response.data.attendance);
      } catch (error) {
        console.error('Failed to fetch attendance records:', error);
        // Fallback to mock data if API fails
        setAttendanceRecords([
          {
            id: '1',
            date: new Date().toISOString().split('T')[0],
            clock_in: '09:00',
            clock_out: null,
            status: 'present',
            hours_worked: 0
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();

    return () => clearInterval(timer);
  }, []);

  // Check if user is currently clocked in based on last attendance record
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      const lastRecord = attendanceRecords[0];
      setIsClocked(lastRecord.clock_out === null);
    }
  }, [attendanceRecords]);

  const handleClockAction = async () => {
    try {
      const status = isClocked ? 'clock_out' : 'clock_in';
      const response = await attendanceApi.markAttendance({ status });

      toast.success(response.message, {
        description: isClocked
          ? `Successfully clocked out at ${new Date().toLocaleTimeString()}`
          : `Welcome back, ${user?.full_name}!`
      });

      // Refresh attendance records after clock action
      const updatedResponse = await attendanceApi.getAttendance({ limit: 5 });
      setAttendanceRecords(updatedResponse.data.attendance);

      // Toggle clock status
      setIsClocked(!isClocked);
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

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.full_name}
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
          <img src={user?.avatar} alt={user?.full_name} className="w-full h-full rounded-full" />
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

            <div className="flex items-center justify-center gap-2">
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
            </div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleClockAction}
                size="lg"
                className={`w-full h-16 text-lg font-semibold rounded-2xl ${
                  isClocked
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                disabled={loading}
              >
                {loading ? 'Processing...' : (isClocked ? 'Clock Out' : 'Clock In')}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Summary */}
      <div className="grid grid-cols-3 gap-3">
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
      </div>

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
                      {record.clock_in} - {record.clock_out || 'In Progress'}
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
