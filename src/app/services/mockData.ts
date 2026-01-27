// Mock data for the Staff Portal

export interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: 'on-time' | 'late' | 'absent';
  totalHours: number;
}

export interface LeaveRequest {
  id: string;
  type: 'Annual Leave' | 'Sick Leave' | 'Casual Leave';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  days: number;
}

export interface Notification {
  id: string;
  type: 'shift' | 'leave' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
}

export interface LeaveBalance {
  type: 'Annual Leave' | 'Sick Leave' | 'Casual Leave';
  remaining: number;
  total: number;
}

export interface CompanyForm {
  id: string;
  name: string;
  category: 'HR Policies' | 'Expense Claims' | 'IT Support';
  url: string;
  icon: string;
}

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    date: '2026-01-20',
    clockIn: '09:00 AM',
    clockOut: null,
    status: 'on-time',
    totalHours: 0
  },
  {
    id: '2',
    date: '2026-01-17',
    clockIn: '08:55 AM',
    clockOut: '05:30 PM',
    status: 'on-time',
    totalHours: 8.5
  },
  {
    id: '3',
    date: '2026-01-16',
    clockIn: '09:15 AM',
    clockOut: '05:45 PM',
    status: 'late',
    totalHours: 8.5
  },
  {
    id: '4',
    date: '2026-01-15',
    clockIn: '08:50 AM',
    clockOut: '06:00 PM',
    status: 'on-time',
    totalHours: 9
  },
  {
    id: '5',
    date: '2026-01-14',
    clockIn: '09:05 AM',
    clockOut: '05:20 PM',
    status: 'on-time',
    totalHours: 8.25
  },
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: '1',
    type: 'Annual Leave',
    startDate: '2026-02-10',
    endDate: '2026-02-14',
    reason: 'Family vacation',
    status: 'Approved',
    days: 5
  },
  {
    id: '2',
    type: 'Sick Leave',
    startDate: '2026-01-22',
    endDate: '2026-01-22',
    reason: 'Medical appointment',
    status: 'Pending',
    days: 1
  },
  {
    id: '3',
    type: 'Casual Leave',
    startDate: '2025-12-20',
    endDate: '2025-12-20',
    reason: 'Personal matters',
    status: 'Approved',
    days: 1
  },
];

export const notifications: Notification[] = [
  {
    id: '1',
    type: 'shift',
    title: 'Shift Change Request',
    message: 'John Doe requested to swap shifts with you for Jan 25th',
    timestamp: '2026-01-20T10:30:00',
    read: false,
    actionable: true
  },
  {
    id: '2',
    type: 'leave',
    title: 'Leave Request Approved',
    message: 'Your annual leave request for Feb 10-14 has been approved',
    timestamp: '2026-01-19T14:20:00',
    read: false,
    actionable: false
  },
  {
    id: '3',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Jan 21st from 2 AM to 4 AM',
    timestamp: '2026-01-18T09:00:00',
    read: true,
    actionable: false
  },
];

export const leaveBalances: LeaveBalance[] = [
  {
    type: 'Annual Leave',
    remaining: 15,
    total: 20
  },
  {
    type: 'Sick Leave',
    remaining: 8,
    total: 10
  },
  {
    type: 'Casual Leave',
    remaining: 3,
    total: 5
  },
];

export const companyForms: CompanyForm[] = [
  {
    id: '1',
    name: 'Employee Handbook',
    category: 'HR Policies',
    url: '#',
    icon: 'book'
  },
  {
    id: '2',
    name: 'Expense Claim Form',
    category: 'Expense Claims',
    url: '#',
    icon: 'receipt'
  },
  {
    id: '3',
    name: 'IT Support Ticket',
    category: 'IT Support',
    url: '#',
    icon: 'laptop'
  },
  {
    id: '4',
    name: 'Performance Review',
    category: 'HR Policies',
    url: '#',
    icon: 'clipboard'
  },
  {
    id: '5',
    name: 'Travel Authorization',
    category: 'Expense Claims',
    url: '#',
    icon: 'plane'
  },
  {
    id: '6',
    name: 'Password Reset',
    category: 'IT Support',
    url: '#',
    icon: 'key'
  },
];
