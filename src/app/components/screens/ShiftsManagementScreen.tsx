import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Coffee, Sun, Moon, CalendarDays, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { shiftApi, type EmployeeShiftAssignment, type ShiftException } from '@/app/services/api';

export function ShiftsManagementScreen() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-schedule' | 'upcoming' | 'team'>('my-schedule');
  const [myAssignments, setMyAssignments] = useState<EmployeeShiftAssignment[]>([]);
  const [myExceptions, setMyExceptions] = useState<ShiftException[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [teamShifts, setTeamShifts] = useState<any>({});

  const canViewTeam = hasPermission('employee_shift_assignment:read');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const myAssignmentsResponse = await shiftApi.getMyShiftAssignments();
      setMyAssignments(myAssignmentsResponse.data.shiftAssignments);
      setStats(prev => ({ ...prev, total: myAssignmentsResponse.data.shiftAssignments.length }));

      const exceptionsResponse = await shiftApi.getMyShiftExceptions();
      setMyExceptions(exceptionsResponse.data.exceptions);

      if (activeTab === 'team' && canViewTeam) {
        try {
          const teamResponse = await shiftApi.getTeamShifts();
          setTeamShifts(teamResponse.data.shiftsByDepartment || {});
        } catch (error) {
          console.log('Could not fetch team shifts');
        }
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
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
      <Card><CardContent className="p-8 text-center"><Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-sm font-medium text-gray-900 mb-1">Coming Soon</p><p className="text-xs text-gray-600">30-day calendar view in development</p></CardContent></Card>
    </div>
  );

  const renderTeamTab = () => (
    <div className="space-y-4 pb-20">
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Users className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-900">Team Shifts</p>
              <p className="text-xs text-purple-700 mt-1">View your team's shift assignments</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {!canViewTeam ? (
        <Card><CardContent className="p-8 text-center"><AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-sm font-medium text-gray-900 mb-1">Access Restricted</p><p className="text-xs text-gray-600">You don't have permission to view team shifts</p></CardContent></Card>
      ) : Object.keys(teamShifts).length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Users className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-sm font-medium text-gray-900 mb-1">No team shifts found</p><p className="text-xs text-gray-600">Your team hasn't been assigned shifts yet</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(teamShifts).map(([department, shifts]: [string, any]) => (
            <Card key={department}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-900">{department || 'Unassigned'}</p>
                  <Badge variant="outline" className="text-xs">{shifts.length} members</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {shifts.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                        {member.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                        <p className="text-xs text-gray-600">{formatTime(member.startTime)} - {formatTime(member.endTime)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{member.status}</Badge>
                  </div>
                ))}
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
            <TabsTrigger value="my-schedule">My Schedule</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="my-schedule">{renderMyScheduleTab()}</TabsContent>
          <TabsContent value="upcoming">{renderUpcomingTab()}</TabsContent>
          <TabsContent value="team">{renderTeamTab()}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
