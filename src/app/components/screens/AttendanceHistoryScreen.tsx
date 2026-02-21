import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, UserCheck, AlertCircle, LogOut, Timer } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { attendanceApi } from '@/app/services/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/app/components/ui/sheet";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO } from "date-fns";

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  location_coordinates?: { x: number; y: number } | null;
  location_verified?: number;
  location_address?: string | null;
  hours_worked?: number;
  is_auto_checkout?: boolean;
}

interface CalendarDayRecord {
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: "present" | "late" | "absent" | "early-departure" | "holiday" | "weekend" | "leave" | "half_day" | "future";
  lateBy?: number;
  leftEarly?: number;
  isHoliday?: boolean;
  holidayName?: string;
  is_auto_checkout?: boolean;
}

const OFFICE_START = "09:00";
const OFFICE_END = "17:00";

const statusColors = {
  present: "bg-green-500/20 border-green-500",
  late: "bg-amber-500/20 border-amber-500",
  absent: "bg-red-500/20 border-red-500",
  "early-departure": "bg-blue-500/20 border-blue-500",
  holiday: "bg-purple-500/20 border-purple-500",
  weekend: "bg-gray-300/20 border-gray-300",
  leave: "bg-cyan-500/20 border-cyan-500",
  half_day: "bg-orange-500/20 border-orange-500",
  future: "bg-gray-100/20 border-gray-200",
};

const statusLabels = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  "early-departure": "Early Departure",
  holiday: "Holiday",
  weekend: "Weekend",
  leave: "On Leave",
  half_day: "Half Day",
  future: "",
};

interface DayTileProps {
  day: Date;
  record?: CalendarDayRecord;
  isToday: boolean;
  onClick: () => void;
}

function DayTile({ day, record, isToday, onClick }: DayTileProps) {
  const dayNumber = format(day, "d");
  const isCurrentMonth = record !== undefined;

  if (!isCurrentMonth) {
    return (
      <div className="aspect-square p-1 border border-transparent">
        <div className="text-xs text-gray-400">{dayNumber}</div>
      </div>
    );
  }

  const status = record.status;
  const colorClass = statusColors[status as keyof typeof statusColors] || statusColors.weekend;

  return (
    <button
      onClick={onClick}
      className={`aspect-square p-1 border rounded transition-all hover:scale-105 hover:shadow-sm relative ${colorClass} ${
        isToday ? "ring-1 ring-offset-1 ring-blue-600" : ""
      }`}
    >
      <div className="flex flex-col h-full justify-between">
        <div className="text-xs font-semibold text-gray-900">{dayNumber}</div>
        {record.clockIn && (
          <div className="text-[8px] text-gray-700 font-medium">
            {record.clockIn}
          </div>
        )}
        {record.isHoliday && (
          <div className="text-[7px] text-purple-700 font-semibold">Holiday</div>
        )}
        {isToday && (
          <div className="absolute top-0.5 right-0.5">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
          </div>
        )}
        {record.is_auto_checkout && (
          <div className="absolute bottom-0.5 right-0.5">
            <Timer className="w-2 h-2 text-purple-600" />
          </div>
        )}
      </div>
    </button>
  );
}

interface StatsBarProps {
  records: CalendarDayRecord[];
}

function StatsBar({ records }: StatsBarProps) {
  const stats = {
    present: records.filter((r) => r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    absent: records.filter((r) => r.status === "absent").length,
    earlyDeparture: records.filter((r) => r.status === "early-departure").length,
    leave: records.filter((r) => r.status === "leave").length,
    halfDay: records.filter((r) => r.status === "half_day").length,
  };

  const workingDays = records.filter(
    (r) => r.status !== "weekend" && r.status !== "holiday"
  ).length;

  const attendanceRate = workingDays > 0
    ? Math.round(((stats.present + stats.late + stats.earlyDeparture + stats.halfDay) / workingDays) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
      <Card className="p-2 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-green-600" />
          <div>
            <div className="text-lg font-bold text-green-900">{stats.present}</div>
            <div className="text-[10px] text-green-700">Present</div>
          </div>
        </div>
      </Card>

      <Card className="p-2 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-600" />
          <div>
            <div className="text-lg font-bold text-amber-900">{stats.late}</div>
            <div className="text-[10px] text-amber-700">Late Days</div>
          </div>
        </div>
      </Card>

      <Card className="p-2 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <div>
            <div className="text-lg font-bold text-red-900">{stats.absent}</div>
            <div className="text-[10px] text-red-700">Absent</div>
          </div>
        </div>
      </Card>

      <Card className="p-2 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
        <div className="flex items-center gap-1.5">
          <LogOut className="w-4 h-4 text-cyan-600" />
          <div>
            <div className="text-lg font-bold text-cyan-900">{stats.leave + stats.halfDay}</div>
            <div className="text-[10px] text-cyan-700">Leave/Half-Day</div>
          </div>
        </div>
      </Card>

      <Card className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 text-purple-600 font-bold text-base">%</div>
          <div>
            <div className="text-lg font-bold text-purple-900">{attendanceRate}%</div>
            <div className="text-[10px] text-purple-700">Attendance</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function AttendanceHistoryScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [calendarRecords, setCalendarRecords] = useState<CalendarDayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<{ date: Date; record?: CalendarDayRecord } | null>(null);

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
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

        const response = await attendanceApi.getMyAttendance({
          startDate,
          endDate,
          limit: 100
        });

        const apiRecords = response.data.attendance;
        setAttendanceRecords(apiRecords);

        // Convert API records to calendar format with timezone handling
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Create a map using local dates
        const recordMap = new Map(
          apiRecords.map((r: AttendanceRecord) => {
            // Convert UTC date to local date
            const localDate = new Date(r.date).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            return [localDate, r];
          })
        );

        const calendarData: CalendarDayRecord[] = daysInMonth.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const localDateStr = day.toLocaleDateString('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          const dayOfWeek = getDay(day);
          const apiRecord = recordMap.get(localDateStr);

          if (apiRecord) {
            return {
              date: dateStr,
              clockIn: apiRecord.check_in_time || undefined,
              clockOut: apiRecord.check_out_time || undefined,
              status: apiRecord.status as CalendarDayRecord["status"],
              is_auto_checkout: apiRecord.is_auto_checkout,
            };
          }

          // No record - check if weekend
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            return {
              date: dateStr,
              status: "weekend",
            };
          }

          // Check if this is a future date
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (day > today) {
            // Future date - don't mark as absent
            return {
              date: dateStr,
              status: "future", // Light gray for future dates
            };
          }

          // Past working day with no record - mark as absent
          return {
            date: dateStr,
            status: "absent",
          };
        });

        setCalendarRecords(calendarData);
      } catch (error) {
        console.error('Failed to fetch attendance records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const calendarRecordMap = new Map(calendarRecords.map((r) => [r.date, r]));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDay = getDay(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const calendarDays: (Date | null)[] = [
    ...Array(startDay).fill(null),
    ...daysInMonth,
  ];

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const record = calendarRecordMap.get(dateStr);
    setSelectedDay({ date: day, record });
  };

  const closeSheet = () => {
    setSelectedDay(null);
  };

  // Calculate summary statistics for list view
  const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
  const lateDays = attendanceRecords.filter(record => record.status === 'late').length;
  const onTimeDays = presentDays - lateDays;
  const lateArrivals = lateDays;

  if (loading) {
    return (
      <div className="p-4 pb-20 max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12 text-gray-500">Loading attendance records...</div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto space-y-6">
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

      {/* Stats Bar */}
      <StatsBar records={calendarRecords} />

      {/* Calendar Card */}
      <Card className="p-3 md:p-4 shadow-lg">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="hover:bg-blue-50 h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="hover:bg-blue-50 h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-3 justify-center">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1">
              <div
                className={`w-3 h-3 rounded border ${
                  statusColors[status as keyof typeof statusColors]
                }`}
              />
              <span className="text-[10px] text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="mb-2">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-semibold text-gray-600 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = format(day, "yyyy-MM-dd");
              const record = calendarRecordMap.get(dateStr);
              const isToday = isSameDay(day, new Date());

              return (
                <DayTile
                  key={dateStr}
                  day={day}
                  record={record}
                  isToday={isToday}
                  onClick={() => handleDayClick(day)}
                />
              );
            })}
          </div>
        </div>
      </Card>

      {/* Attendance List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-lg">Detailed Records</h3>
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
                  {/* <div>
                    <div className="text-gray-500 text-xs mb-1">Clock In</div>
                    <div className="font-semibold text-gray-900">
                      {record.check_in_time ? new Date(`1970-01-01T${record.check_in_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </div>
                  </div> */}
                  <div>
                    {/* <div className="text-gray-500 text-xs mb-1">Clock Out</div> */}
                    {/* <div className="font-semibold text-gray-900 flex items-center gap-1">
                      {record.check_out_time ? new Date(`1970-01-01T${record.check_out_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                      {record.is_auto_checkout && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">Auto</span>
                      )}
                    </div> */}

                    <div>
                    <div className="text-gray-500 text-xs mb-1">Clock In</div>
                    <div className="font-semibold text-gray-900">
                      {record.check_in_time ? new Date(`1970-01-01T${record.check_in_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </div>
                  </div>
                  </div>
                  {/* <div>
                    <div className="text-gray-500 text-xs mb-1">Total Hours</div>
                    <Badge className="bg-[#1A2B3C] hover:bg-[#2C3E50]">
                      {record.hours_worked ? `${record.hours_worked}h` : '-'}
                    </Badge>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Day Detail Sheet */}
      <Sheet open={selectedDay !== null} onOpenChange={closeSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedDay && format(selectedDay.date, "EEEE, MMMM d, yyyy")}
            </SheetTitle>
            <SheetDescription>
              Attendance details for this day
            </SheetDescription>
          </SheetHeader>

          {selectedDay && (
            <div className="mt-6 space-y-4">
              {/* Status Badge */}
              <div>
                <Badge
                  className={`${
                    selectedDay.record
                      ? statusColors[selectedDay.record.status as keyof typeof statusColors]?.replace("/20", "") || "bg-gray-200"
                      : "bg-gray-200"
                  } text-gray-900 px-4 py-2 text-base`}
                >
                  {selectedDay.record
                    ? statusLabels[selectedDay.record.status] || "No Data"
                    : "No Data"}
                </Badge>
              </div>

              {/* Holiday Information */}
              {selectedDay.record?.isHoliday && (
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-purple-900">
                        {selectedDay.record.holidayName}
                      </div>
                      <div className="text-sm text-purple-700 mt-1">
                        Office holiday - No attendance required
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Weekend Information */}
              {selectedDay.record?.status === "weekend" && (
                <Card className="p-4 bg-gray-50 border-gray-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">Weekend</div>
                      <div className="text-sm text-gray-700 mt-1">
                        Non-working day
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Clock In/Out Details */}
              {selectedDay.record?.clockIn && (
                <div className="space-y-3">
                  <Card className="p-4 border-green-200 bg-green-50">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <div className="text-sm text-green-700 font-medium">
                          Clock In
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          {selectedDay.record.clockIn}
                        </div>
                        {selectedDay.record.lateBy && selectedDay.record.lateBy > 0 && (
                          <div className="text-sm text-amber-700 mt-1 font-medium">
                            Late by {selectedDay.record.lateBy} minutes
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {selectedDay.record.clockOut && (
                    <Card className="p-4 border-blue-200 bg-blue-50">
                      <div className="flex items-center gap-3">
                        <LogOut className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="text-sm text-blue-700 font-medium">
                            Clock Out
                          </div>
                          <div className="text-2xl font-bold text-blue-900">
                            {selectedDay.record.clockOut}
                          </div>
                          {selectedDay.record.leftEarly && selectedDay.record.leftEarly > 0 && (
                            <div className="text-sm text-blue-700 mt-1 font-medium">
                              Left {selectedDay.record.leftEarly} minutes early
                            </div>
                          )}
                          {selectedDay.record.is_auto_checkout && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-purple-700 font-medium">
                              <Timer className="w-3 h-3" />
                              <span>Automatic checkout</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Absent Information */}
              {selectedDay.record?.status === "absent" && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-900">
                        No Clock-In Record
                      </div>
                      <div className="text-sm text-red-700 mt-1">
                        No attendance recorded for this working day
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Expected Schedule */}
              {selectedDay.record?.status !== "weekend" &&
                selectedDay.record?.status !== "holiday" &&
                selectedDay.record?.status !== "absent" && (
                  <Card className="p-4 bg-gray-50">
                    <div className="text-sm text-gray-700 font-medium mb-2">
                      Expected Schedule
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Start Time: {OFFICE_START}</div>
                      <div>End Time: {OFFICE_END}</div>
                    </div>
                  </Card>
                )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
