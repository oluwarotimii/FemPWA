import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { attendanceApi } from '@/app/services/api';

export function AttendanceHistoryScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        // Get attendance records for the current month
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

        // Use the attendance/my endpoint with date range
        const response = await attendanceApi.getMyAttendance({
          startDate,
          endDate,
          limit: 100 // Get all records for the month
        });

        setAttendanceRecords(response.data.attendance);
      } catch (error) {
        console.error('Failed to fetch attendance records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Calculate summary statistics
  const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
  const lateDays = attendanceRecords.filter(record => record.status === 'late').length;
  const onTimeDays = presentDays - lateDays;
  const lateArrivals = lateDays;

  if (loading) {
    return (
      <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12 text-gray-500">Loading attendance records...</div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-500 text-sm">View your clock-in records</p>
      </div>

      {/* Month Picker */}
      <Card className="shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1A2B3C]" />
              <span className="font-semibold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#1A2B3C]">{presentDays}</div>
            <div className="text-xs text-gray-500 mt-1">Days Present</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{onTimeDays}</div>
            <div className="text-xs text-gray-500 mt-1">On Time</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{lateArrivals}</div>
            <div className="text-xs text-gray-500 mt-1">Late Arrivals</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <div className="space-y-3">
        {attendanceRecords.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No attendance records</p>
              <p className="text-sm text-gray-400 mt-1">
                Your attendance records will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          attendanceRecords.map((record) => (
            <Card key={record.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <Badge
                    className={`${
                      record.status === 'present'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : record.status === 'late'
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                        : record.status === 'absent'
                        ? 'bg-red-100 text-red-700 hover:bg-red-100'
                        : record.status === 'leave'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : record.status === 'half_day'
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                        : record.status === 'holiday'
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    {record.status === 'present' ? 'Present' 
                      : record.status === 'late' ? 'Late'
                      : record.status === 'absent' ? 'Absent'
                      : record.status === 'leave' ? 'On Leave'
                      : record.status === 'half_day' ? 'Half Day'
                      : record.status === 'holiday' ? 'Holiday'
                      : record.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Clock In</div>
                    <div className="font-semibold text-gray-900">
                      {record.check_in_time ? new Date(`1970-01-01T${record.check_in_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Clock Out</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-1">
                      {record.check_out_time ? new Date(`1970-01-01T${record.check_out_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                      {record.is_auto_checkout && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">Auto</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Total Hours</div>
                    <Badge className="bg-[#1A2B3C] hover:bg-[#2C3E50]">
                      {record.hours_worked ? `${record.hours_worked}h` : '-'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
