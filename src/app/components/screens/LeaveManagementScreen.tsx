import { useState, useEffect } from 'react';
import { Plus, Calendar, Briefcase, Heart, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { leaveApi, type LeaveType, type LeaveBalance } from '@/app/services/api';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';

export function LeaveManagementScreen() {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leave requests for the authenticated user
        const requestsResponse = await leaveApi.getMyLeaveRequests();
        setLeaveRequests(requestsResponse.data.leaveRequests);

        // Fetch leave types
        const typesResponse = await leaveApi.getLeaveTypes();
        setLeaveTypes(typesResponse.data.leaveTypes);

        // Fetch leave balances
        try {
          const balancesResponse = await leaveApi.getLeaveBalances();
          setLeaveBalances(balancesResponse.data.balances);
        } catch (balanceError) {
          console.log('Leave balances not available, calculating from leave types');
          // Fallback: calculate balances from leave types
          calculateLeaveBalancesFromTypes(typesResponse.data.leaveTypes, requestsResponse.data.leaveRequests);
        }
      } catch (error) {
        console.error('Failed to fetch leave data:', error);
        setLeaveRequests([]);
        setLeaveTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fallback: Calculate leave balances based on leave types and used days
  const calculateLeaveBalancesFromTypes = (types: LeaveType[], requests: any[]) => {
    const balances = types.map(type => {
      const usedDays = requests
        .filter(req =>
          req.leave_type_id === type.id &&
          req.status.toLowerCase() === 'approved' &&
          new Date(req.start_date).getFullYear() === new Date().getFullYear()
        )
        .reduce((sum, req) => sum + req.days_requested, 0);

      const pendingDays = requests
        .filter(req =>
          req.leave_type_id === type.id &&
          req.status.toLowerCase() === 'pending'
        )
        .reduce((sum, req) => sum + req.days_requested, 0);

      return {
        leave_type_id: type.id,
        leave_type_name: type.name,
        total_days: type.days_per_year,
        used_days: usedDays,
        remaining_days: type.days_per_year - usedDays,
        pending_days: pendingDays
      };
    });
    setLeaveBalances(balances);
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
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
    if (s === 'rejected') return 'bg-red-100 text-red-700 hover:bg-red-100';
    return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
  };

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500 text-sm">Manage your time-off requests</p>
        </div>
        <Button
          onClick={() => navigate('/new-leave')}
          className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Leave Balance Cards */}
      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading leave balances...</div>
      ) : leaveBalances.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {leaveBalances.map((balance) => (
            <Card
              key={balance.leave_type_id}
              className="shadow-md bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50]"
            >
              <CardContent className="p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  {getLeaveTypeIcon(balance.leave_type_name)}
                  <div className="text-xs text-white/70">{balance.leave_type_name}</div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{balance.remaining_days}</span>
                  <span className="text-sm text-white/70">/ {balance.total_days}</span>
                </div>
                <div className="text-xs text-white/70 mt-1">days remaining</div>
                {balance.pending_days > 0 && (
                  <div className="text-xs text-yellow-300 mt-1">
                    {balance.pending_days} days pending
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">No leave balances available</div>
      )}

      {/* Leave Requests */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading leave requests...</div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No leave requests yet</p>
              <Button
                variant="link"
                onClick={() => navigate('/new-leave')}
                className="text-[#1A2B3C]"
              >
                Submit your first request
              </Button>
            </div>
          ) : (
            leaveRequests.map((request) => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                leaveTypes={leaveTypes}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : (
            leaveRequests
              .filter((req) => req.status.toLowerCase() === 'pending')
              .map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  leaveTypes={leaveTypes}
                  getStatusColor={getStatusColor}
                />
              ))
          )}
          {leaveRequests.filter((req) => req.status.toLowerCase() === 'pending').length === 0 && (
            <div className="text-center py-8 text-gray-500">No pending requests</div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : (
            leaveRequests
              .filter((req) => req.status.toLowerCase() === 'approved')
              .map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  leaveTypes={leaveTypes}
                  getStatusColor={getStatusColor}
                />
              ))
          )}
          {leaveRequests.filter((req) => req.status.toLowerCase() === 'approved').length === 0 && (
            <div className="text-center py-8 text-gray-500">No approved requests</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/new-leave')}
        className="fixed bottom-20 right-6 w-14 h-14 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white rounded-full shadow-lg flex items-center justify-center z-10"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}

// Helper component for leave request cards
function LeaveRequestCard({ request, leaveTypes, getStatusColor }: {
  request: any;
  leaveTypes: LeaveType[];
  getStatusColor: (status: string) => string;
}) {
  const leaveType = leaveTypes.find(t => t.id === request.leave_type_id);
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900 mb-1">
              {leaveType?.name || 'Leave Request'}
            </div>
            <div className="text-sm text-gray-600">{request.reason}</div>
          </div>
          <Badge className={getStatusColor(request.status)}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(request.start_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}{' '}
              -{' '}
              {new Date(request.end_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <Badge variant="outline">{request.days_requested} day(s)</Badge>
        </div>
      </CardContent>
    </Card>
  );
}