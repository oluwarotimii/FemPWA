import { useState, useEffect, useCallback } from 'react';
import { Clock, Calendar, Briefcase, Navigation, Info, LocateFixed, Loader2, Timer } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { attendanceApi, shiftApi, syncApi } from '@/app/services/api';
import { offlineQueue } from '@/app/services/offline/checkInQueue';
import { dataStore } from '@/app/services/offline/dataStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useAutoCheckout } from '@/app/hooks/useAutoCheckout';
import { calculateDistance } from '@/app/utils/geofencing';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const GPS_TIMEOUT = 8000;
const GPS_MAX_AGE = 30000;
const CACHE_KEY_LOCATIONS = 'cached_assigned_locations';
const CACHE_KEY_BRANCH = 'cached_branch_info';
const CACHE_TTL = 5 * 60 * 1000;

const getGeolocationErrorMessage = (error: { code?: number } | null) => {
  if (!error) return 'Unable to get your location. Please try again.';

  if (error.code === 1) {
    return 'Location permission denied. Please allow location access in your browser or app settings and try again.';
  }

  if (error.code === 2) {
    return 'Unable to determine your location right now. Please move to an area with GPS signal and try again.';
  }

  if (error.code === 3) {
    return 'Location request timed out. Please try again.';
  }

  return 'Unable to get your location. Please try again.';
};

const isLocationPermissionError = (value: unknown) => {
  if (typeof value !== 'string') return false;
  const normalized = value.toLowerCase();
  return normalized.includes('permission denied') || normalized.includes('location permission required');
};

export function DashboardScreen() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGeoDetails, setShowGeoDetails] = useState(false);
  const debugEnabled = import.meta.env.DEV || localStorage.getItem('attendance_debug') === '1';

  // Track today's attendance status
  const [todayRecord, setTodayRecord] = useState<any | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<any | null>(null);
  const [myExceptions, setMyExceptions] = useState<any[]>([]);

  // Geofencing states
  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [assignedLocations, setAssignedLocations] = useState<any[]>([]);
  const [nearestAssignedLocation, setNearestAssignedLocation] = useState<any | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceFromAssignedLocation, setDistanceFromAssignedLocation] = useState<number | null>(null);
  const [assignedLocationRadius, setAssignedLocationRadius] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState<boolean | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);
  const [gpsTimestamp, setGpsTimestamp] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  // Derived states
  const hasCheckedInToday = todayRecord?.check_in_time !== null && todayRecord?.check_in_time !== undefined;
  const hasCheckedOutToday = todayRecord?.check_out_time !== null && todayRecord?.check_out_time !== undefined;
  const isClocked = hasCheckedInToday && !hasCheckedOutToday;
  const isOnLeaveToday = todayRecord?.status === 'leave' || todaySchedule?.schedule_type === 'leave';
  const isHolidayToday = todayRecord?.status === 'holiday' || todaySchedule?.schedule_type === 'holiday';

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
      // Standardize "Today" string
      const todayStr = format(new Date(), "yyyy-MM-dd");

      const now = new Date();
      const startDate = format(startOfMonth(now), "yyyy-MM-dd");
      const endDate = format(endOfMonth(now), "yyyy-MM-dd");
      
      console.log('=== Refreshing Attendance ===');
      console.log('Today:', todayStr);
      console.log('Date range:', startDate, 'to', endDate);

      const response = await attendanceApi.getMyAttendance({
        startDate,
        endDate,
        limit: 100
      });
      const records = response.data?.attendance || [];

      // Fix: Deduplicate records by date using local date to avoid timezone mismatch
      const uniqueRecords = records.reduce((acc: any[], current: any) => {
        const d = new Date(current.date);
        const dateStr = format(d, "yyyy-MM-dd");
        const existing = acc.find((r: any) => {
          const ed = new Date(r.date);
          return format(ed, "yyyy-MM-dd") === dateStr;
        });
        if (!existing) {
          acc.push(current);
        } else if (current.status === 'present' || current.status === 'late') {
          const index = acc.indexOf(existing);
          acc[index] = current;
        }
        return acc;
      }, []);

      const sortedRecords = [...uniqueRecords].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setAttendanceRecords(sortedRecords);

      console.log('Total records fetched:', records.length);
      console.log('Unique records:', uniqueRecords.length);
      
      // Fix: Robust "Today" record finding (local date comparison)
      const todaysRecord = uniqueRecords.find((r: any) => {
        const rd = new Date(r.date);
        return format(rd, "yyyy-MM-dd") === todayStr;
      });

      if (!todaysRecord) {
        console.log('✗ No record found for today');
      } else {
        console.log('✓ Found today\'s record:', todaysRecord);
      }
      
      setTodayRecord(todaysRecord || null);

      // Fetch today's schedule and exceptions in parallel
      const [scheduleRes, exceptionsRes] = await Promise.allSettled([
        shiftApi.getMyTodayShift(),
        shiftApi.getMyShiftExceptions()
      ]);

      if (scheduleRes.status === 'fulfilled' && scheduleRes.value.success) {
        setTodaySchedule(scheduleRes.value.data.schedule);
      } else if (scheduleRes.status === 'rejected') {
        console.error('Failed to fetch today schedule:', scheduleRes.reason);
      }

      if (exceptionsRes.status === 'fulfilled' && exceptionsRes.value.success) {
        setMyExceptions(exceptionsRes.value.data.exceptions || []);
      } else if (exceptionsRes.status === 'rejected') {
        console.error('Failed to fetch exceptions:', exceptionsRes.reason);
      }
    } catch (error: any) {
      console.error('Failed to fetch attendance records:', error);
      
      // Better error reporting for Network Errors
      const isNetworkError = error.message === 'Network Error' || !error.response;
      const errorTitle = isNetworkError ? 'Connection Error' : 'Failed to load attendance data';
      const errorDesc = isNetworkError 
        ? 'Could not connect to the server. Please check your internet connection.' 
        : 'Please refresh the page or try again later.';

      toast.error(errorTitle, {
        description: errorDesc
      });
      setAttendanceRecords([]);
      setTodayRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch branch attendance settings (staff-safe; does not require branches:read)
  const fetchBranchInfo = async () => {
    try {
      if (debugEnabled) {
        console.log('[Attendance][Branch] Fetching branch settings via /attendance/settings...');
      }
      const res = await attendanceApi.getMyAttendanceSettings();
      const settings = res.data?.settings;
      if (settings) {
        setBranchInfo(settings);
        setCache(CACHE_KEY_BRANCH, settings);
        if (debugEnabled) {
          console.log('[Attendance][Branch] Branch settings loaded:', settings);
        }
      }
    } catch (error: any) {
      console.error('[Attendance][Branch] Failed to fetch /attendance/settings:', {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        data: error?.response?.data
      });
      // Non-fatal: assigned location geofencing still works.
    }
  };

  const fetchMyAssignedLocations = async () => {
    try {
      const res = await attendanceApi.getMyLocations();
      const locations = res.data?.locations || [];
      setAssignedLocations(locations);
      setCache(CACHE_KEY_LOCATIONS, locations);
      if (!locations || locations.length === 0) {
        setAssignmentError('No attendance location assigned. Contact HR to assign your check-in location.');
      } else {
        setAssignmentError(null);
      }
      if (debugEnabled) {
        console.log('[Attendance][Geo] Assigned locations fetched:', locations);
      }
    } catch (error) {
      // If this fails, don't block the rest of the dashboard.
      console.error('Failed to fetch assigned attendance locations:', error);
    }
  };

  // Watch location with standard accuracy (GPS works without internet)
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    let watchId: number | null = null;

    const onPositionSuccess = (position: GeolocationPosition) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      setCurrentLocation(coords);
      setGpsAccuracyMeters(Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null);
      setGpsTimestamp(typeof position.timestamp === 'number' ? position.timestamp : Date.now());
      setLocationError(null);
      setLocationPermissionDenied(false);
      setIsLocating(false);
      if (debugEnabled) {
        console.log('[Attendance][Geo] watchPosition update:', {
          coords,
          accuracy_m: position.coords.accuracy,
          timestamp: position.timestamp
        });
      }
    };

    const startWatching = () => {
      setIsLocating(true);
      watchId = navigator.geolocation.watchPosition(
        onPositionSuccess,
        (error) => {
          console.error('Geolocation error:', error);
          setLocationPermissionDenied(error.code === 1);
          setLocationError(getGeolocationErrorMessage(error));
          setIsLocating(false);
        },
        { enableHighAccuracy: false, timeout: GPS_TIMEOUT, maximumAge: GPS_MAX_AGE }
      );
    };

    startWatching();

    // Load cached data from IndexedDB + sessionStorage, then refresh from server
    loadCachedDashboardData();
    Promise.allSettled([
      fetchBranchInfo(),
      fetchMyAssignedLocations(),
      refreshAttendance(),
      // Sync: fetch all dashboard data in one call and cache it
      syncApi.getDashboardData().then(res => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.assignedLocations?.length) setAssignedLocations(d.assignedLocations);
          if (d.branchInfo) setBranchInfo(d.branchInfo);
          if (d.todayAttendance) setTodayRecord(d.todayAttendance);
          if (d.monthAttendance?.length) setAttendanceRecords(d.monthAttendance);
          if (d.todaySchedule) setTodaySchedule(d.todaySchedule);
          if (d.shiftExceptions?.length) setMyExceptions(d.shiftExceptions);
          updateDataStoreFromSync(d);
        }
      }).catch(() => {/* non-fatal; fallback to individual API calls */})
    ]);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const parsePoint = (value: string | null | undefined): { lat: number; lng: number } | null => {
    if (!value) return null;
    const match = value.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
    if (!match) return null;
    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  // Update distance when location or assignments change
  useEffect(() => {
    if (currentLocation && assignedLocations.length > 0) {
      try {
        let best: { location: any; distance: number; radius: number } | null = null;
        for (const loc of assignedLocations) {
          const point = parsePoint(loc.location_coordinates);
          if (!point) continue;
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            point.lat,
            point.lng
          );
          const radius = Number(loc.location_radius_meters) || 100;
          if (!best || distance < best.distance) {
            best = { location: loc, distance, radius };
          }
        }

        if (best) {
          setNearestAssignedLocation(best.location);
          setDistanceFromAssignedLocation(best.distance);
          setAssignedLocationRadius(best.radius);
          setIsWithinRange(best.distance <= best.radius);
          if (debugEnabled) {
            console.log('[Attendance][Geo] Compare user vs assigned locations:', {
              userCoords: currentLocation,
              assignedCount: assignedLocations.length,
              nearest: {
                id: best.location?.id,
                name: best.location?.name,
                radius_m: best.radius,
                distance_m: best.distance,
                within: best.distance <= best.radius
              },
              accuracy_m: gpsAccuracyMeters
            });
          }
        } else {
          setNearestAssignedLocation(null);
          setDistanceFromAssignedLocation(null);
          setAssignedLocationRadius(null);
          setIsWithinRange(null);
        }
      } catch (err) {
        console.error('Error calculating distance:', err);
      }
    } else if (assignedLocations.length === 0) {
      setNearestAssignedLocation(null);
      setDistanceFromAssignedLocation(null);
      setAssignedLocationRadius(null);
      setIsWithinRange(null);
    }
  }, [currentLocation, assignedLocations, gpsAccuracyMeters, debugEnabled]);

  // Track online/offline status and refresh pending count
  const refreshPendingCount = useCallback(async () => {
    const count = await offlineQueue.getCount();
    setPendingCount(count);
  }, []);

  const syncPendingItems = useCallback(async () => {
    const items = await offlineQueue.getAll();
    for (const item of items) {
      try {
        if (item.type === 'check-in') {
          await attendanceApi.checkIn(item.payload);
        } else {
          await attendanceApi.checkOut(item.payload);
        }
        if (item.id !== undefined) {
          await offlineQueue.remove(item.id);
        }
        toast.success(`${item.type === 'check-in' ? 'Check-in' : 'Check-out'} synced`);
      } catch {
        if (item.id !== undefined) {
          await offlineQueue.incrementRetry(item.id);
        }
      }
    }
    await refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingItems();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    refreshPendingCount();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingItems, refreshPendingCount]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getCache = (key: string) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > CACHE_TTL) {
        sessionStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  const setCache = (key: string, data: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
      // sessionStorage full — ignore
    }
  };

  const loadCachedDashboardData = async () => {
    // Try IndexedDB first (persistent across sessions)
    const [cachedLocations, cachedBranch, cachedAttendance, cachedSchedule, cachedExceptions] = await Promise.all([
      dataStore.get<any[]>('locations'),
      dataStore.get<any>('branchInfo'),
      dataStore.get<any[]>('attendance'),
      dataStore.get<any>('todaySchedule'),
      dataStore.get<any[]>('shiftExceptions'),
    ]);
    if (cachedLocations?.data) setAssignedLocations(cachedLocations.data);
    if (cachedBranch?.data) setBranchInfo(cachedBranch.data);
    if (cachedAttendance?.data) setAttendanceRecords(cachedAttendance.data);
    if (cachedSchedule?.data) setTodaySchedule(cachedSchedule.data);
    if (cachedExceptions?.data) setMyExceptions(cachedExceptions.data);

    // Then try sessionStorage (faster on tab switch, may have newer data)
    const ssLocations = getCache(CACHE_KEY_LOCATIONS);
    if (ssLocations) setAssignedLocations(ssLocations);
    const ssBranch = getCache(CACHE_KEY_BRANCH);
    if (ssBranch) setBranchInfo(ssBranch);
  };

  const updateDataStoreFromSync = async (data: any) => {
    if (!data) return;
    const promises: Promise<any>[] = [];
    if (data.assignedLocations) promises.push(dataStore.put('locations', data.assignedLocations));
    if (data.branchInfo) promises.push(dataStore.put('branchInfo', data.branchInfo));
    if (data.monthAttendance) promises.push(dataStore.put('attendance', data.monthAttendance));
    if (data.todaySchedule) promises.push(dataStore.put('todaySchedule', data.todaySchedule));
    if (data.shiftExceptions) promises.push(dataStore.put('shiftExceptions', data.shiftExceptions));
    await Promise.allSettled(promises);
    // Also update sessionStorage for fast tab-switch
    if (data.assignedLocations) setCache(CACHE_KEY_LOCATIONS, data.assignedLocations);
    if (data.branchInfo) setCache(CACHE_KEY_BRANCH, data.branchInfo);
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    // If the watcher already has a fresh location, use it instantly
    if (currentLocation && !locationError) {
      return Promise.resolve(currentLocation);
    }

    if (!navigator.geolocation) {
      return Promise.resolve(null);
    }

    // Quick single-shot as fallback if watcher hasn't fired yet
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCurrentLocation(coords);
          resolve(coords);
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: GPS_TIMEOUT, maximumAge: GPS_MAX_AGE }
      );
    });
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationPermissionDenied(false);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsAccuracyMeters(position.coords.accuracy);
        setGpsTimestamp(position.timestamp);
        setLocationError(null);
        setLocationPermissionDenied(false);
        setIsLocating(false);
        toast.success('Location access granted!');
      },
      (error) => {
        setLocationPermissionDenied(error.code === 1);
        setLocationError(getGeolocationErrorMessage(error));
        setIsLocating(false);
        if (error.code === 1) {
          toast.error('Location permission denied', {
            description: 'Please enable location access in your browser or device settings and try again.',
            duration: 7000
          });
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleClockAction = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const coords = await getCurrentLocation();

      if (!coords) {
        if (locationPermissionDenied || isLocationPermissionError(locationError)) {
          toast.error('Location Permission Required', {
            description: locationError || 'Please allow location access and try again.',
            duration: 7000
          });
          return;
        }
        toast.error('Location Error', {
          description: locationError || 'Unable to get your location. Please enable GPS and try again.',
          duration: 6000
        });
        return;
      }

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const checkInTime = new Date().toTimeString().substring(0, 8);
      const locationStr = coords ? `POINT(${coords.longitude} ${coords.latitude})` : null;

      // If offline, queue immediately instead of failing
      if (!isOnline) {
        if (isClocked) {
          await offlineQueue.add({
            type: 'check-out',
            payload: { date: todayStr, check_out_time: checkInTime, location_coordinates: locationStr, location_address: 'Mobile GPS' },
            createdAt: new Date().toISOString()
          });
        } else {
          await offlineQueue.add({
            type: 'check-in',
            payload: { date: todayStr, check_in_time: checkInTime, location_coordinates: locationStr, location_address: 'Mobile GPS', status: 'present' },
            createdAt: new Date().toISOString()
          });
        }
        await refreshPendingCount();
        toast.success('Saved offline', {
          description: 'Your attendance will sync when you reconnect.',
          duration: 5000
        });
        return;
      }

      if (isClocked) {
        const response = await attendanceApi.checkOut({
          date: todayStr,
          check_out_time: checkInTime,
          location_coordinates: locationStr,
          location_address: 'Mobile GPS'
        });
        toast.success(response?.message || 'Successfully clocked out', {
          description: `Clocked out at ${new Date().toLocaleTimeString()}`
        });
        await refreshAttendance();
      } else {
        const response = await attendanceApi.checkIn({
          date: todayStr,
          check_in_time: checkInTime,
          location_coordinates: locationStr,
          location_address: 'Mobile GPS',
          status: 'present'
        });
        toast.success(response?.message || 'Successfully clocked in', {
          description: `Welcome back, ${user?.fullName}!`
        });
        if (response?.data?.attendance) {
          setTodayRecord(response.data.attendance);
        } else {
          await refreshAttendance();
        }
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || error?.message || '';

      if (status === 403) {
        if (msg.toLowerCase().includes('lock')) {
          toast.error('Attendance Locked', { description: msg, duration: 6000 });
        } else if (msg.toLowerCase().includes('location')) {
          toast.error('Location Error', { description: msg, duration: 7000 });
        } else {
          toast.error('Access Denied', { description: msg || 'Permission denied.', duration: 5000 });
        }
      } else if (status === 409) {
        toast.error('Already Checked In', { description: 'You have already checked in today.', duration: 5000 });
      } else if (status === 400) {
        toast.error('Invalid Request', { description: msg || 'Please try again.', duration: 5000 });
      } else if (status === 404) {
        toast.error('Not Found', { description: msg || 'Record not found.', duration: 5000 });
      } else if (!status || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        toast.error('Network Error', {
          description: 'Could not reach the server. Your connection may be unstable.',
          duration: 6000
        });
      } else {
        toast.error('Check-in Failed', { description: msg || 'An unexpected error occurred.', duration: 5000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="p-4 pt-7 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Connectivity Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 text-center text-[10px] font-medium py-0.5 transition-colors flex items-center justify-center gap-2 ${
          isOnline
            ? pendingCount > 0
              ? 'bg-amber-500/20 text-amber-700'
              : 'bg-green-500/10 text-green-700'
            : 'bg-red-500/20 text-red-700'
        }`}
      >
        {isOnline
          ? pendingCount > 0
            ? `${pendingCount} pending — syncing...`
            : 'Connected'
          : `Offline — ${pendingCount > 0 ? `${pendingCount} pending` : 'changes will sync when reconnected'}`
        }
      </div>
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
          <img
            src={user?.avatar
              ? (user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_BASE_URL || 'https://hrapi.femtechaccess.com.ng/api'}${user.avatar}`)
              : 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
            }
            alt={user?.fullName}
            className="w-full h-full rounded-full"
          />
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
                      className={`flex flex-col items-center gap-2 px-3 py-2 rounded-xl ${
                        locationPermissionDenied 
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-amber-500/20 text-amber-100'
                      } text-xs`}
                    >
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5" />
                        <span>{locationError}</span>
                      </div>
                      {locationPermissionDenied && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 text-[11px]"
                          onClick={requestLocationPermission}
                        >
                          Grant Location Access
                        </Button>
                      )}
                    </motion.div>
                  ) : assignmentError ? (
                    <motion.div 
                      key="assignment"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex flex-col items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5" />
                        <span>{assignmentError}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[11px]"
                        onClick={() => fetchMyAssignedLocations()}
                      >
                        Refresh
                      </Button>
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
                      
                      {!isWithinRange && distanceFromAssignedLocation !== null && (
                        <p className="text-white/60 text-[10px] mt-1 italic">
                          You are approx. {Math.round(distanceFromAssignedLocation)}m away from {nearestAssignedLocation?.name || 'your assigned location'}. Move closer.
                        </p>
                      )}

                      {/* <button
                        type="button"
                        className="text-[10px] text-white/60 underline underline-offset-4"
                        onClick={() => setShowGeoDetails(v => !v)}
                      >
                        {showGeoDetails ? 'Hide details' : 'Show details'}
                      </button> */}

                      {showGeoDetails && (
                        <div className="w-full mt-2 rounded-xl bg-white/10 border border-white/10 p-3 text-left text-[11px] text-white/75">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-white/60">Nearest location</span>
                            <span className="font-semibold text-white/90">{nearestAssignedLocation?.name || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 mt-1">
                            <span className="text-white/60">Radius</span>
                            <span className="font-semibold text-white/90">{assignedLocationRadius ?? '-'}m</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 mt-1">
                            <span className="text-white/60">Distance</span>
                            <span className="font-semibold text-white/90">
                              {distanceFromAssignedLocation !== null ? `${Math.round(distanceFromAssignedLocation)}m` : '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 mt-1">
                            <span className="text-white/60">GPS accuracy</span>
                            <span className="font-semibold text-white/90">{gpsAccuracyMeters !== null ? `${Math.round(gpsAccuracyMeters)}m` : '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 mt-1">
                            <span className="text-white/60">Assigned locations</span>
                            <span className="font-semibold text-white/90">{assignedLocations.length}</span>
                          </div>
                          {debugEnabled && (
                            <pre className="mt-2 text-[10px] leading-snug whitespace-pre-wrap text-white/70">
                              {JSON.stringify(
                                {
                                  currentLocation,
                                  gpsAccuracyMeters,
                                  gpsTimestamp,
                                  nearestAssignedLocation: nearestAssignedLocation
                                    ? {
                                        id: nearestAssignedLocation.id,
                                        name: nearestAssignedLocation.name,
                                        location_coordinates: nearestAssignedLocation.location_coordinates,
                                        location_radius_meters: nearestAssignedLocation.location_radius_meters,
                                      }
                                    : null,
                                  distanceFromAssignedLocation,
                                  assignedLocationRadius,
                                  isWithinRange,
                                },
                                null,
                                2
                              )}
                            </pre>
                          )}
                        </div>
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
                variant={isClocked || isOnLeaveToday ? 'default' : 'secondary'}
                className={`${
                  isOnLeaveToday
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : isClocked
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                {isOnLeaveToday ? '● On Leave' : isClocked ? '● On Shift' : '○ Off Duty'}
              </Badge>
            </div>

            {/* Clock In/Out Button */}
            <motion.div whileTap={hasCheckedInToday ? {} : { scale: 0.95 }}>
              <Button
                size="lg"
                className={`w-full h-16 text-lg font-semibold rounded-2xl ${
                  isOnLeaveToday || isHolidayToday || hasCheckedInToday || todaySchedule?.is_working_day === false
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isClocked
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                disabled={
                  loading ||
                  isSubmitting ||
                  isOnLeaveToday ||
                  isHolidayToday ||
                  hasCheckedInToday ||
                  todaySchedule?.is_working_day === false ||
                  (!isClocked && (!!assignmentError || !!locationError || isWithinRange === false))
                }
                onClick={hasCheckedInToday ? undefined : handleClockAction}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Clocking...
                  </span>
                ) : loading ? (
                  'Processing...'
                ) : isOnLeaveToday ? (
                  'On Leave'
                ) : isHolidayToday ? (
                  'Holiday'
                ) : hasCheckedInToday ? (
                  hasCheckedOutToday ? '✓ Checked Out' : '✓ Checked In'
                ) : todaySchedule?.is_working_day === false ? (
                  todaySchedule?.schedule_type === 'holiday' ? 'Holiday' : 'Non-Working Day'
                ) : !isClocked && assignmentError ? (
                  'No Location Assigned'
                ) : !isClocked && locationError ? (
                  'Enable Location'
                ) : !isClocked && isWithinRange === false ? (
                  'Move Closer'
                ) : isClocked ? (
                  'Clock Out'
                ) : (
                  'Clock In'
                )}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Information Card */}
      {(todayRecord || todaySchedule) && (
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Today's Schedule
                {todaySchedule?.schedule_type === 'exception' && (
                  <Badge className="bg-blue-100 text-blue-700 ml-2">Exception</Badge>
                )}
                {todaySchedule?.schedule_type === 'holiday' && (
                  <Badge className="bg-purple-100 text-purple-700 ml-2">Holiday</Badge>
                )}
              </h3>
              {todayRecord?.is_late && hasCheckedInToday && (
                <Badge className="bg-amber-100 text-amber-700">
                  <Clock className="w-3 h-3 mr-1" />
                  Late
                </Badge>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Scheduled Start</span>
                <span className="font-medium text-gray-900">
                  {todayRecord?.scheduled_start_time || todaySchedule?.start_time || '09:00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Scheduled End</span>
                <span className="font-medium text-gray-900">
                  {todayRecord?.scheduled_end_time || todaySchedule?.end_time || '17:00'}
                </span>
              </div>
              {todaySchedule?.schedule_note && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 italic">
                  Note: {todaySchedule.schedule_note}
                </div>
              )}
              {hasCheckedInToday && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Actual Check-in</span>
                    <span className="font-medium text-green-600">
                      {todayRecord.check_in_time || '--:--'}
                    </span>
                  </div>
                  {todayRecord.is_late && todayRecord.late_by && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      <Clock className="w-3 h-3" />
                      <span>Late by {todayRecord.late_by} minutes</span>
                    </div>
                  )}
                </>
              )}
              {hasCheckedOutToday && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Actual Check-out</span>
                    <span className="font-medium text-blue-600">
                      {todayRecord.check_out_time || '--:--'}
                    </span>
                  </div>
                  {todayRecord.is_auto_checkout && (
                    <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                      <Timer className="w-3 h-3" />
                      <span>Automatic checkout</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Shift Exceptions Card */}
      {myExceptions.length > 0 && (
        <Card className="shadow-md border-purple-100">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-600" />
              Special Shift Exceptions
            </h3>
            <div className="space-y-3">
              {myExceptions.slice(0, 3).map((exception) => (
                <div key={exception.id} className="bg-purple-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-purple-900">
                      {new Date(exception.exception_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-[10px]">
                      {exception.exception_type?.replace(/_/g, ' ') || 'Exception'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-purple-700">
                    <Clock className="w-3 h-3" />
                    <span>
                      {exception.new_start_time?.substring(0, 5) || '--:--'} - {exception.new_end_time?.substring(0, 5) || '--:--'}
                    </span>
                  </div>
                  {exception.reason && (
                    <p className="text-xs text-purple-600 mt-1 italic">
                      {exception.reason}
                    </p>
                  )}
                </div>
              ))}
              {myExceptions.length > 3 && (
                <p className="text-center text-xs text-gray-500 italic pt-1">
                  And {myExceptions.length - 3} more... Check Shifts tab for details.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
