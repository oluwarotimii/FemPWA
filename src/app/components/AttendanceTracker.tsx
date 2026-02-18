import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, UserCheck, AlertCircle, LogOut, Timer } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/app/components/ui/sheet";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isWeekend, parseISO } from "date-fns";
import { attendanceApi } from "@/app/services/api";

// Live attendance data with various statuses
interface AttendanceRecord {
  date: string; // ISO date string
  clockIn?: string; // Time string like "09:15"
  clockOut?: string; // Time string like "17:05"
  status: "present" | "late" | "absent" | "early-departure" | "holiday" | "weekend";
  lateBy?: number; // minutes late
  leftEarly?: number; // minutes left early
  isHoliday?: boolean;
  holidayName?: string;
  is_auto_checkout?: boolean; // Flag to indicate automatic checkout
}

// Office configuration
const OFFICE_START = "09:00";
const OFFICE_END = "17:00";
const GRACE_PERIOD_MINUTES = 0; // No grace period, exactly 9:00 AM

// Status color mapping
const statusColors = {
  present: "bg-green-500/20 border-green-500",
  late: "bg-amber-500/20 border-amber-500",
  absent: "bg-red-500/20 border-red-500",
  "early-departure": "bg-blue-500/20 border-blue-500",
  holiday: "bg-purple-500/20 border-purple-500",
  weekend: "bg-gray-300/20 border-gray-300",
};

const statusLabels = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  "early-departure": "Early Departure",
  holiday: "Holiday",
  weekend: "Weekend",
};

interface DayTileProps {
  day: Date;
  record?: AttendanceRecord;
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
  const colorClass = statusColors[status];

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
      </div>
    </button>
  );
}

interface StatsBarProps {
  records: AttendanceRecord[];
}

function StatsBar({ records }: StatsBarProps) {
  const stats = {
    present: records.filter((r) => r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    absent: records.filter((r) => r.status === "absent").length,
    earlyDeparture: records.filter((r) => r.status === "early-departure").length,
  };

  const workingDays = records.filter(
    (r) => r.status !== "weekend" && r.status !== "holiday"
  ).length;

  const attendanceRate = workingDays > 0
    ? Math.round(((stats.present + stats.late + stats.earlyDeparture) / workingDays) * 100)
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

      <Card className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center gap-1.5">
          <LogOut className="w-4 h-4 text-blue-600" />
          <div>
            <div className="text-lg font-bold text-blue-900">{stats.earlyDeparture}</div>
            <div className="text-[10px] text-blue-700">Early Leave</div>
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

export default function AttendanceTracker() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDay, setSelectedDay] = useState<{ date: Date; record?: AttendanceRecord } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch attendance records for current month
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Format dates for API request
        const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

        // Fetch attendance records from API
        const response = await attendanceApi.getMyAttendance({
          startDate,
          endDate
        });

        // Convert API response to our local format
        const records = response.data.attendance.map(apiRecord => ({
          date: apiRecord.date,
          clockIn: apiRecord.check_in_time,
          clockOut: apiRecord.check_out_time || undefined,
          status: apiRecord.status as "present" | "late" | "absent" | "early-departure" | "holiday" | "weekend" | "leave" | "half_day",
          is_auto_checkout: (apiRecord as any).is_auto_checkout,
          // Calculate lateBy and leftEarly based on the times if needed
        }));

        setAttendanceRecords(records);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data. Please try again later.');
        // Set empty array to avoid undefined errors
        setAttendanceRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [currentDate]);

  const recordMap = new Map(attendanceRecords.map((r) => [r.date, r]));

  // Get days to display in calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDay = getDay(monthStart); // 0 = Sunday
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create calendar grid with empty cells for days before month starts
  const calendarDays: (Date | null)[] = [
    ...Array(startDay).fill(null),
    ...daysInMonth,
  ];

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const record = recordMap.get(dateStr);
    setSelectedDay({ date: day, record });
  };

  const closeSheet = () => {
    setSelectedDay(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B3C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Attendance Tracker
          </h1>
          <p className="text-sm text-gray-600">
            Track your work attendance with visual clarity
          </p>
          
          {/* Auto-checkout info banner */}
          <Card className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-purple-600" />
              <div className="text-sm text-purple-900">
                <span className="font-semibold">Auto-checkout enabled:</span> You will be automatically checked out at 6:30 PM on weekdays
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Bar */}
        <StatsBar records={attendanceRecords} />

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
                {format(currentDate, "MMMM yyyy")}
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
                const record = recordMap.get(dateStr);
                const isToday = isSameDay(day, today);

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
                        ? statusColors[selectedDay.record.status].replace("/20", "")
                        : "bg-gray-200"
                    } text-gray-900 px-4 py-2 text-base`}
                  >
                    {selectedDay.record
                      ? statusLabels[selectedDay.record.status]
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
                            {/* Auto-checkout indicator */}
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
                  selectedDay.record?.status !== "holiday" && (
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
    </div>
  );
}