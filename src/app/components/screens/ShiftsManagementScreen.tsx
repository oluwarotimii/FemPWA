import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Coffee, Sun, Moon, CalendarDays, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { shiftApi, type EmployeeShiftAssignment, type ShiftException } from '@/app/services/api';

export function ShiftsManagementScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-schedule' | 'upcoming' | 'exceptions'>('my-schedule');
  const [myAssignments, setMyAssignments] = useState<EmployeeShiftAssignment[]>([]);
  const [myExceptions, setMyExceptions] = useState<ShiftException[]>([]);
  const [upcomingShifts, setUpcomingShifts] = useState<Array<{
    date: string;
    startTime: string;
    endTime: string;
    breakDurationMinutes: number;
    shiftType?: string;
    templateName: string;
    isException?: boolean;
    exceptionType?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[ShiftsScreen] Fetching data for tab:', activeTab);
      
      // Fetch my assignments
      const myAssignmentsResponse = await shiftApi.getMyShiftAssignments();
      setMyAssignments(myAssignmentsResponse.data.shiftAssignments);
      setStats(prev => ({ ...prev, total: myAssignmentsResponse.data.shiftAssignments.length }));

      // Fetch my exceptions
      const exceptionsResponse = await shiftApi.getMyShiftExceptions();
      setMyExceptions(exceptionsResponse.data.exceptions);

      // Fetch upcoming shifts if on that tab
      if (activeTab === 'upcoming') {
        try {
          const upcomingResponse = await shiftApi.getMyUpcomingShifts({ days: 30 });
          setUpcomingShifts(upcomingResponse.data.shifts || []);
          console.log('[ShiftsScreen] Upcoming shifts loaded:', upcomingResponse.data.shifts?.length);
        } catch (error) {
          console.error('[ShiftsScreen] Error fetching upcoming shifts:', error);
          toast.error('Failed to load upcoming shifts');
        }
      }
    } catch (error) {
      console.error('[ShiftsScreen] Error fetching shifts:', error);
      toast.error('Failed to load your shifts');
    } finally {
      setLoading(false);
    }
  };

  const getShiftTypeIcon = (startTime?: string | null) => {
    if (!startTime) return Clock;
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 5 && hour < 12) return Sun;
    if (hour >= 12 && hour < 17) return Clock;
    if (hour >= 17 || hour < 5) return Moon;
    return Clock;
  };

  const getShiftTypeLabel = (startTime?: string | null) => {
    if (!startTime) return 'Custom';
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 || hour < 5) return 'Night';
    return 'Custom';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  const renderMyScheduleTab = () => (
    <div className="space-y-4 pb-20">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Your Shift Assignments</p>
              <p className="text-xs text-blue-700 mt-1">View your assigned shifts and working hours.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-600">Total Shifts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{myAssignments.filter(a => a.status === 'active').length}</p>
            <p className="text-xs text-gray-600">Active</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card><CardContent className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2B3C] mx-auto" /><p className="text-sm text-gray-600 mt-2">Loading...</p></CardContent></Card>
      ) : myAssignments.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-sm font-medium text-gray-900 mb-1">No shift assignments yet</p><p className="text-xs text-gray-600">Your manager will assign shifts soon</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {myAssignments.map((assignment) => {
            const ShiftIcon = getShiftTypeIcon(assignment.shift_template?.start_time);
            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <ShiftIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{assignment.shift_template?.name || 'Custom Shift'}</p>
                        <p className="text-xs text-gray-600">{getShiftTypeLabel(assignment.shift_template?.start_time)}</p>
                      </div>
                    </div>
                    <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>{assignment.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{formatTime(assignment.shift_template?.start_time)} - {formatTime(assignment.shift_template?.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Coffee className="w-4 h-4 text-gray-400" />
                      <span>{assignment.shift_template?.break_duration_minutes || 0} min break</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      <span>From {formatDate(assignment.effective_from)}</span>
                      {assignment.effective_to ? <span> to {formatDate(assignment.effective_to)}</span> : <Badge variant="outline" className="text-xs">Ongoing</Badge>}
                    </div>
                    {assignment.recurrence_pattern && assignment.recurrence_pattern !== 'none' && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{assignment.recurrence_pattern}</span>
                        {assignment.recurrence_days && (
                          <div className="flex gap-1">
                            {JSON.parse(assignment.recurrence_days).slice(0, 3).map((day: string) => (
                              <span key={day} className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">{day.substring(0, 3)}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderUpcomingTab = () => (
    <div className="space-y-4 pb-20">
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <CalendarDays className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Upcoming Shifts</p>
              <p className="text-xs text-amber-700 mt-1">Your schedule for the next 30 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2B3C] mx-auto" />
            <p className="text-sm text-gray-600 mt-2">Loading your schedule...</p>
          </CardContent>
        </Card>
      ) : upcomingShifts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">No upcoming shifts</p>
            <p className="text-xs text-gray-600">You don't have any shifts scheduled for the next 30 days</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcomingShifts.map((shift, index) => {
            const ShiftIcon = getShiftTypeIcon(shift.startTime);
            const isToday = new Date(shift.date).toDateString() === new Date().toDateString();
            const isTomorrow = new Date(shift.date).toDateString() === new Date(Date.now() + 86400000).toDateString();
            
            return (
              <Card key={`${shift.date}-${shift.templateName}-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <ShiftIcon className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{shift.templateName}</p>
                        <p className="text-xs text-gray-600">
                          {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {shift.isException && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        Exception
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </span>
                    </div>
                    {shift.breakDurationMinutes > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Coffee className="w-4 h-4 text-gray-400" />
                        <span>{shift.breakDurationMinutes} min break</span>
                      </div>
                    )}
                    {shift.exceptionType && (
                      <div className="flex items-center gap-2 text-xs text-amber-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="capitalize">{shift.exceptionType.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderExceptionsTab = () => (
    <div className="space-y-4 pb-20">
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-900">Shift Exceptions</p>
              <p className="text-xs text-purple-700 mt-1">Special schedule changes or extra shifts assigned to you.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2B3C] mx-auto" /><p className="text-sm text-gray-600 mt-2">Loading...</p></CardContent></Card>
      ) : myExceptions.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-sm font-medium text-gray-900 mb-1">No exceptions found</p><p className="text-xs text-gray-600">You don't have any special shift exceptions assigned.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {myExceptions.map((exception) => (
            <Card key={exception.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(exception.exception_date)}</p>
                      <p className="text-xs text-gray-600 capitalize">{(exception.exception_type || 'other').replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <Badge variant={exception.status === 'active' || exception.status === 'approved' ? 'default' : 'secondary'}>
                    {exception.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{formatTime(exception.new_start_time)} - {formatTime(exception.new_end_time)}</span>
                  </div>
                  {exception.reason && (
                    <div className="text-xs text-gray-600 italic mt-1">
                      Reason: {exception.reason}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">My Shifts</h1>
          <p className="text-xs text-gray-600 mt-0.5">View and manage your shift schedule</p>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-schedule">Shifts</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          </TabsList>
          <TabsContent value="my-schedule">{renderMyScheduleTab()}</TabsContent>
          <TabsContent value="upcoming">{renderUpcomingTab()}</TabsContent>
          <TabsContent value="exceptions">{renderExceptionsTab()}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
