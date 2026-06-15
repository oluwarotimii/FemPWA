import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, Pencil, Trash2, AlertCircle, ArrowLeft, Filter, Users, Zap, CheckCircle } from 'lucide-react';
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
import { Checkbox } from '@/app/components/ui/checkbox';
import { ScrollArea } from '@/app/components/ui/scroll-area';
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
  const { hasPermission, user } = useAuth();

  const canManage = hasPermission('shift-exception:create')
    || hasPermission('shift-exception:read')
    || hasPermission('shift-exception:update')
    || hasPermission('shift-exception:delete');

  const canCreate = hasPermission('shift-exception:create');
  const canEdit = hasPermission('shift-exception:update');
  const canDelete = hasPermission('shift-exception:delete');

  const [exceptions, setExceptions] = useState<ShiftException[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editException, setEditException] = useState<ShiftException | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShiftException | null>(null);

  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [modalBranchFilter, setModalBranchFilter] = useState('');
  const [modalStaffSearch, setModalStaffSearch] = useState('');

  const [formData, setFormData] = useState({
    exception_date: '',
    exception_type: '',
    new_start_time: '',
    new_end_time: '',
    new_break_duration_minutes: 0,
    reason: '',
  });

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkDates, setBulkDates] = useState<Date[]>([]);
  const [bulkConfig, setBulkConfig] = useState({
    recurrence_pattern: 'weekly',
    recurrence_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

  const calculateBulkDates = () => {
    try {
      const dates: Date[] = [];
      const start = new Date(bulkConfig.start_date);
      const end = new Date(bulkConfig.end_date);
      const sel = bulkConfig.recurrence_days;
      const dayMap: Record<string, string> = {
        sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
        thu: 'thursday', fri: 'friday', sat: 'saturday'
      };
      let cur = new Date(start);
      while (cur <= end) {
        const shortDay = cur.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        const fullDay = dayMap[shortDay];
        if (bulkConfig.recurrence_pattern === 'daily' || sel.includes(fullDay)) {
          dates.push(new Date(cur));
        }
        cur.setDate(cur.getDate() + 1);
      }
      setBulkDates(dates);
    } catch {
      setBulkDates([]);
    }
  };

  useEffect(() => {
    if (isBulkMode) calculateBulkDates();
  }, [isBulkMode, bulkConfig.recurrence_pattern, bulkConfig.recurrence_days, bulkConfig.start_date, bulkConfig.end_date]);

  const toggleBulkDay = (day: string) => {
    setBulkConfig(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter(d => d !== day)
        : [...prev.recurrence_days, day]
    }));
  };

  const fetchStaff = async () => {
    try {
      const params: any = { limit: 500, status: 'active' };
      if (user?.branchId) params.branchId = user.branchId;
      const response = await staffApi.getAllStaff(params);
      const staff = response.data?.staff || response.data?.employees || [];
      setStaffList(staff.map((s: any) => ({
        user_id: s.user_id,
        full_name: s.full_name,
        email: s.email,
        employee_id: s.employee_id,
        designation: s.designation,
        department: s.department,
      })));
    } catch (error: any) {
      console.error('Failed to load staff list:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to load staff list';
      toast.error(msg);
    }
  };

  const fetchExceptions = async (overrides?: { userId?: string; startDate?: string; endDate?: string }) => {
    try {
      const params: any = {};
      const uid = overrides?.userId !== undefined ? overrides.userId : selectedUserId;
      const sd = overrides?.startDate !== undefined ? overrides.startDate : startDate;
      const ed = overrides?.endDate !== undefined ? overrides.endDate : endDate;
      if (uid) params.userId = parseInt(uid);
      if (sd) params.startDate = sd;
      if (ed) params.endDate = ed;
      const response = await shiftApi.getShiftExceptions(params);
      setExceptions(response.data.exceptions);
    } catch (error) {
      console.error('Failed to load exceptions:', error);
      toast.error('Failed to load shift exceptions');
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchExceptions().finally(() => setInitialLoading(false));
  }, []);

  const handleFilter = () => {
    fetchExceptions();
  };

  const handleClearFilters = () => {
    setSelectedUserId('');
    setStartDate('');
    setEndDate('');
    fetchExceptions({ userId: '', startDate: '', endDate: '' });
  };

  const openCreateForm = () => {
    setEditException(null);
    setSelectedStaffIds([]);
    setModalBranchFilter('');
    setModalStaffSearch('');
    setIsBulkMode(false);
    setBulkDates([]);
    setBulkConfig({
      recurrence_pattern: 'weekly',
      recurrence_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setFormData({
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
    setSelectedStaffIds([exception.user_id]);
    setFormData({
      exception_date: exception.exception_date.split('T')[0] || exception.exception_date,
      exception_type: exception.exception_type,
      new_start_time: exception.new_start_time || '',
      new_end_time: exception.new_end_time || '',
      new_break_duration_minutes: exception.new_break_duration_minutes || 0,
      reason: exception.reason || '',
    });
    setFormOpen(true);
  };

  const toggleStaff = (userId: number) => {
    setSelectedStaffIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredModalStaff = staffList.filter(s => {
    if (modalBranchFilter && s.department !== modalBranchFilter) return false;
    if (modalStaffSearch && !s.full_name.toLowerCase().includes(modalStaffSearch.toLowerCase())) return false;
    return true;
  });

  const departmentOptions = [...new Set(staffList.map(s => s.department).filter(Boolean))] as string[];

  const handleSave = async () => {
    if (!formData.exception_type) {
      toast.error('Exception type is required');
      return;
    }

    if (!editException && selectedStaffIds.length === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    if (editException && selectedStaffIds.length === 0) {
      toast.error('Staff member is required');
      return;
    }

    const datesToCreate = editException
      ? [formData.exception_date]
      : isBulkMode
        ? bulkDates.map(d => d.toISOString().split('T')[0])
        : [formData.exception_date];

    if (!editException && datesToCreate.length === 0) {
      toast.error(isBulkMode ? 'No dates match the selected pattern' : 'Exception date is required');
      return;
    }

    if (!editException && !isBulkMode && !formData.exception_date) {
      toast.error('Exception date is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        exception_type: formData.exception_type,
        new_start_time: formData.new_start_time || undefined,
        new_end_time: formData.new_end_time || undefined,
        new_break_duration_minutes: formData.new_break_duration_minutes || undefined,
        reason: formData.reason || undefined,
      };

      if (editException) {
        await shiftApi.updateShiftException(editException.id, { ...payload, exception_date: formData.exception_date });
        toast.success('Shift exception updated');
      } else {
        let created = 0;
        const total = selectedStaffIds.length * datesToCreate.length;
        for (const uid of selectedStaffIds) {
          for (const dateStr of datesToCreate) {
            try {
              await shiftApi.createShiftException({ ...payload, user_id: uid, exception_date: dateStr });
              created++;
            } catch (e: any) {
              toast.error(`Failed for user #${uid} on ${dateStr}: ${e.response?.data?.message || e.message}`);
            }
          }
        }
        toast.success(`${created} of ${total} exceptions created`);
      }

      setFormOpen(false);
      fetchExceptions();
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
      fetchExceptions();
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
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
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
                  <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div className="w-[140px]">
              <Label className="text-xs text-gray-500 mb-1 block">From</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="w-[140px]">
              <Label className="text-xs text-gray-500 mb-1 block">To</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-sm" />
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
        {initialLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2B3C] mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Loading...</p>
            </CardContent>
          </Card>
        ) : (() => {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const upcomingExceptions = exceptions.filter(ex => new Date(ex.exception_date) >= today);
          return upcomingExceptions.length === 0 ? (
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
          upcomingExceptions.map((exception) => {
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
                        <p className="text-xs text-gray-500">{formatDate(exception.exception_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANTS[exception.status] || 'secondary'}>{exception.status}</Badge>
                      {canEdit && (
                        <button onClick={() => openEditForm(exception)} className="p-1.5 hover:bg-gray-100 rounded">
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => openDeleteConfirm(exception)} className="p-1.5 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {getExceptionTypeLabel(exception.exception_type)}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {formatTime(exception.new_start_time)} - {formatTime(exception.new_end_time)}
                      </span>
                      {exception.new_break_duration_minutes > 0 && (
                        <span className="text-xs text-gray-500">({exception.new_break_duration_minutes}min break)</span>
                      )}
                    </div>
                    {exception.reason && <div className="text-xs text-gray-600 italic">{exception.reason}</div>}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )})()}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-2 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editException ? 'Edit Shift Exception' : 'Create Shift Exception(s)'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editException
                ? 'Update the details of this shift exception.'
                : isBulkMode
                  ? 'Create exceptions across multiple dates for selected staff members.'
                  : 'Select staff members and set the exception details.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Staff selection */}
            {!editException && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Staff Members * ({selectedStaffIds.length} selected)
                </Label>

                {/* Branch filter + search */}
                <div className="flex gap-2 mb-2">
                  {departmentOptions.length > 0 && (
                    <select
                      value={modalBranchFilter}
                      onChange={(e) => setModalBranchFilter(e.target.value)}
                      className="flex-1 h-9 px-2 rounded-md border border-gray-300 text-xs bg-white"
                    >
                      <option value="">All Departments</option>
                      {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )}
                  <Input
                    placeholder="Search staff..."
                    value={modalStaffSearch}
                    onChange={(e) => setModalStaffSearch(e.target.value)}
                    className="flex-1 h-9 text-xs"
                  />
                </div>

                <ScrollArea className="h-48 rounded-md border border-gray-200 p-2">
                  {filteredModalStaff.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">No staff found</p>
                  ) : (
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-600 border-b border-gray-100 mb-1">
                        <Checkbox
                          checked={filteredModalStaff.every(s => selectedStaffIds.includes(s.user_id))}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedStaffIds(filteredModalStaff.map(s => s.user_id));
                            else setSelectedStaffIds(prev => prev.filter(id => !filteredModalStaff.some(s => s.user_id === id)));
                          }}
                        />
                        <span>Select All ({filteredModalStaff.length})</span>
                      </label>
                      {filteredModalStaff.map((s) => (
                        <label
                          key={s.user_id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={selectedStaffIds.includes(s.user_id)}
                            onCheckedChange={() => toggleStaff(s.user_id)}
                          />
                          <span className="flex-1">{s.full_name}</span>
                          {s.department && <span className="text-xs text-gray-400">{s.department}</span>}
                          {s.employee_id && <span className="text-xs text-gray-400">#{s.employee_id}</span>}
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {selectedStaffIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedStaffIds.map(id => {
                      const s = staffList.find(st => st.user_id === id);
                      return s ? (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {s.full_name}
                          <button className="ml-1 hover:text-red-500" onClick={() => toggleStaff(id)}>×</button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bulk mode toggle */}
            {!editException && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Bulk Exception Creation</p>
                    <p className="text-xs text-gray-500">{isBulkMode ? 'Create exceptions for multiple dates at once' : 'Create exception for a single date'}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only" checked={isBulkMode}
                    onChange={e => setIsBulkMode(e.target.checked)} />
                  <div className={`w-10 h-5.5 rounded-full transition-colors ${isBulkMode ? 'bg-purple-600' : 'bg-gray-300'}`}>
                    <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${isBulkMode ? 'translate-x-[18px]' : 'translate-x-0.5'}`} style={{ marginTop: '2px', width: '18px', height: '18px' }} />
                  </div>
                </label>
              </div>
            )}

            {/* Date / Bulk config */}
            {!editException && isBulkMode ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <Label className="text-sm font-medium text-gray-700">Recurrence Pattern</Label>
                <select
                  value={bulkConfig.recurrence_pattern}
                  onChange={e => {
                    const p = e.target.value as 'daily' | 'weekly';
                    setBulkConfig(prev => ({
                      ...prev,
                      recurrence_pattern: p,
                      recurrence_days: p === 'daily' ? daysOfWeek : prev.recurrence_days
                    }));
                  }}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm bg-white"
                >
                  <option value="daily">Daily (Every day)</option>
                  <option value="weekly">Weekly (Select specific days)</option>
                </select>

                {bulkConfig.recurrence_pattern === 'weekly' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Select Days</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {daysOfWeek.map(d => (
                        <button key={d} type="button"
                          onClick={() => toggleBulkDay(d)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            bulkConfig.recurrence_days.includes(d)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {dayLabels[d]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Start Date</Label>
                    <Input type="date" value={bulkConfig.start_date}
                      onChange={e => setBulkConfig({ ...bulkConfig, start_date: e.target.value })}
                      className="h-10" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">End Date</Label>
                    <Input type="date" value={bulkConfig.end_date}
                      onChange={e => setBulkConfig({ ...bulkConfig, end_date: e.target.value })}
                      className="h-10" />
                  </div>
                </div>

                {bulkDates.length > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-800">
                      Will create {bulkDates.length} date{bulkDates.length !== 1 ? 's' : ''} per staff member
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Exception Date *</Label>
                <Input
                  type="date"
                  value={formData.exception_date}
                  onChange={(e) => setFormData({ ...formData, exception_date: e.target.value })}
                  className="h-10"
                />
              </div>
            )}

            {/* Type */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Exception Type *</Label>
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

            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Start Time</Label>
                <Input type="time" value={formData.new_start_time}
                  onChange={(e) => setFormData({ ...formData, new_start_time: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">End Time</Label>
                <Input type="time" value={formData.new_end_time}
                  onChange={(e) => setFormData({ ...formData, new_end_time: e.target.value })} className="h-10" />
              </div>
            </div>

            {/* Break */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Break Duration (minutes)</Label>
              <Input type="number" min={0} max={180} value={formData.new_break_duration_minutes}
                onChange={(e) => setFormData({ ...formData, new_break_duration_minutes: parseInt(e.target.value) || 0 })} className="h-10" />
            </div>

            {/* Reason */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Reason</Label>
              <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3} placeholder="Optional reason for this exception" />
            </div>
          </div>

          <DialogFooter className="gap-2 sticky bottom-0 bg-white pt-3 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}
              className="text-xs sm:text-sm">Cancel</Button>
            <Button onClick={handleSave} disabled={saving}
              className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-xs sm:text-sm">
              {saving ? 'Saving...' : editException ? 'Update' : isBulkMode
                ? `Create (${selectedStaffIds.length} staff × ${bulkDates.length} dates)`
                : `Create (${selectedStaffIds.length} staff)`
              }
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
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}
              className="text-xs sm:text-sm">Cancel</Button>
            <Button onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
