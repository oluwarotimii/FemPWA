import { useState, useEffect } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { leaveApi } from '@/app/services/api';
import { motion } from 'motion/react';

export function LeaveManagementScreen() {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leave requests for the authenticated user
        const requestsResponse = await leaveApi.getMyLeaveRequests();
        setLeaveRequests(requestsResponse.data.leaveRequests);

        // Fetch leave types to show balances
        const typesResponse = await leaveApi.getLeaveTypes();
        setLeaveTypes(typesResponse.data.leaveTypes);
      } catch (error) {
        console.error('Failed to fetch leave data:', error);
        // No fallback to mock data - just keep the empty arrays
        setLeaveRequests([]);
        setLeaveTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate leave balances based on leave types and used days
  const calculateLeaveBalances = () => {
    return leaveTypes.map(type => {
      // Count approved leave days for this type
      const usedDays = leaveRequests
        .filter(req => 
          req.leave_type_id === type.id && 
          req.status.toLowerCase() === 'approved' &&
          new Date(req.start_date).getFullYear() === new Date().getFullYear()
        )
        .reduce((sum, req) => sum + req.days_requested, 0);
      
      return {
        type: type.name,
        total: type.days_per_year,
        remaining: type.days_per_year - usedDays
      };
    });
  };

  const leaveBalances = calculateLeaveBalances();

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-gray-500 text-sm">Manage your time-off requests</p>
      </div>

      {/* Leave Balance Cards */}
      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading leave balances...</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {leaveBalances.map((balance) => (
            <Card
              key={balance.type}
              className="min-w-[160px] shadow-md bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50]"
            >
              <CardContent className="p-4 text-white">
                <div className="text-xs text-white/70 mb-2">{balance.type}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{balance.remaining}</span>
                  <span className="text-sm text-white/70">/ {balance.total}</span>
                </div>
                <div className="text-xs text-white/70 mt-1">days remaining</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Leave Requests */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading leave requests...</div>
          ) : (
            leaveRequests
              .filter((req) => req.status.toLowerCase() === 'pending' || new Date(req.start_date) > new Date())
              .map((request) => (
                <Card key={request.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {leaveTypes.find(t => t.id === request.leave_type_id)?.name || 'Leave Request'}
                        </div>
                        <div className="text-sm text-gray-600">{request.reason}</div>
                      </div>
                      <Badge
                        className={`${
                          request.status.toLowerCase() === 'approved'
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : request.status.toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                            : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(request.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}{' '}
                          -{' '}
                          {new Date(request.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <Badge variant="outline">{request.days_requested} day(s)</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading leave requests...</div>
          ) : (
            leaveRequests
              .filter((req) => new Date(req.end_date) < new Date() && req.status.toLowerCase() !== 'pending')
              .map((request) => (
                <Card key={request.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {leaveTypes.find(t => t.id === request.leave_type_id)?.name || 'Leave Request'}
                        </div>
                        <div className="text-sm text-gray-600">{request.reason}</div>
                      </div>
                      <Badge
                        className={`${
                          request.status.toLowerCase() === 'approved'
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(request.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}{' '}
                          -{' '}
                          {new Date(request.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <Badge variant="outline">{request.days_requested} day(s)</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        {/* Floating Action Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/new-leave')}
          className="fixed bottom-20 right-6 w-14 h-14 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white rounded-full shadow-lg flex items-center justify-center z-10"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </Tabs>
    </div>
  );
}