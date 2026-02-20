import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Filter, Search, Clock, CheckCircle, XCircle, AlertCircle, Briefcase } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { leaveApi, type LeaveRequest, type LeaveType } from '@/app/services/api';
import { useAuth } from '@/app/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

export function LeaveHistoryScreen() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLeaveType, setFilterLeaveType] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-history' | 'all-history'>('my-history');

  // Users with leave:update or leave:read permission can manage others' requests
  const canViewAll = hasPermission('leave:update') || hasPermission('leave:read');
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
      if (canViewAll) {
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
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = (request: LeaveRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionDialogOpen(true);
    if (type === 'reject') {
      setRejectionReason('');
    }
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

  // Get the data to filter based on active tab
  const displayData = activeTab === 'my-history' ? leaveRequests : allLeaveRequests;

  // Filter leave requests
  const filteredRequests = displayData.filter((request) => {
    const requestYear = new Date(request.start_date).getFullYear().toString();
    const matchesYear = filterYear === 'all' || requestYear === filterYear;
    const matchesStatus = filterStatus === 'all' || request.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesType = filterLeaveType === 'all' || request.leave_type_id.toString() === filterLeaveType;
    
    const matchesSearch = searchTerm === '' || 
      request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leave_type_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesYear && matchesStatus && matchesType && matchesSearch;
  });

  // Get unique years from display data
  const availableYears = Array.from(
    new Set(displayData.map((r) => new Date(r.start_date).getFullYear().toString()))
  ).sort((a, b) => b.localeCompare(a));

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
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    if (s === 'cancelled') return 'Cancelled';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <CheckCircle className="w-4 h-4" />;
    if (s === 'submitted') return <Clock className="w-4 h-4" />;
    if (s === 'rejected') return <XCircle className="w-4 h-4" />;
    if (s === 'cancelled') return <AlertCircle className="w-4 h-4" />;
    return <Briefcase className="w-4 h-4" />;
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Group requests by year and month
  const groupedRequests = filteredRequests.reduce((acc, request) => {
    const date = new Date(request.start_date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[yearMonth]) {
      acc[yearMonth] = [];
    }
    acc[yearMonth].push(request);
    return acc;
  }, {} as Record<string, LeaveRequest[]>);

  const sortedGroups = Object.entries(groupedRequests).sort((a, b) => b[0].localeCompare(a[0]));

  const getMonthLabel = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Statistics
  const stats = {
    total: displayRequests.length,
    pending: displayRequests.filter((r) => r.status.toLowerCase() === 'submitted').length,
    approved: displayRequests.filter((r) => r.status.toLowerCase() === 'approved').length,
    rejected: displayRequests.filter((r) => r.status.toLowerCase() === 'rejected').length,
    totalDays: displayRequests
      .filter((r) => r.status.toLowerCase() === 'approved')
      .reduce((sum, r) => sum + calculateDays(r.start_date, r.end_date), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/leave')}
                className="h-9 w-9 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                  {activeTab === 'my-history' ? 'My Leave History' : 'All Leave History'}
                </h1>
                <p className="text-xs text-gray-500 truncate">
                  {activeTab === 'my-history' ? 'Your leave request history' : 'Employee leave history'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs - My History vs All History */}
      {canViewAll ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my-history' | 'all-history')} className="w-full bg-white border-b">
          <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12 rounded-none">
            <TabsTrigger value="my-history" className="text-sm sm:text-base">My History</TabsTrigger>
            <TabsTrigger value="all-history" className="text-sm sm:text-base">All History</TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      {/* Statistics Cards */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Get the data to display based on active tab */}
        {(() => {
          const displayData = activeTab === 'my-history' ? leaveRequests : allLeaveRequests;
          const stats = {
            total: displayData.length,
            pending: displayData.filter((r) => r.status.toLowerCase() === 'submitted').length,
            approved: displayData.filter((r) => r.status.toLowerCase() === 'approved').length,
            rejected: displayData.filter((r) => r.status.toLowerCase() === 'rejected').length,
            totalDays: displayData
              .filter((r) => r.status.toLowerCase() === 'approved')
              .reduce((sum, r) => sum + calculateDays(r.start_date, r.end_date), 0),
          };

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Card className="shadow-sm">
                  <CardContent className="p-2 sm:p-3 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-[#1A2B3C]">{stats.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-2 sm:p-3 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-2 sm:p-3 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.approved}</div>
                    <div className="text-xs text-gray-500">Approved</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-2 sm:p-3 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.rejected}</div>
                    <div className="text-xs text-gray-500">Rejected</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-2 sm:p-3 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.totalDays}</div>
                    <div className="text-xs text-gray-500">Days Taken</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="shadow-sm mb-3 sm:mb-4">
                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Filters</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 text-xs sm:text-sm"
                      />
                    </div>

                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="submitted">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterLeaveType} onValueChange={setFilterLeaveType}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {leaveTypes.filter(t => t.is_active).map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for quick filtering */}
              <Tabs defaultValue="all" className="mb-3 sm:mb-4">
                <TabsList className="grid w-full grid-cols-4 h-10 sm:h-11">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                  <TabsTrigger value="submitted" className="text-xs sm:text-sm">Pending</TabsTrigger>
                  <TabsTrigger value="approved" className="text-xs sm:text-sm">Approved</TabsTrigger>
                  <TabsTrigger value="rejected" className="text-xs sm:text-sm">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value="all" />
                <TabsContent value="submitted" />
                <TabsContent value="approved" />
                <TabsContent value="rejected" />
              </Tabs>

              {/* Leave History List */}
              {loading ? (
                <Card className="shadow-sm">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#1A2B3C] mx-auto"></div>
                    <p className="mt-3 sm:mt-4 text-gray-500 text-sm">Loading leave history...</p>
                  </CardContent>
                </Card>
              ) : filteredRequests.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium text-sm">No leave requests found</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {searchTerm || filterStatus !== 'all' || filterYear !== 'all' || filterLeaveType !== 'all'
                        ? 'Try adjusting your filters'
                        : activeTab === 'my-history'
                        ? 'Submit your first leave request'
                        : 'No employee leave requests'}
                    </p>
                    {activeTab === 'my-history' && !searchTerm && filterStatus === 'all' && filterYear === 'all' && filterLeaveType === 'all' && (
                      <Button
                        onClick={() => navigate('/new-leave')}
                        className="mt-3 sm:mt-4 bg-[#1A2B3C] hover:bg-[#2C3E50] text-sm"
                      >
                        Submit Leave Request
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {sortedGroups.map(([yearMonth, requests]) => (
                    <div key={yearMonth}>
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                        <h3 className="font-semibold text-gray-700 text-xs sm:text-sm">{getMonthLabel(yearMonth)}</h3>
                        <Badge variant="outline" className="text-xs">
                          {requests.length} request{requests.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        {requests.map((request) => (
                          <LeaveHistoryCard
                            key={request.id}
                            request={request}
                            leaveTypes={leaveTypes}
                            getStatusColor={getStatusColor}
                            getStatusLabel={getStatusLabel}
                            getStatusIcon={getStatusIcon}
                            calculateDays={calculateDays}
                            canApprove={canApprove}
                            showUserName={activeTab === 'all-history'}
                            onApprove={() => handleApproveReject(request, 'approve')}
                            onReject={() => handleApproveReject(request, 'reject')}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-2">
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
            <div className="py-3 sm:py-4 space-y-2 sm:space-y-3">
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="font-medium text-gray-900 text-sm sm:text-base">
                  {selectedRequest.leave_type_name || 'Leave Request'}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{selectedRequest.reason}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(selectedRequest.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  -{' '}
                  {new Date(selectedRequest.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                {selectedRequest.user_name && (
                  <div className="text-xs text-gray-500 mt-2">
                    Requested by: {selectedRequest.user_name}
                  </div>
                )}
              </div>

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

          <DialogFooter className="gap-2 sm:gap-3">
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

// Leave History Card Component
function LeaveHistoryCard({
  request,
  leaveTypes,
  getStatusColor,
  getStatusLabel,
  getStatusIcon,
  calculateDays,
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
  calculateDays: (start: string, end: string) => number;
  canApprove: boolean;
  showUserName?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const leaveType = leaveTypes.find((t) => t.id === request.leave_type_id);
  const days = calculateDays(request.start_date, request.end_date);

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
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{request.reason}</p>
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
                  year: 'numeric',
                })}
              </span>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs flex items-center gap-1">
              <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
              {days} day{days > 1 ? 's' : ''}
            </Badge>
            {request.attachments && request.attachments.length > 0 && (
              <Badge variant="outline" className="shrink-0 text-xs flex items-center gap-1">
                <Briefcase className="w-2 h-2 sm:w-3 sm:h-3" />
                {request.attachments.length}
              </Badge>
            )}
          </div>

          {canApprove && request.status.toLowerCase() === 'submitted' && (
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
          )}
        </div>

        {request.status.toLowerCase() === 'approved' && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Approved and deducted from balance</span>
          </div>
        )}

        {request.status.toLowerCase() === 'submitted' && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t text-xs text-yellow-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Awaiting approval</span>
          </div>
        )}

        {request.status.toLowerCase() === 'rejected' && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t text-xs text-red-600 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Request rejected</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
