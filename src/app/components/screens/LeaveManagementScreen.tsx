import { useState, useEffect } from 'react';
import { Plus, Calendar, Briefcase, Heart, Users, CheckCircle, XCircle, Clock, AlertCircle, History, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { leaveApi, type LeaveType, type LeaveBalance, type LeaveRequest } from '@/app/services/api';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

export function LeaveManagementScreen() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-leave'>('my-leave');

  // Users with leave:update or leave:read permission can manage others' requests
  // NOTE: Manage Leave section commented out - only available through dashboard for authorized users
  // const canManageOthers = hasPermission('leave:update') || hasPermission('leave:read');
  const canManageOthers = false; // Disabled - manage leave only through dashboard
  const canApprove = hasPermission('leave:update');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Always fetch personal leave requests (for all users including admins)
      const requestsResponse = await leaveApi.getMyLeaveRequests();
      setLeaveRequests(requestsResponse.data.leaveRequests);

      // Fetch all leave requests if user can manage others
      if (canManageOthers) {
        try {
          const allRequestsResponse = await leaveApi.getAllLeaveRequests();
          setAllLeaveRequests(allRequestsResponse.data.leaveRequests);
        } catch (allRequestsError) {
          console.log('Could not fetch all leave requests, falling back to personal requests only');
          setAllLeaveRequests([]);
        }
      }

      // Fetch leave types
      const typesResponse = await leaveApi.getLeaveTypes();
      setLeaveTypes(typesResponse.data.leaveTypes);

      // Fetch leave balances (personal)
      try {
        const balancesResponse = await leaveApi.getLeaveBalances();
        setLeaveBalances(balancesResponse.data.balances);
      } catch (balanceError) {
        console.log('Leave balances not available, calculating from leave types');
        calculateLeaveBalancesFromTypes(typesResponse.data.leaveTypes, requestsResponse.data.leaveRequests);
      }
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
      toast.error('Failed to load leave data. Please ensure the leave module is configured on the server.');
      setLeaveRequests([]);
      setAllLeaveRequests([]);
      setLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fallback: Calculate leave balances based on leave types and used days
  const calculateLeaveBalancesFromTypes = (types: LeaveType[], requests: LeaveRequest[]) => {
    const balances = types.map(type => {
      const usedDays = requests
        .filter(req =>
          req.leave_type_id === type.id &&
          req.status.toLowerCase() === 'approved' &&
          new Date(req.start_date).getFullYear() === new Date().getFullYear()
        )
        .reduce((sum, req) => {
          const start = new Date(req.start_date);
          const end = new Date(req.end_date);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return sum + diffDays;
        }, 0);

      const pendingDays = requests
        .filter(req =>
          req.leave_type_id === type.id &&
          req.status.toLowerCase() === 'submitted'
        )
        .reduce((sum, req) => {
          const start = new Date(req.start_date);
          const end = new Date(req.end_date);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return sum + diffDays;
        }, 0);

      return {
        leave_type_id: type.id,
        leave_type_name: type.name,
        allocated_days: type.days_per_year,
        used_days: usedDays,
        remaining_days: type.days_per_year - usedDays,
        pending_days: pendingDays,
        carried_over_days: 0,
        cycle_start_date: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        cycle_end_date: new Date(new Date().getFullYear(), 11, 31).toISOString()
      };
    });
    setLeaveBalances(balances);
  };

  // Fetch attachments for a leave request
  const fetchAttachments = async (leaveRequestId: number) => {
    try {
      const response = await leaveApi.getLeaveRequestAttachments(leaveRequestId);
      if (response.success && response.data?.files) {
        // Update selectedRequest with attachments
        setSelectedRequest(prev => prev ? {
          ...prev,
          attachments: response.data.files.map((f: any) => ({
            file_name: f.file_name,
            file_url: f.file_url
          }))
        } : null);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
      // Don't show error toast - attachments are optional
    }
  };

  // Handle approve/reject - opens modal
  const handleApproveReject = (request: LeaveRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionDialogOpen(true);
    if (type === 'reject') {
      setRejectionReason('');
    }
    // Fetch attachments for this leave request
    fetchAttachments(request.id);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    setProcessingAction(true);
    try {
      const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
      const reason = actionType === 'reject' ? rejectionReason : undefined;

      await leaveApi.updateLeaveRequest(selectedRequest.id, newStatus, reason);

      toast.success(
        actionType === 'approve' ? 'Leave request approved' : 'Leave request rejected',
        {
          description: `${selectedRequest.user_name || 'Employee'}'s request has been ${newStatus}`
        }
      );

      setActionDialogOpen(false);
      setSelectedRequest(null);
      setActionType(null);
      setRejectionReason('');
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Failed to update leave request:', error);
      toast.error(error.response?.data?.message || `Failed to ${actionType} leave request`);
    } finally {
      setProcessingAction(false);
    }
  };

  const getLeaveTypeIcon = (typeName: string) => {
    const name = typeName.toLowerCase();
    if (name.includes('annual') || name.includes('vacation')) return <Calendar className="w-5 h-5" />;
    if (name.includes('sick') || name.includes('medical')) return <Heart className="w-5 h-5" />;
    if (name.includes('casual')) return <Users className="w-5 h-5" />;
    return <Briefcase className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-700 hover:bg-green-100';
    if (s === 'submitted') return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
    if (s === 'rejected') return 'bg-red-100 text-red-700 hover:bg-red-100';
    if (s === 'cancelled') return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
  };

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'submitted') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <CheckCircle className="w-3 h-3" />;
    if (s === 'submitted') return <Clock className="w-3 h-3" />;
    if (s === 'rejected') return <XCircle className="w-3 h-3" />;
    if (s === 'cancelled') return <AlertCircle className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-4xl mx-auto px-3 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {activeTab === 'my-leave' ? 'My Leave' : 'Manage Leave'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {activeTab === 'my-leave' ? 'Manage your time-off requests' : 'Review and approve employee requests'}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button
            onClick={() => navigate('/new-leave')}
            className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-white h-9 px-3"
            size="sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">New Request</span>
          </Button>
        </div>
      </div>

      {/* Leave Balance Cards */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 text-sm">Loading leave balances...</div>
      ) : leaveBalances.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {leaveBalances.map((balance) => (
            <Card
              key={balance.leave_type_id}
              className="shadow-md bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50]"
            >
              <CardContent className="p-2 sm:p-3 text-white">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  {getLeaveTypeIcon(balance.leave_type_name)}
                  <div className="text-xs text-white/70 truncate">{balance.leave_type_name}</div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-3xl font-bold">{balance.remaining_days}</span>
                  <span className="text-xs text-white/70">/ {balance.allocated_days}</span>
                </div>
                <div className="text-xs text-white/70 mt-0.5">days remaining</div>
                {balance.pending_days > 0 && (
                  <div className="text-xs text-yellow-300 mt-0.5 truncate">
                    {balance.pending_days} pending
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">No leave balances available</div>
      )}

      {/* Statistics Cards - Personal stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Card className="shadow-sm">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-[#1A2B3C]">{leaveRequests.length}</div>
                <div className="text-xs text-gray-500">Total</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {leaveRequests.filter((r) => r.status.toLowerCase() === 'submitted').length}
                </div>
                <div className="text-xs text-gray-500">Pending</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {leaveRequests.filter((r) => r.status.toLowerCase() === 'approved').length}
                </div>
                <div className="text-xs text-gray-500">Approved</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-red-600">
                  {leaveRequests.filter((r) => r.status.toLowerCase() === 'rejected').length}
                </div>
                <div className="text-xs text-gray-500">Rejected</div>
              </CardContent>
            </Card>
          </div>

      {/* Leave Requests */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-10 sm:h-11">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
          <TabsTrigger value="submitted" className="text-xs sm:text-sm">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs sm:text-sm">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs sm:text-sm">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Loading leave requests...</div>
          ) : (activeTab === 'my-leave' ? leaveRequests : allLeaveRequests).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {activeTab === 'my-leave' 
                  ? 'No leave requests yet' 
                  : 'No employee leave requests found'}
              </p>
              {activeTab === 'my-leave' && (
                <Button
                  variant="link"
                  onClick={() => navigate('/new-leave')}
                  className="text-[#1A2B3C] text-sm"
                >
                  Submit your first request
                </Button>
              )}
            </div>
          ) : (
            (activeTab === 'my-leave' ? leaveRequests : allLeaveRequests).map((request) => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                leaveTypes={leaveTypes}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                getStatusIcon={getStatusIcon}
                canApprove={canApprove}
                showUserName={activeTab === 'manage'}
                onApprove={() => handleApproveReject(request, 'approve')}
                onReject={() => handleApproveReject(request, 'reject')}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Loading...</div>
          ) : (
            (activeTab === 'my-leave' ? leaveRequests : allLeaveRequests)
              .filter((req) => req.status.toLowerCase() === 'submitted')
              .map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  leaveTypes={leaveTypes}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  getStatusIcon={getStatusIcon}
                  canApprove={canApprove}
                  showUserName={activeTab === 'manage'}
                  onApprove={() => handleApproveReject(request, 'approve')}
                  onReject={() => handleApproveReject(request, 'reject')}
                />
              ))
          )}
          {(activeTab === 'my-leave' ? leaveRequests : allLeaveRequests).filter((req) => req.status.toLowerCase() === 'submitted').length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              {activeTab === 'my-leave' ? 'No pending requests' : 'No pending employee requests'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Loading...</div>
          ) : (
            (activeTab === 'my-leave' ? leaveRequests : allLeaveRequests)
              .filter((req) => req.status.toLowerCase() === 'approved')
              .map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  leaveTypes={leaveTypes}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  getStatusIcon={getStatusIcon}
                  canApprove={canApprove}
                  showUserName={activeTab === 'manage'}
                  onApprove={() => handleApproveReject(request, 'approve')}
                  onReject={() => handleApproveReject(request, 'reject')}
                />
              ))
          )}
          {(activeTab === 'my-leave' ? leaveRequests : allLeaveRequests).filter((req) => req.status.toLowerCase() === 'approved').length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              {activeTab === 'my-leave' ? 'No approved requests' : 'No approved employee requests'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Loading...</div>
          ) : (
            (activeTab === 'my-leave' ? leaveRequests : allLeaveRequests)
              .filter((req) => req.status.toLowerCase() === 'rejected')
              .map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  leaveTypes={leaveTypes}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  getStatusIcon={getStatusIcon}
                  canApprove={canApprove}
                  showUserName={activeTab === 'manage'}
                  onApprove={() => handleApproveReject(request, 'approve')}
                  onReject={() => handleApproveReject(request, 'reject')}
                />
              ))
          )}
          {(activeTab === 'my-leave' ? leaveRequests : allLeaveRequests).filter((req) => req.status.toLowerCase() === 'rejected').length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              {activeTab === 'my-leave' ? 'No rejected requests' : 'No rejected employee requests'}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 flex flex-col gap-2 sm:gap-3 z-10">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/new-leave')}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-2 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Approve Leave Request
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  Reject Leave Request
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {actionType === 'approve' ? (
                <>Are you sure you want to approve this leave request?</>
              ) : (
                <>Please provide a reason for rejecting this leave request.</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-3 sm:py-4 space-y-3 sm:space-y-4">
              {/* Request Details Card */}
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3">
                {/* Header with name and status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                      {selectedRequest.user_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">
                        {selectedRequest.user_name || 'Employee'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(selectedRequest.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(selectedRequest.status)} text-xs shrink-0`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-1">{getStatusLabel(selectedRequest.status)}</span>
                  </Badge>
                </div>

                {/* Leave Type */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500 mb-1">Leave Type</div>
                    <div className="font-medium text-gray-900 text-sm">
                      {selectedRequest.leave_type_name || 'General'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500 mb-1">Duration</div>
                    <div className="font-medium text-gray-900 text-sm">
                      {calculateDays(selectedRequest.start_date, selectedRequest.end_date)} day{calculateDays(selectedRequest.start_date, selectedRequest.end_date) > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Start Date</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(selectedRequest.start_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">End Date</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(selectedRequest.end_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Reason for Leave</div>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedRequest.reason || 'No reason provided'}
                  </div>
                </div>

                {/* Attachments */}
                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      Attachments ({selectedRequest.attachments.length})
                    </div>
                    <div className="space-y-1">
                      {selectedRequest.attachments.map((attachment: any, index: number) => (
                        <a
                          key={index}
                          href={attachment.file_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors group"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-900 flex-1 truncate">
                            {attachment.file_name || `Attachment ${index + 1}`}
                          </span>
                          <ExternalLink className="w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rejection Reason Input */}
              {actionType === 'reject' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    rows={3}
                    placeholder="Please provide a reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-3 sticky bottom-0 bg-white pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setActionType(null);
                setRejectionReason('');
              }}
              disabled={processingAction}
              className="text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={processingAction || (actionType === 'reject' && !rejectionReason.trim())}
              className={`${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-xs sm:text-sm`}
            >
              {processingAction ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for leave request cards
function LeaveRequestCard({
  request,
  leaveTypes,
  getStatusColor,
  getStatusLabel,
  getStatusIcon,
  canApprove,
  showUserName,
  onApprove,
  onReject,
}: {
  request: LeaveRequest;
  leaveTypes: LeaveType[];
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  canApprove: boolean;
  showUserName?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const leaveType = leaveTypes.find(t => t.id === request.leave_type_id);

  const calculateDays = () => {
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {request.leave_type_name || leaveType?.name || 'Leave Request'}
              </span>
              <Badge className={`${getStatusColor(request.status)} text-xs shrink-0`}>
                {getStatusIcon(request.status)}
                <span className="ml-1">{getStatusLabel(request.status)}</span>
              </Badge>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 line-clamp-2">{request.reason}</div>
            {showUserName && request.user_name && (
              <div className="text-xs text-gray-500 mt-1">Requested by: {request.user_name}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1 min-w-0">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">
                {new Date(request.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs">{calculateDays()} day(s)</Badge>
          </div>

          {/* ❌ DISABLED: Approve/Reject buttons removed - only through admin dashboard */}
          {/* {canApprove && request.status.toLowerCase() === 'submitted' && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={onApprove}
                className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm h-8 px-2 sm:px-3"
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Approve</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                className="border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm h-8 px-2 sm:px-3"
              >
                <XCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Reject</span>
              </Button>
            </div>
          )} */}
        </div>
      </CardContent>
    </Card>
  );
}
