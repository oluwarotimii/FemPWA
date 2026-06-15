import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Check, X, Clock, AlertCircle, Search, FileText, Eye,
  User, CalendarDays, ExternalLink, Paperclip
} from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { leaveApi, type LeaveRequest } from '@/app/services/api';
import { useAuth } from '@/app/contexts/AuthContext';

const STATUS_OPTIONS = ['all', 'submitted', 'approved', 'rejected', 'cancelled'] as const;

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  submitted: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export function LeaveRequestManagementScreen() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canManage = hasPermission('leave:read') || hasPermission('leave:update') || hasPermission('leave:approve');
  const canApprove = hasPermission('leave:update') || hasPermission('leave:approve');

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setInitialLoading(true);
      const res = await leaveApi.getAllLeaveRequests();
      setRequests(res.data.leaveRequests);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setInitialLoading(false);
    }
  };

  const viewDetails = async (req: LeaveRequest) => {
    setSelectedRequest(req);
    setDetailOpen(true);
    setLoadingFiles(true);
    try {
      const filesRes = await leaveApi.getLeaveRequestAttachments(req.id);
      setAttachments(filesRes.data?.files || []);
    } catch {
      setAttachments([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const openAction = (req: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(req);
    setActionType(action);
    setDeclineReason('');
    setActionOpen(true);
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;
    if (actionType === 'reject' && !declineReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const status = actionType === 'approve' ? 'approved' : 'rejected';
      const res = await leaveApi.updateLeaveRequest(selectedRequest.id, status, declineReason.trim() || undefined);
      toast.success(res.message);
      setActionOpen(false);
      setDetailOpen(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${actionType} leave request`);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  const filtered = requests.filter(r => {
    const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query
      || (r.user_name?.toLowerCase().includes(query))
      || (r.leave_type_name?.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-600">You do not have permission to manage leave requests.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/leave')} className="p-1 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Manage Leave</h1>
            <p className="text-xs text-gray-600 mt-0.5">Review and process employee leave requests</p>
          </div>
        </div>

        <div className="px-4 pb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or leave type..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? 'bg-[#1A2B3C] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-3">
        {initialLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2B3C] mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Loading...</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {searchQuery || statusFilter !== 'all' ? 'No matching requests' : 'No leave requests found'}
              </p>
              <p className="text-xs text-gray-600">
                {searchQuery ? 'Try a different search term' : 'Leave requests will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <Card key={req.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => viewDetails(req)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{req.user_name || `User #${req.user_id}`}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(req.start_date)} – {formatDate(req.end_date)}
                        </span>
                        <span className="font-medium text-gray-700">{req.leave_type_name}</span>
                      </div>
                      {req.reason && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{req.reason}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={
                        req.status === 'approved' ? 'default' :
                        req.status === 'rejected' || req.status === 'cancelled' ? 'destructive' :
                        'secondary'
                      } className="text-[10px] px-2 py-0.5">
                        {req.status === 'submitted' ? 'Pending' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                      {req.status === 'submitted' && canApprove && (
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => openAction(req, 'approve')}
                            className="p-1.5 bg-green-50 hover:bg-green-100 rounded text-green-700"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openAction(req, 'reject')}
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded text-red-700"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) { setDetailOpen(false); setAttachments([]); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Leave Request Details</DialogTitle>
                <DialogDescription>
                  {selectedRequest.user_name || `User #${selectedRequest.user_id}`} &middot; {selectedRequest.leave_type_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Start Date</Label>
                    <p className="font-medium">{formatDate(selectedRequest.start_date)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">End Date</Label>
                    <p className="font-medium">{formatDate(selectedRequest.end_date)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <Badge variant={
                      selectedRequest.status === 'approved' ? 'default' :
                      selectedRequest.status === 'rejected' || selectedRequest.status === 'cancelled' ? 'destructive' :
                      'secondary'
                    } className="text-[10px]">{selectedRequest.status === 'submitted' ? 'Pending' : selectedRequest.status}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Reason</Label>
                  <p className="text-sm text-gray-700 mt-1">{selectedRequest.reason || 'No reason provided'}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Attachments</Label>
                  {loadingFiles ? (
                    <p className="text-xs text-gray-400 mt-1">Loading files...</p>
                  ) : attachments.length === 0 ? (
                    <p className="text-xs text-gray-400 mt-1">No attachments</p>
                  ) : (
                    <div className="space-y-1.5 mt-1">
                      {attachments.map((file: any, idx: number) => (
                        <a
                          key={idx}
                          href={file.file_url || file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100 text-sm text-blue-600"
                        >
                          <Paperclip className="w-4 h-4 shrink-0" />
                          <span className="flex-1 truncate">{file.file_name || file.name || `File ${idx + 1}`}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <Label className="text-xs text-red-600 font-semibold">Rejection Reason</Label>
                    <p className="text-sm text-red-700 mt-1">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {selectedRequest.status === 'submitted' && canApprove && (
                  <>
                    <Button variant="outline" onClick={() => { setDetailOpen(false); openAction(selectedRequest, 'reject'); }} className="text-red-600 border-red-200 hover:bg-red-50">
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button onClick={() => { setDetailOpen(false); openAction(selectedRequest, 'approve'); }} className="bg-green-700 hover:bg-green-800 text-white">
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Confirmation Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request</DialogTitle>
            <DialogDescription>
              {selectedRequest?.user_name || `User #${selectedRequest?.user_id}`} &middot; {selectedRequest?.leave_type_name}
              <br />
              {selectedRequest && formatDate(selectedRequest.start_date)} – {selectedRequest && formatDate(selectedRequest.end_date)}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div>
              <Label htmlFor="reject-reason">Reason for rejection *</Label>
              <Textarea
                id="reject-reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Explain why this request is being rejected"
                rows={3}
                className="mt-1"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={actionType === 'approve' ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-red-700 hover:bg-red-800 text-white'}
            >
              {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
