import { useEffect, useRef, useCallback } from 'react';
import { attendanceApi } from '@/app/services/api';

interface UseAutoCheckoutProps {
  isEnabled: boolean;
  onCheckoutComplete?: () => void;
}

interface UseAutoCheckoutReturn {
  isAutoCheckoutEnabled: boolean;
  lastCheckoutTime: Date | null;
  nextAutoCheckoutTime: Date | null;
  wasAutoCheckedOut: boolean;
}

const AUTO_CHECKOUT_HOUR = 18; // 6 PM
const AUTO_CHECKOUT_MINUTE = 30; // 30 minutes
const AUTO_CHECKOUT_DELAY_MS = 5000; // 5 seconds after check-in

/**
 * Hook to handle automatic checkout
 * - Checks out users 5 seconds after they check in
 * - Also checks out any stale records at 6:30 PM
 * @param isEnabled - Whether the user is currently checked in
 * @param onCheckoutComplete - Callback to execute after successful auto-checkout
 */
export function useAutoCheckout({
  isEnabled,
  onCheckoutComplete,
}: UseAutoCheckoutProps): UseAutoCheckoutReturn {
  const checkoutTriggeredRef = useRef(false);
  const lastCheckoutDateRef = useRef<string | null>(null);

  // Calculate the next auto-checkout time (today at 6:30 PM or tomorrow if already passed)
  const getNextAutoCheckoutTime = useCallback(() => {
    const now = new Date();
    const checkoutTime = new Date();
    checkoutTime.setHours(AUTO_CHECKOUT_HOUR, AUTO_CHECKOUT_MINUTE, 0, 0);

    // If checkout time has already passed today, schedule for tomorrow
    if (now > checkoutTime) {
      checkoutTime.setDate(checkoutTime.getDate() + 1);
    }

    return checkoutTime;
  }, []);

  // Get today's date string in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Perform the auto-checkout (silent, no notifications)
  const performAutoCheckout = useCallback(async () => {
    // Prevent multiple triggers on the same day
    const todayStr = getTodayDateString();
    if (checkoutTriggeredRef.current || lastCheckoutDateRef.current === todayStr) {
      return;
    }

    try {
      console.log('Auto-checkout triggered at', new Date().toLocaleTimeString());

      const checkOutData = {
        date: todayStr,
        check_out_time: new Date().toTimeString().substring(0, 8),
        location: 'Office',
        is_auto_checkout: true,
      };

      await attendanceApi.checkOut(checkOutData);

      // Mark as triggered to prevent duplicate checkouts
      checkoutTriggeredRef.current = true;
      lastCheckoutDateRef.current = todayStr;

      // Execute callback if provided
      if (onCheckoutComplete) {
        onCheckoutComplete();
      }
    } catch (error: any) {
      console.error('Auto-checkout failed:', error);
    }
  }, [onCheckoutComplete]);

  // Perform immediate checkout after check-in (with delay)
  const performImmediateCheckout = useCallback(async () => {
    const todayStr = getTodayDateString();
    
    try {
      console.log('Immediate auto-checkout triggered at', new Date().toLocaleTimeString());

      const checkOutData = {
        date: todayStr,
        check_out_time: new Date().toTimeString().substring(0, 8),
        location: 'Office',
        is_auto_checkout: true,
      };

      await attendanceApi.checkOut(checkOutData);

      // Execute callback if provided
      if (onCheckoutComplete) {
        onCheckoutComplete();
      }
    } catch (error: any) {
      console.error('Immediate auto-checkout failed:', error);
    }
  }, [onCheckoutComplete]);

  // Check if it's time for auto-checkout
  const checkAndTriggerCheckout = useCallback(() => {
    const now = new Date();
    const checkoutTime = new Date();
    checkoutTime.setHours(AUTO_CHECKOUT_HOUR, AUTO_CHECKOUT_MINUTE, 0, 0);

    const todayStr = getTodayDateString();

    // Check if:
    // 1. Auto-checkout is enabled (user is checked in)
    // 2. Current time is at or past checkout time (6:30 PM)
    // 3. We haven't already triggered checkout today
    // 4. User was checked in before checkout time
    if (
      isEnabled &&
      now >= checkoutTime &&
      !checkoutTriggeredRef.current &&
      lastCheckoutDateRef.current !== todayStr
    ) {
      performAutoCheckout();
    }

    // Reset the trigger flag if it's a new day and user is not checked in
    if (!isEnabled && lastCheckoutDateRef.current !== todayStr) {
      checkoutTriggeredRef.current = false;
    }
  }, [isEnabled, performAutoCheckout]);

  // Check for stale records from previous days that need checkout and perform auto-checkout
  const checkAndFixStaleRecords = useCallback(async () => {
    const now = new Date();
    const todayStr = getTodayDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isPastAutoCheckoutTime = currentHour > AUTO_CHECKOUT_HOUR || (currentHour === AUTO_CHECKOUT_HOUR && currentMinute >= AUTO_CHECKOUT_MINUTE);
    
    if (!isPastAutoCheckoutTime) return;
    
    try {
      // Fetch recent attendance records to check for stale ones
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
      
      const response = await attendanceApi.getMyAttendance({ startDate, endDate, limit: 31 });
      const records = response.data?.attendance || [];
      
      // Find stale records (from previous days OR today, still checked in)
      const staleRecords = records.filter((r: any) => {
        const recordDate = r.date.split('T')[0];
        return r.check_in_time && !r.check_out_time;
      });
      
      if (staleRecords.length > 0) {
        console.log(`Found ${staleRecords.length} stale record(s), auto-checking out...`);
        
        // Auto-checkout for each stale record
        for (const staleRecord of staleRecords) {
          try {
            const recordDate = staleRecord.date.split('T')[0];
            const isTodayRecord = recordDate === todayStr;
            
            const checkOutData = {
              date: recordDate,
              check_out_time: isTodayRecord ? new Date().toTimeString().substring(0, 8) : '18:30:00',
              location: 'Office',
              is_auto_checkout: true,
            };
            
            await attendanceApi.checkOut(checkOutData);
            
            // Notify parent to refresh (silently, no toast)
            if (onCheckoutComplete) {
              onCheckoutComplete();
            }
          } catch (checkoutError: any) {
            console.error(`Failed to checkout stale record ${staleRecord.id}:`, checkoutError);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for stale records:', error);
    }
  }, [onCheckoutComplete]);

  useEffect(() => {
    // Check immediately when component mounts or isEnabled changes
    checkAndTriggerCheckout();
    checkAndFixStaleRecords();

    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      checkAndTriggerCheckout();
      checkAndFixStaleRecords();
    }, 60000); // Check every minute

    // Also check more frequently around checkout time (every 10 seconds between 6:25 and 6:35)
    const now = new Date();
    const isNearCheckoutTime =
      now.getHours() === 18 && now.getMinutes() >= 25 && now.getMinutes() <= 35;

    let rapidCheckIntervalId: NodeJS.Timeout | null = null;
    if (isNearCheckoutTime && isEnabled) {
      rapidCheckIntervalId = setInterval(() => {
        checkAndTriggerCheckout();
        checkAndFixStaleRecords();
      }, 10000); // Check every 10 seconds near checkout time
    }

    return () => {
      clearInterval(intervalId);
      if (rapidCheckIntervalId) {
        clearInterval(rapidCheckIntervalId);
      }
    };
  }, [isEnabled, checkAndTriggerCheckout, checkAndFixStaleRecords]);

  // Trigger immediate checkout when user checks in (after a short delay)
  useEffect(() => {
    if (isEnabled) {
      const timeoutId = setTimeout(() => {
        performImmediateCheckout();
      }, AUTO_CHECKOUT_DELAY_MS);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isEnabled, performImmediateCheckout]);

  // Reset trigger flag when user manually checks in
  useEffect(() => {
    if (isEnabled) {
      const todayStr = getTodayDateString();
      // Only reset if it's a new day
      if (lastCheckoutDateRef.current !== todayStr) {
        checkoutTriggeredRef.current = false;
      }
    }
  }, [isEnabled]);

  return {
    isAutoCheckoutEnabled: isEnabled,
    lastCheckoutTime: lastCheckoutDateRef.current
      ? new Date(lastCheckoutDateRef.current + 'T18:30:00')
      : null,
    nextAutoCheckoutTime: isEnabled ? getNextAutoCheckoutTime() : null,
    wasAutoCheckedOut: checkoutTriggeredRef.current,
  };
}

export default useAutoCheckout;
