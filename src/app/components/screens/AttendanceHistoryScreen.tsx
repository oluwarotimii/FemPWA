import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { attendanceRecords } from '@/app/services/mockData';

export function AttendanceHistoryScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

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
            <div className="text-2xl font-bold text-[#1A2B3C]">20</div>
            <div className="text-xs text-gray-500 mt-1">Days Present</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">18</div>
            <div className="text-xs text-gray-500 mt-1">On Time</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">2</div>
            <div className="text-xs text-gray-500 mt-1">Late Arrivals</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <div className="space-y-3">
        {attendanceRecords.map((record) => (
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
                  variant={record.status === 'on-time' ? 'default' : 'destructive'}
                  className={`${
                    record.status === 'on-time'
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }`}
                >
                  {record.status === 'on-time' ? 'On Time' : 'Late Arrival'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Clock In</div>
                  <div className="font-semibold text-gray-900">{record.clockIn}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Clock Out</div>
                  <div className="font-semibold text-gray-900">
                    {record.clockOut || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Total Hours</div>
                  <Badge className="bg-[#1A2B3C] hover:bg-[#2C3E50]">
                    {record.totalHours ? `${record.totalHours}h` : '-'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
