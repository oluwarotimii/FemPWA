import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Umbrella, ArrowLeft, Check, Ban } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { floatingDayApi, type FloatingDayRequest, type TimeOffBank } from '@/app/services/api/floatingDayApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

export function FloatingDayScreen() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [requests, setRequests] = useState<FloatingDayRequest[]>([]);
  const [pendingForMe, setPendingForMe] = useState<FloatingDayRequest[]>([]);
  const [banks, setBanks] = useState<TimeOffBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newBankId, setNewBankId] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; request: FloatingDayRequest | null; type: 'clear' | null }>({ open: false, request: null, type: null });
  const [processingAction, setProcessingAction] = useState(false);

  const canClear = hasPermission('floating_day:clear');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, bankRes] = await Promise.all([
        floatingDayApi.getMyRequests(),
        floatingDayApi.getMyBalance(),
      ]);
      if (reqRes.success) setRequests(reqRes.data.requests);
      if (bankRes.success) setBanks(bankRes.data.timeOffBanks);

      if (canClear) {
        const pendingRes = await floatingDayApi.getPendingForMe();
        if (pendingRes.success) setPendingForMe(pendingRes.data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch day off data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const totalAvailable = banks.reduce((sum, b) => sum + Number(b.available_days), 0);

  const handleCreate = async () => {
    if (!newDate || !newBankId) return;
    setSubmitting(true);
    try {
      const res = await floatingDayApi.create({ time_off_bank_id: parseInt(newBankId), date: newDate, reason: newReason || undefined });
      if (res.success) {
        toast.success('Day off request submitted');
        setShowCreate(false);
        setNewBankId('');
        setNewDate('');
        setNewReason('');
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = async () => {
    const req = actionDialog.request;
    if (!req) return;
    setProcessingAction(true);
    try {
      const res = await floatingDayApi.clear(req.id);
      if (res.success) {
        toast.success('Request cleared');
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clear request');
    } finally {
      setProcessingAction(false);
      setActionDialog({ open: false, request: null, type: null });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const res = await floatingDayApi.cancel(id);
      if (res.success) {
        toast.success('Request cancelled');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'cleared') return 'bg-blue-100 text-blue-700';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (s === 'rejected' || s === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <CheckCircle className="w-3 h-3" />;
    if (s === 'cleared') return <CheckCircle className="w-3 h-3" />;
    if (s === 'pending') return <Clock className="w-3 h-3" />;
    if (s === 'rejected') return <XCircle className="w-3 h-3" />;
    if (s === 'cancelled') return <AlertCircle className="w-3 h-3" />;
    return null;
  };

  const formatDate = (d: string) => {
    const ds = d.includes('T') ? d.split('T')[0] : d;
    return new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (showCreate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)} className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Request Day Off</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              {banks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day Off Type *
                  </label>
                  <select
                    value={newBankId}
                    onChange={(e) => setNewBankId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A2B3C] focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select day off type</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id} disabled={Number(bank.available_days) < 1}>
                        {bank.program_name} ({bank.available_days} day{bank.available_days !== '1' ? 's' : ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={today}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <Textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Optional reason for your request..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={submitting || !newBankId || !newDate}
                className="w-full h-12 bg-[#1A2B3C] hover:bg-[#2C3E50]"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-4xl mx-auto px-3 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Day Off</h1>
          <p className="text-xs sm:text-sm text-gray-500">Request compensatory days off</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-white h-9 px-3"
          size="sm"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">New Request</span>
        </Button>
      </div>

      {banks.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {banks.map((bank) => (
            <Card key={bank.id} className="shadow-md bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50]">
              <CardContent className="p-3 text-white">
                <div className="text-xs text-white/70 truncate mb-1">{bank.program_name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{bank.available_days}</span>
                  <span className="text-xs text-white/70">/ {bank.total_entitled_days}</span>
                </div>
                <div className="text-xs text-white/70">available</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canClear && pendingForMe.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">{pendingForMe.length} request(s) pending your clearance</span>
            </div>
            <div className="flex gap-1">
              {pendingForMe.slice(0, 3).map((req) => (
                <Badge key={req.id} variant="outline" className="text-xs cursor-pointer" onClick={() => setActionDialog({ open: true, request: req, type: 'clear' })}>
                  {req.user_name?.split(' ')[0]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="my-requests" className="w-full">
        <TabsList className={`grid w-full ${canClear ? 'grid-cols-2' : 'grid-cols-1'} h-10`}>
          <TabsTrigger value="my-requests" className="text-xs">My Requests</TabsTrigger>
          {canClear && (
            <TabsTrigger value="pending" className="text-xs">
              Pending {pendingForMe.length > 0 && `(${pendingForMe.length})`}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-requests" className="space-y-2 mt-3">
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Umbrella className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No day off requests yet</p>
            </div>
          ) : (
            requests.map((req) => (
              <Card key={req.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{formatDate(req.date)}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{req.program_name || 'Day Off'}</span>
                        <Badge className={`${getStatusColor(req.status)} text-xs`}>
                          {getStatusIcon(req.status)}
                          <span className="ml-1">{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
                        </Badge>
                      </div>
                      {req.reason && <div className="text-xs text-gray-600">{req.reason}</div>}
                      {req.cleared_by_name && <div className="text-xs text-blue-600 mt-1">Cleared by: {req.cleared_by_name}</div>}
                      {req.approved_by_name && <div className="text-xs text-green-600 mt-1">Approved by: {req.approved_by_name}</div>}
                      {req.rejection_reason && <div className="text-xs text-red-600 mt-1">Reason: {req.rejection_reason}</div>}
                    </div>
                    {req.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleCancel(req.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {canClear && (
          <TabsContent value="pending" className="space-y-2 mt-3">
            {pendingForMe.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No requests pending your clearance</div>
            ) : (
              pendingForMe.map((req) => (
                <Card key={req.id} className="shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{req.user_name || `User #${req.user_id}`}</div>
                        <div className="text-xs text-gray-500">{req.program_name || 'Day Off'}</div>
                        <div className="text-xs text-gray-600">{formatDate(req.date)}</div>
                        {req.reason && <div className="text-xs text-gray-500 mt-1">{req.reason}</div>}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setActionDialog({ open: true, request: req, type: 'clear' })}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={actionDialog.open} onOpenChange={(o) => !o && setActionDialog({ open: false, request: null, type: null })}>
        <DialogContent className="max-w-sm mx-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Clear Day Off Request
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to clear this request? This sends it to HR for final approval.
            </DialogDescription>
          </DialogHeader>
          {actionDialog.request && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="font-medium text-sm">{actionDialog.request.user_name || `User #${actionDialog.request.user_id}`}</div>
              <div className="text-xs text-gray-500">{actionDialog.request.program_name || 'Day Off'}</div>
              <div className="text-xs text-gray-600">{formatDate(actionDialog.request.date)}</div>
              {actionDialog.request.reason && <div className="text-xs text-gray-500">{actionDialog.request.reason}</div>}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionDialog({ open: false, request: null, type: null })} disabled={processingAction} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleClear} disabled={processingAction} className="bg-blue-600 hover:bg-blue-700 text-xs">
              {processingAction ? 'Processing...' : 'Confirm Clear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
