import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle, 
  Users, FileText, Settings, Coffee, Sun, Moon
} from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { shiftApi, type ShiftTemplate, type EmployeeShiftAssignment, type ScheduleRequest } from '@/app/services/api';

export function ShiftsManagementScreen() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-schedule' | 'request' | 'manage' | 'approvals'>('my-schedule');
  
  // Data states
  const [myAssignments, setMyAssignments] = useState<EmployeeShiftAssignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<EmployeeShiftAssignment[]>([]);
  const [scheduleRequests, setScheduleRequests] = useState<ScheduleRequest[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ScheduleRequest | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Request form states
  const [requestType, setRequestType] = useState<ScheduleRequest['request_type']>('time_off_request');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedStartTime, setRequestedStartTime] = useState('');
  const [requestedEndTime, setRequestedEndTime] = useState('');
  const [reason, setReason] = useState('');

  // Permission checks
  const canManageShifts = hasPermission('shift_template:create') || hasPermission('employee_shift_assignment:create');
  const canApproveRequests = hasPermission('schedule_request:approve') || hasPermission('schedule_request:reject');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Always fetch personal shift assignments
      try {
        const myAssignmentsResponse = await shiftApi.getMyShiftAssignments();
        setMyAssignments(myAssignmentsResponse.data.shiftAssignments);
      } catch (error) {
        console.log('Could not fetch personal shift assignments');
        setMyAssignments([]);
      }

      // Fetch all assignments if user can manage
      if (canManageShifts && activeTab === 'manage') {
        try {
          const allAssignmentsResponse = await shiftApi.getShiftAssignments({ status: 'active', limit: 50 });
          setAllAssignments(allAssignmentsResponse.data.shiftAssignments);
        } catch (error) {
          console.log('Could not fetch all assignments');
          setAllAssignments([]);
        }
      }

      // Fetch schedule requests based on tab
      if (activeTab === 'approvals' && canApproveRequests) {
        try {
          const requestsResponse = await shiftApi.getScheduleRequests({ status: 'pending', limit: 50 });
          setScheduleRequests(requestsResponse.data.scheduleRequests);
        } catch (error) {
          console.log('Could not fetch schedule requests');
          setScheduleRequests([]);
        }
      } else if (activeTab === 'request') {
        try {
          const myRequestsResponse = await shiftApi.getMyScheduleRequests({ limit: 20 });
          setScheduleRequests(myRequestsResponse.data.scheduleRequests);
        } catch (error) {
          console.log('Could not fetch personal requests');
          setScheduleRequests([]);
        }
      }

      // Fetch shift templates if managing
      if (activeTab === 'manage' && canManageShifts) {
        try {
          const templatesResponse = await shiftApi.getShiftTemplates({ isActive: true, limit: 50 });
          setShiftTemplates(templatesResponse.data.shiftTemplates);
        } catch (error) {
          console.log('Could not fetch shift templates');
          setShiftTemplates([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch shift data:', error);
      toast.error('Failed to load shift data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequestDialog = () => {
    setRequestType('time_off_request');
    setRequestedDate('');
    setRequestedStartTime('');
    setRequestedEndTime('');
    setReason('');
    setRequestDialogOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    if (requestType === 'time_off_request' && !requestedDate) {
      toast.error('Please select a date');
      return;
    }

    if (requestType === 'schedule_change' && !requestedStartTime) {
      toast.error('Please select a start time');
      return;
    }

    setProcessingAction(true);
    try {
      const requestData: any = {
        request_type: requestType,
        reason,
      };

      if (requestType === 'time_off_request') {
        requestData.requested_date = requestedDate;
        requestData.scheduled_for = requestedDate;
      } else if (requestType === 'schedule_change') {
        requestData.requested_start_time = requestedStartTime;
        requestData.requested_end_time = requestedEndTime;
        requestData.requested_date = requestedDate;
      }

      await shiftApi.createScheduleRequest(requestData);
      toast.success('Request submitted successfully', {
        description: 'Your manager will review your request'
      });
      setRequestDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleApproveReject = (request: ScheduleRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const confirmApproveReject = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    setProcessingAction(true);
    try {
      if (action === 'approve') {
        await shiftApi.approveScheduleRequest(selectedRequest.id);
        toast.success('Request approved');
      } else {
        await shiftApi.rejectScheduleRequest(selectedRequest.id, 'Rejected by manager');
        toast.success('Request rejected');
      }
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to process request:', error);
      toast.error(error.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'active') return 'bg-green-100 text-green-700';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (s === 'rejected') return 'bg-red-100 text-red-700';
    if (s === 'cancelled' || s === 'expired') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') return 'Active';
    if (s === 'pending') return 'Pending';
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    if (s === 'cancelled') return 'Cancelled';
    if (s === 'expired') return 'Expired';
    return status;
  };

  const getRequestTypeLabel = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'time_off_request') return 'Time Off';
    if (t === 'schedule_change') return 'Schedule Change';
    if (t === 'shift_swap') return 'Shift Swap';
    if (t === 'flexible_arrangement') return 'Flexible';
    if (t === 'compensatory_time_use') return 'Comp Time';
    return type;
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get current active assignment
  const currentAssignment = myAssignments.find(a => a.status === 'active') || myAssignments[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shift Management</h1>
              <p className="text-xs sm:text-sm text-gray-500">Manage your schedule and shift requests</p>
            </div>
            <Button
              onClick={handleOpenRequestDialog}
              className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-white text-xs sm:text-sm h-9 px-3"
              size="sm"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Request Change</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-11 sm:h-12">
            <TabsTrigger value="my-schedule" className="text-xs sm:text-sm">My Schedule</TabsTrigger>
            <TabsTrigger value="request" className="text-xs sm:text-sm">My Requests</TabsTrigger>
            {canManageShifts && (
              <TabsTrigger value="manage" className="text-xs sm:text-sm">Manage Shifts</TabsTrigger>
            )}
            {canApproveRequests && (
              <TabsTrigger value="approvals" className="text-xs sm:text-sm">
                Approvals
                {scheduleRequests.filter(r => r.status === 'pending').length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">
                    {scheduleRequests.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* My Schedule Tab */}
          <TabsContent value="my-schedule" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading your schedule...</div>
            ) : currentAssignment ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Current Shift Card */}
                <Card className="shadow-md bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50]">
                  <CardContent className="p-4 sm:p-6 text-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm text-white/70 mb-1">Current Shift Assignment</div>
                        <h3 className="text-xl sm:text-2xl font-bold">
                          {currentAssignment.shift_template_name || currentAssignment.custom_start_time ? 'Custom Shift' : 'Unassigned'}
                        </h3>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {getStatusLabel(currentAssignment.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-white/70">Start Time</div>
                        <div className="text-lg sm:text-xl font-semibold">
                          {formatTime(currentAssignment.custom_start_time || currentAssignment.shift_template_name?.includes('Morning') ? '09:00' : '09:00')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/70">End Time</div>
                        <div className="text-lg sm:text-xl font-semibold">
                          {formatTime(currentAssignment.custom_end_time || currentAssignment.shift_template_name?.includes('Morning') ? '17:00' : '17:00')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="text-xs text-white/70">Effective From</div>
                      <div className="text-sm font-medium">{formatDate(currentAssignment.effective_from)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="shadow-sm">
                    <CardContent className="p-3 text-center">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-[#1A2B3C]" />
                      <div className="text-xs text-gray-500">Shift Type</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {currentAssignment.assignment_type === 'permanent' ? 'Permanent' : 
                         currentAssignment.assignment_type === 'temporary' ? 'Temporary' : 'Rotating'}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="p-3 text-center">
                      <Coffee className="w-6 h-6 mx-auto mb-2 text-[#1A2B3C]" />
                      <div className="text-xs text-gray-500">Break</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {currentAssignment.custom_break_duration_minutes || 60} min
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* All My Assignments */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">All Assignments</h3>
                  <div className="space-y-2">
                    {myAssignments.length > 0 ? (
                      myAssignments.map((assignment) => (
                        <Card key={assignment.id} className="shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">
                                  {assignment.shift_template_name || 'Custom Shift'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(assignment.effective_from)} - {formatDate(assignment.effective_to)}
                                </div>
                              </div>
                              <Badge className={getStatusColor(assignment.status)}>
                                {getStatusLabel(assignment.status)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No shift assignments yet</p>
                          <p className="text-xs mt-1">Your manager will assign you to a shift</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center">
                  <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shift Assigned</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    You haven't been assigned to any shift yet. Please contact your manager.
                  </p>
                  <Button
                    onClick={() => setActiveTab('request')}
                    className="bg-[#1A2B3C] hover:bg-[#2C3E50]"
                  >
                    Request Shift Assignment
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Request Tab */}
          <TabsContent value="request" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">My Requests</h3>
              <Button
                onClick={handleOpenRequestDialog}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                New Request
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading requests...</div>
            ) : scheduleRequests.length > 0 ? (
              <div className="space-y-2">
                {scheduleRequests.map((request) => (
                  <Card key={request.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusLabel(request.status)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {getRequestTypeLabel(request.request_type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{request.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {request.requested_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(request.requested_date)}</span>
                          </div>
                        )}
                        {request.requested_start_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(request.requested_start_time)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Submit a request for time off or schedule change
                  </p>
                  <Button
                    onClick={handleOpenRequestDialog}
                    className="bg-[#1A2B3C] hover:bg-[#2C3E50]"
                  >
                    Submit Request
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Manage Shifts Tab (Admin Only) */}
          <TabsContent value="manage" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Employee Shift Assignments</h3>
              <Button
                onClick={() => navigate('/shifts/create')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Assign Shift
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading assignments...</div>
            ) : allAssignments.length > 0 ? (
              <div className="space-y-2">
                {allAssignments.map((assignment) => (
                  <Card key={assignment.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {assignment.user_name || `User #${assignment.user_id}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {assignment.shift_template_name || 'Custom Shift'} • 
                            {formatTime(assignment.custom_start_time || '09:00')} - 
                            {formatTime(assignment.custom_end_time || '17:00')}
                          </div>
                        </div>
                        <Badge className={getStatusColor(assignment.status)}>
                          {getStatusLabel(assignment.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center text-gray-500">
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No shift assignments found</p>
                </CardContent>
              </Card>
            )}

            {/* Shift Templates Section */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Shift Templates</h3>
              <div className="space-y-2">
                {shiftTemplates.length > 0 ? (
                  shiftTemplates.map((template) => (
                    <Card key={template.id} className="shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{template.name}</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(template.start_time)} - {formatTime(template.end_time)}
                              {template.break_duration_minutes && ` • ${template.break_duration_minutes}min break`}
                            </div>
                          </div>
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500 text-sm">
                      No shift templates created yet
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Approvals Tab (Managers Only) */}
          <TabsContent value="approvals" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900">Pending Requests</h3>
              <p className="text-xs text-gray-500">Review and approve employee requests</p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading requests...</div>
            ) : scheduleRequests.filter(r => r.status === 'pending').length > 0 ? (
              <div className="space-y-2">
                {scheduleRequests.filter(r => r.status === 'pending').map((request) => (
                  <Card key={request.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            {request.user_name || `User #${request.user_id}`}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusLabel(request.status)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {getRequestTypeLabel(request.request_type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{request.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        {request.requested_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(request.requested_date)}</span>
                          </div>
                        )}
                        {request.requested_start_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(request.requested_start_time)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveReject(request, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveReject(request, 'reject')}
                          className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-sm text-gray-500">
                    No pending requests to review
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Request Schedule Change</DialogTitle>
            <DialogDescription className="text-sm">
              Submit a request for time off or schedule adjustment
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 sm:py-4 space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Request Type *
              </label>
              <Select value={requestType} onValueChange={(v) => setRequestType(v as any)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_off_request">Time Off</SelectItem>
                  <SelectItem value="schedule_change">Schedule Change</SelectItem>
                  <SelectItem value="flexible_arrangement">Flexible Arrangement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {requestType === 'time_off_request' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <Input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="text-sm"
                />
              </div>
            )}

            {requestType === 'schedule_change' && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={requestedStartTime}
                      onChange={(e) => setRequestedStartTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={requestedEndTime}
                      onChange={(e) => setRequestedEndTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for your request..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setRequestDialogOpen(false)}
              disabled={processingAction}
              className="text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={processingAction || !reason.trim() || (requestType === 'time_off_request' && !requestedDate)}
              className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-xs sm:text-sm"
            >
              {processingAction ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {selectedRequest ? `${selectedRequest.user_name || 'Employee'}'s Request` : 'Request'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Review and process this schedule request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-3 sm:py-4 space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusLabel(selectedRequest.status)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {getRequestTypeLabel(selectedRequest.request_type)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{selectedRequest.reason}</p>
                <div className="text-xs text-gray-500">
                  {selectedRequest.requested_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(selectedRequest.requested_date)}</span>
                    </div>
                  )}
                  {selectedRequest.requested_start_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(selectedRequest.requested_start_time)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => confirmApproveReject('approve')}
                  disabled={processingAction}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs sm:text-sm"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirmApproveReject('reject')}
                  disabled={processingAction}
                  className="border-red-200 text-red-600 hover:bg-red-50 flex-1 text-xs sm:text-sm"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
