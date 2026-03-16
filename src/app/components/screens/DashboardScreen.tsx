import { useState, useEffect } from 'react';
import { Clock, Calendar, Briefcase, MapPin, Navigation, Info, LocateFixed } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { attendanceApi, branchesApi } from '@/app/services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useAutoCheckout } from '@/app/hooks/useAutoCheckout';
import { calculateDistance } from '@/app/utils/geofencing'; // I'll create this util

export function DashboardScreen() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track today's attendance status
  const [todayRecord, setTodayRecord] = useState<any | null>(null);

  // Geofencing states
  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceFromBranch, setDistanceFromBranch] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState<boolean | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Derived states
  const hasCheckedInToday = todayRecord?.check_in_time !== null && todayRecord?.check_in_time !== undefined;
  const hasCheckedOutToday = todayRecord?.check_out_time !== null && todayRecord?.check_out_time !== undefined;
  const isClocked = hasCheckedInToday && !hasCheckedOutToday;

  // Auto-checkout hook - automatically checks out user after check-in
  useAutoCheckout({
    isEnabled: isClocked,
    onCheckoutComplete: () => {
      refreshAttendance();
    },
  });

  // Refresh attendance records
  const refreshAttendance = async () => {
    try {
      // Get today's date in local timezone
      const today = new Date().toLocaleDateString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }); // Returns YYYY-MM-DD in local timezone

      // Fetch records for the entire month to find today's record
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      console.log('=== Refreshing Attendance ===');
      console.log('Today (local):', today);
      console.log('Date range:', startDate, 'to', endDate);

      const response = await attendanceApi.getMyAttendance({
        startDate,
        endDate,
        limit: 100
      });
      const records = response.data?.attendance || [];

      // Sort records by date in descending order (most recent first)
      const sortedRecords = [...records].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setAttendanceRecords(sortedRecords);

      console.log('Total records fetched:', records.length);
      console.log('All record dates:', records.map((r: any) => ({
        id: r.id,
        date: r.date,
        dateOnly: r.date.split('T')[0],
        localDate: new Date(r.date).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        check_in_time: r.check_in_time,
        check_out_time: r.check_out_time,
        status: r.status
      })));

      // Find today's record - compare using ISO date string for consistency
      const todaysRecord = records.find((r: any) => {
        // Get the date portion from the API response (handles both ISO strings and date-only strings)
        let recordDate: string;
        if (r.date.includes('T')) {
          // ISO format: convert to local date
          recordDate = new Date(r.date).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        } else {
          // Already a date-only string
          recordDate = r.date;
        }
        const matches = recordDate === today;
        if (matches) {
          console.log('✓ Found today\'s record:', r);
        }
        return matches;
      });

      if (!todaysRecord) {
        console.log('✗ No record found for today');
      }
      console.log('Today\'s record:', todaysRecord);
      console.log('check_in_time:', todaysRecord?.check_in_time);
      console.log('check_out_time:', todaysRecord?.check_out_time);
      console.log('hasCheckedInToday:', todaysRecord?.check_in_time !== null && todaysRecord?.check_in_time !== undefined);
      console.log('hasCheckedOutToday:', todaysRecord?.check_out_time !== null && todaysRecord?.check_out_time !== undefined);

      setTodayRecord(todaysRecord || null);
    } catch (error: any) {
      console.error('Failed to fetch attendance records:', error);
      toast.error('Failed to load attendance data', {
        description: 'Please check your connection and refresh the page'
      });
      setAttendanceRecords([]);
      setTodayRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch branch info
  const fetchBranchInfo = async () => {
    if (!user?.branchId) return;
    try {
      const response = await branchesApi.getBranchById(user.branchId);
      if (response.success && response.data?.branch) {
        setBranchInfo(response.data.branch);
      }
    } catch (error) {
      console.error('Failed to fetch branch info:', error);
    }
  };

  // Watch location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCurrentLocation(coords);
        setLocationError(null);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Check GPS permissions';
        if (error.code === 1) errorMsg = 'GPS Permission Denied';
        else if (error.code === 2) errorMsg = 'GPS Signal Lost';
        else if (error.code === 3) errorMsg = 'GPS Timeout';
        
        setLocationError(errorMsg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    fetchBranchInfo();
    refreshAttendance();

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Update distance when location or branch changes
  useEffect(() => {
    if (currentLocation && branchInfo?.location_coordinates) {
      try {
        // Parse POINT(lng lat)
        const match = branchInfo.location_coordinates.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
        if (match) {
          const branchLng = parseFloat(match[1]);
          const branchLat = parseFloat(match[2]);
          const radius = branchInfo.location_radius_meters || 100;

          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            branchLat,
            branchLng
          );

          setDistanceFromBranch(distance);
          setIsWithinRange(distance <= radius);
        }
      } catch (err) {
        console.error('Error calculating distance:', err);
      }
    }
  }, [currentLocation, branchInfo]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser.');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleClockAction = async () => {
    try {
      setLoading(true);
      const coords = await getCurrentLocation();

      if (isClocked) {
        // Check out
        const checkOutData = {
          date: new Date().toISOString().split('T')[0],
          check_out_time: new Date().toTimeString().substring(0, 8),
          location_coordinates: coords
            ? `POINT(${coords.longitude} ${coords.latitude})`
            : null,
          location_address: coords ? 'Mobile GPS' : 'Office (Manual)'
        };
        const response = await attendanceApi.checkOut(checkOutData);

        toast.success(response?.message || 'Successfully clocked out', {
          description: `Successfully clocked out at ${new Date().toLocaleTimeString()}`
        });
      } else {
        // Check in
        const checkInData = {
          date: new Date().toISOString().split('T')[0],
          check_in_time: new Date().toTimeString().substring(0, 8),
          location_coordinates: coords
            ? `POINT(${coords.longitude} ${coords.latitude})`
            : null,
          location_address: coords ? 'Mobile GPS' : 'Office (Manual)',
          status: 'present'
        };
        const response = await attendanceApi.checkIn(checkInData);

        toast.success(response?.message || 'Successfully clocked in', {
          description: `Welcome back, ${user?.fullName}!`
        });

        // Immediately set today's record to prevent double check-in
        setTodayRecord({
          check_in_time: new Date().toTimeString().substring(0, 8),
          check_out_time: null,
        });
        setLoading(false);
        return; // Don't refresh, we already updated state
      }

      // Refresh attendance records after clock out
      await refreshAttendance();
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Attendance Not Marked', {
          description: error.response?.data?.message || 'You must be within the allowed radius of the branch. Please move closer and try again.',
          duration: 5000
        });
      } else {
        toast.error('Failed to update attendance', {
          description: error.response?.data?.message || 'Please try again'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.fullName}
          </h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <img src={user?.avatar} alt={user?.fullName} className="w-full h-full rounded-full" />
        </div>
      </div>

      {/* Punch Card */}
      <Card className="bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50] border-none shadow-xl">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
              <Clock className="w-4 h-4" />
              <span>Current Time & Date</span>
            </div>

            <div className="text-white">
              <div className="text-4xl font-bold mb-1">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {/* Geofencing Indicator */}
              <div className="flex flex-col items-center mt-4">
                <AnimatePresence mode="wait">
                  {locationError ? (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 text-xs"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>{locationError}</span>
                    </motion.div>
                  ) : isLocating ? (
                    <motion.div 
                      key="locating"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-100 text-xs"
                    >
                      <LocateFixed className="w-3.5 h-3.5 animate-pulse" />
                      <span>Locating...</span>
                    </motion.div>
                  ) : isWithinRange !== null ? (
                    <motion.div 
                      key={isWithinRange ? 'in-range' : 'out-range'}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className={`flex flex-col items-center gap-2 transition-colors`}
                    >
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                        isWithinRange 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                          : 'bg-amber-500/20 border-amber-500 text-amber-300'
                      }`}>
                        {isWithinRange ? <LocateFixed className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
                        <span className="font-semibold text-sm uppercase tracking-wider">
                          {isWithinRange ? 'In Range' : 'Out of Range'}
                        </span>
                      </div>
                      
                      {!isWithinRange && distanceFromBranch !== null && (
                        <p className="text-white/60 text-[10px] mt-1 italic">
                          You are approx. {Math.round(distanceFromBranch)}m away. Move closer to the branch.
                        </p>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="text-white/70 text-sm">
                {currentTime.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge
                variant={isClocked ? 'default' : 'secondary'}
                className={`${
                  isClocked
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                {isClocked ? '● On Shift' : '○ Off Duty'}
              </Badge>
            </div>

            {/* Clock In/Out Button */}
            <motion.div whileTap={hasCheckedInToday ? {} : { scale: 0.95 }}>
              <Button
                size="lg"
                className={`w-full h-16 text-lg font-semibold rounded-2xl ${
                  hasCheckedInToday
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isClocked
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                disabled={loading || hasCheckedInToday}
                onClick={hasCheckedInToday ? undefined : handleClockAction}
              >
                {loading
                  ? 'Processing...'
                  : hasCheckedInToday
                  ? hasCheckedOutToday
                    ? '✓ Checked Out'
                    : '✓ Checked In'
                  : isClocked
                  ? 'Clock Out'
                  : 'Clock In'}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Summary */}
      {/* <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#1A2B3C]">
              {attendanceRecords.length > 0 && attendanceRecords[0].hours_worked !== undefined
                ? `${attendanceRecords[0].hours_worked}h`
                : '-'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Hours Today</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#1A2B3C]">42h</div>
            <div className="text-xs text-gray-500 mt-1">This Week</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">Feb 10</div>
            <div className="text-xs text-gray-500 mt-1">Next Holiday</div>
          </CardContent>
        </Card>
      </div> */}

      {/* Recent Log */}
      <Card className="shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <Briefcase className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading attendance records...</div>
            ) : attendanceRecords.length > 0 ? (
              attendanceRecords.slice(0, 7).map((record) => {
                // Calculate hours worked if not provided
                let hoursWorked = record.hours_worked;
                if (hoursWorked === undefined || hoursWorked === null) {
                  // Try to calculate from check_in_time and check_out_time
                  if (record.check_in_time && record.check_out_time) {
                    const checkIn = new Date(`1970-01-01T${record.check_in_time}`);
                    const checkOut = new Date(`1970-01-01T${record.check_out_time}`);
                    hoursWorked = ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(1);
                  }
                }

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.check_in_time || '--:--'} - {record.check_out_time || '--:--'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {hoursWorked ? `${hoursWorked}h` : '-'}
                      </div>
                      <Badge
                        variant={record.status === 'present' ? 'default' : 'destructive'}
                        className={`text-xs ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {record.status === 'present' ? 'Present' : record.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No attendance records yet</p>
                <p className="text-xs mt-1">Your clock-in/out activity will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
