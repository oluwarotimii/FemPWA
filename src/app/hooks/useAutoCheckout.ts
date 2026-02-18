import { useEffect, useRef, useCallback } from 'react';
import { attendanceApi } from '@/app/services/api';
import { toast } from 'sonner';

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

/**
 * Hook to handle automatic checkout at 6:30 PM daily
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

  // Perform the auto-checkout
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
        is_auto_checkout: true, // Flag to indicate this was an automatic checkout
      };

      const response = await attendanceApi.checkOut(checkOutData);

      // Mark as triggered to prevent duplicate checkouts
      checkoutTriggeredRef.current = true;
      lastCheckoutDateRef.current = todayStr;

      // Show success notification
      toast.success('Auto Check-Out', {
        description: `You have been automatically checked out at ${new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        duration: 8000, // Show for 8 seconds
      });

      // Execute callback if provided
      if (onCheckoutComplete) {
        onCheckoutComplete();
      }
    } catch (error: any) {
      console.error('Auto-checkout failed:', error);

      // Don't show error toast for auto-checkout failures to avoid disturbing user after hours
      // But log it for debugging
      toast.error('Auto Check-Out Failed', {
        description: 'Automatic checkout failed. Please check out manually when possible.',
        duration: 5000,
      });
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

  useEffect(() => {
    // Check immediately when component mounts or isEnabled changes
    checkAndTriggerCheckout();

    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      checkAndTriggerCheckout();
    }, 60000); // Check every minute

    // Also check more frequently around checkout time (every 10 seconds between 6:25 and 6:35)
    const now = new Date();
    const isNearCheckoutTime =
      now.getHours() === 18 && now.getMinutes() >= 25 && now.getMinutes() <= 35;

    let rapidCheckIntervalId: NodeJS.Timeout | null = null;
    if (isNearCheckoutTime && isEnabled) {
      rapidCheckIntervalId = setInterval(() => {
        checkAndTriggerCheckout();
      }, 10000); // Check every 10 seconds near checkout time
    }

    return () => {
      clearInterval(intervalId);
      if (rapidCheckIntervalId) {
        clearInterval(rapidCheckIntervalId);
      }
    };
  }, [isEnabled, checkAndTriggerCheckout]);

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
