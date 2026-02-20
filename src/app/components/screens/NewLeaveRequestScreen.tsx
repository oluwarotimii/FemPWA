import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Paperclip, Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
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
import { leaveApi, type LeaveType, type LeaveBalance } from '@/app/services/api';
import { Badge } from '@/app/components/ui/badge';

export function NewLeaveRequestScreen() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [daysRequested, setDaysRequested] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const typesResponse = await leaveApi.getLeaveTypes();
        setLeaveTypes(typesResponse.data.leaveTypes);

        try {
          const balancesResponse = await leaveApi.getLeaveBalances();
          setLeaveBalances(balancesResponse.data.balances);
        } catch (error) {
          console.log('Leave balances not available');
        }
      } catch (error) {
        console.error('Failed to fetch leave types:', error);
        toast.error('Failed to load leave types');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDaysRequested(diffDays);
    } else {
      setDaysRequested(0);
    }
  }, [startDate, endDate]);

  const getAvailableDays = (leaveTypeId: number) => {
    const balance = leaveBalances.find(b => b.leave_type_id === leaveTypeId);
    return balance ? balance.remaining_days : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLeaveType) {
      toast.error('Please select a leave type');
      return;
    }

    const leaveTypeId = parseInt(selectedLeaveType);
    const availableDays = getAvailableDays(leaveTypeId);

    if (daysRequested > availableDays) {
      toast.error(`Insufficient leave balance. Available: ${availableDays} days`);
      return;
    }

    setLoading(true);

    try {
      const attachments = document ? [document.name] : undefined;
      
      await leaveApi.submitLeaveRequest({
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason,
        attachments
      });

      toast.success('Leave Request Submitted', {
        description: 'Your manager will review your request shortly'
      });

      navigate('/leave');
    } catch (error: any) {
      console.error('Failed to submit leave request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const selectedBalance = leaveBalances.find(b => b.leave_type_id === parseInt(selectedLeaveType));

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/leave')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Request Leave</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl mx-auto p-4 pb-20 space-y-4">
          {/* Leave Type with Balance Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Leave Type *
              </label>
              <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.filter(t => t.is_active).map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{type.name}</span>
                        {(() => {
                          const balance = leaveBalances.find(b => b.leave_type_id === type.id);
                          return (
                            <Badge variant="outline" className="ml-2">
                              {balance ? balance.remaining_days : type.days_per_year} days left
                            </Badge>
                          );
                        })()}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedLeaveType && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Leave Balance:</p>
                    <p>
                      Available: <strong>{selectedBalance?.remaining_days || 0}</strong> days |
                      Used: <strong>{selectedBalance?.used_days || 0}</strong> days |
                      Allocated: <strong>{selectedBalance?.allocated_days || 0}</strong> days
                    </p>
                    {selectedBalance && selectedBalance.carried_over_days > 0 && (
                      <p className="text-amber-600">
                        Carried Over: <strong>{selectedBalance.carried_over_days}</strong> days
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    min={today}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    min={startDate || today}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {daysRequested > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total days requested:</span>
                    <span className="font-semibold text-gray-900">{daysRequested} day(s)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reason */}
          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Leave *
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a brief reason for your leave request..."
                rows={4}
                required
              />
            </CardContent>
          </Card>

          {/* Attachment */}
          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach Document (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#1A2B3C] transition-colors cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Paperclip className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {document ? document.name : 'Click to upload document'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOC, or image files (max 5MB)
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white border-t p-4 -mx-4 mt-6">
            <Button
              type="submit"
              disabled={loading || !selectedLeaveType || !startDate || !endDate || !reason}
              className="w-full h-12 bg-[#1A2B3C] hover:bg-[#2C3E50]"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
