import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, Pencil, Trash2, AlertCircle, ArrowLeft, Filter } from 'lucide-react';
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
import { shiftApi, staffApi, type ShiftException } from '@/app/services/api';
import { useAuth } from '@/app/contexts/AuthContext';

const EXCEPTION_TYPES = [
  { value: 'early_release', label: 'Early Release' },
  { value: 'late_start', label: 'Late Start' },
  { value: 'day_off', label: 'Day Off' },
  { value: 'special_schedule', label: 'Special Schedule' },
  { value: 'holiday_work', label: 'Holiday Work' },
] as const;

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  approved: 'default',
  pending: 'secondary',
  rejected: 'destructive',
  expired: 'outline',
};

interface StaffOption {
  user_id: number;
  full_name: string;
  email: string;
  employee_id?: string;
  designation?: string;
  department?: string;
}

export function ShiftExceptionManagementScreen() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canManage = hasPermission('shift_exception:create')
    || hasPermission('shift_exception:read')
    || hasPermission('shift_exception:update')
    || hasPermission('shift_exception:delete');

  const canCreate = hasPermission('shift_exception:create');
  const canEdit = hasPermission('shift_exception:update');
  const canDelete = hasPermission('shift_exception:delete');

  const [exceptions, setExceptions] = useState<ShiftException[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editException, setEditException] = useState<ShiftException | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShiftException | null>(null);

  const [formData, setFormData] = useState({
    user_id: '',
    exception_date: '',
    exception_type: '',
    new_start_time: '',
    new_end_time: '',
    new_break_duration_minutes: 0,
    reason: '',
  });

  useEffect(() => {
    loadStaffList();
  }, []);

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadStaffList = async () => {
    try {
      const response = await staffApi.getAllStaff({ limit: 500, status: 'active' });
      setStaffList(response.data.staff.map((s: any) => ({
        user_id: s.user_id,
        full_name: s.full_name,
        email: s.email,
        employee_id: s.employee_id,
        designation: s.designation,
        department: s.department,
      })));
    } catch (error) {
      console.error('Failed to load staff list:', error);
      toast.error('Failed to load staff list');
    }
  };

  const loadExceptions = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedUserId) params.userId = parseInt(selectedUserId);
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await shiftApi.getShiftExceptions(params);
      setExceptions(response.data.exceptions);
    } catch (error) {
      console.error('Failed to load exceptions:', error);
      toast.error('Failed to load shift exceptions');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, startDate, endDate]);

  const handleFilter = () => {
    loadExceptions();
  };

  const handleClearFilters = () => {
    setSelectedUserId('');
    setStartDate('');
    setEndDate('');
  };

  const openCreateForm = () => {
    setEditException(null);
    setFormData({
      user_id: selectedUserId || '',
      exception_date: '',
      exception_type: '',
      new_start_time: '',
      new_end_time: '',
      new_break_duration_minutes: 0,
      reason: '',
    });
    setFormOpen(true);
  };

  const openEditForm = (exception: ShiftException) => {
    setEditException(exception);
    setFormData({
      user_id: exception.user_id.toString(),
      exception_date: exception.exception_date.split('T')[0] || exception.exception_date,
      exception_type: exception.exception_type,
      new_start_time: exception.new_start_time || '',
      new_end_time: exception.new_end_time || '',
      new_break_duration_minutes: exception.new_break_duration_minutes || 0,
      reason: exception.reason || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.exception_date || !formData.exception_type) {
      toast.error('Date and type are required');
      return;
    }

    if (!editException && !formData.user_id) {
      toast.error('Please select a staff member');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        exception_date: formData.exception_date,
        exception_type: formData.exception_type,
        new_start_time: formData.new_start_time || undefined,
        new_end_time: formData.new_end_time || undefined,
        new_break_duration_minutes: formData.new_break_duration_minutes || undefined,
        reason: formData.reason || undefined,
      };

      if (editException) {
        await shiftApi.updateShiftException(editException.id, payload);
        toast.success('Shift exception updated');
      } else {
        await shiftApi.createShiftException({
          ...payload,
          user_id: parseInt(formData.user_id),
        });
        toast.success('Shift exception created');
      }

      setFormOpen(false);
      loadExceptions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save shift exception');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (exception: ShiftException) => {
    setDeleteTarget(exception);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await shiftApi.deleteShiftException(deleteTarget.id);
      toast.success('Shift exception deleted');
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      loadExceptions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete shift exception');
    }
  };

  const getStaffName = (userId: number) => {
    return staffList.find(s => s.user_id === userId)?.full_name || `User #${userId}`;
  };

  const getExceptionTypeLabel = (type: string) => {
    return EXCEPTION_TYPES.find(t => t.value === type)?.label || type.replace(/_/g, ' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time?: string | null) => {
    if (!time) return '--:--';
    return time.substring(0, 5);
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-600">You do not have permission to manage shift exceptions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/shifts')} className="p-1 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Shift Exceptions</h1>
            <p className="text-xs text-gray-600 mt-0.5">Manage all employee shift exceptions</p>
          </div>
          {canCreate && (
            <Button onClick={openCreateForm} size="sm" className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-white">
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          )}
        </div>

        <div className="px-4 pb-3 space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs text-gray-500 mb-1 block">Staff</Label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20"
              >
                <option value="">All Staff</option>
                {staffList.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[140px]">
              <Label className="text-xs text-gray-500 mb-1 block">From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="w-[140px]">
              <Label className="text-xs text-gray-500 mb-1 block">To</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <Button onClick={handleFilter} size="sm" variant="outline" className="h-9">
              <Filter className="w-4 h-4 mr-1" /> Filter
            </Button>
            {(selectedUserId || startDate || endDate) && (
              <Button onClick={handleClearFilters} size="sm" variant="ghost" className="h-9 text-xs">
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2B3C] mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Loading...</p>
            </CardContent>
          </Card>
        ) : exceptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">No exceptions found</p>
              <p className="text-xs text-gray-600">
                {selectedUserId || startDate || endDate
                  ? 'Try adjusting your filters'
                  : 'No shift exceptions have been created yet'}
              </p>
              {canCreate && !selectedUserId && !startDate && !endDate && (
                <Button onClick={openCreateForm} variant="link" className="mt-2 text-sm">
                  Create the first exception
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          exceptions.map((exception) => {
            const isExpired = exception.status === 'expired';
            const isRejected = exception.status === 'rejected';
            return (
              <Card key={exception.id} className={`hover:shadow-md transition-shadow ${isExpired || isRejected ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {exception.user_name || getStaffName(exception.user_id)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(exception.exception_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANTS[exception.status] || 'secondary'}>
                        {exception.status}
                      </Badge>
                      {canEdit && (
                        <button
                          onClick={() => openEditForm(exception)}
                          className="p-1.5 hover:bg-gray-100 rounded"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => openDeleteConfirm(exception)}
                          className="p-1.5 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Badge variant="outline" className="text-xs capitalize">
                        {getExceptionTypeLabel(exception.exception_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {formatTime(exception.new_start_time)} - {formatTime(exception.new_end_time)}
                      </span>
                      {exception.new_break_duration_minutes > 0 && (
                        <span className="text-xs text-gray-500">
                          ({exception.new_break_duration_minutes}min break)
                        </span>
                      )}
                    </div>
                    {exception.reason && (
                      <div className="text-xs text-gray-600 italic">
                        {exception.reason}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-2 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editException ? 'Edit Shift Exception' : 'Create Shift Exception'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editException
                ? 'Update the details of this shift exception.'
                : 'Create a new shift exception for a staff member.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {!editException && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Staff Member *
                </Label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20"
                >
                  <option value="">Select staff member</option>
                  {staffList.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.full_name} {s.department ? `(${s.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Exception Date *
              </Label>
              <Input
                type="date"
                value={formData.exception_date}
                onChange={(e) => setFormData({ ...formData, exception_date: e.target.value })}
                className="h-10"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Exception Type *
              </Label>
              <select
                value={formData.exception_type}
                onChange={(e) => setFormData({ ...formData, exception_type: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20"
              >
                <option value="">Select type</option>
                {EXCEPTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Start Time
                </Label>
                <Input
                  type="time"
                  value={formData.new_start_time}
                  onChange={(e) => setFormData({ ...formData, new_start_time: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  End Time
                </Label>
                <Input
                  type="time"
                  value={formData.new_end_time}
                  onChange={(e) => setFormData({ ...formData, new_end_time: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Break Duration (minutes)
              </Label>
              <Input
                type="number"
                min={0}
                max={180}
                value={formData.new_break_duration_minutes}
                onChange={(e) => setFormData({ ...formData, new_break_duration_minutes: parseInt(e.target.value) || 0 })}
                className="h-10"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Reason
              </Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                placeholder="Optional reason for this exception"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sticky bottom-0 bg-white pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-xs sm:text-sm"
            >
              {saving ? 'Saving...' : editException ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Shift Exception</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete this shift exception? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="py-3 space-y-2 text-sm text-gray-700">
              <p><strong>Staff:</strong> {deleteTarget.user_name || getStaffName(deleteTarget.user_id)}</p>
              <p><strong>Date:</strong> {formatDate(deleteTarget.exception_date)}</p>
              <p><strong>Type:</strong> {getExceptionTypeLabel(deleteTarget.exception_type)}</p>
            </div>
          )}

          <DialogFooter className="gap-2 sticky bottom-0 bg-white pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
