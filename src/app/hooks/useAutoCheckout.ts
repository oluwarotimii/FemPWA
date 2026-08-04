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

const AUTO_CHECKOUT_HOUR = 18;
const AUTO_CHECKOUT_MINUTE = 30;

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export function useAutoCheckout({
  isEnabled,
  onCheckoutComplete,
}: UseAutoCheckoutProps): UseAutoCheckoutReturn {
  const checkoutTriggeredRef = useRef(false);
  const lastCheckoutDateRef = useRef<string | null>(null);
  const staleCheckDoneRef = useRef(false);

  // Store latest callback in a ref so intervals never go stale without re-creating
  const onCheckoutCompleteRef = useRef(onCheckoutComplete);
  useEffect(() => {
    onCheckoutCompleteRef.current = onCheckoutComplete;
  });

  const getNextAutoCheckoutTime = useCallback(() => {
    const now = new Date();
    const checkoutTime = new Date();
    checkoutTime.setHours(AUTO_CHECKOUT_HOUR, AUTO_CHECKOUT_MINUTE, 0, 0);
    if (now > checkoutTime) checkoutTime.setDate(checkoutTime.getDate() + 1);
    return checkoutTime;
  }, []);

  const performAutoCheckout = useCallback(async () => {
    const todayStr = getTodayDateString();
    if (checkoutTriggeredRef.current || lastCheckoutDateRef.current === todayStr) return;

    try {
      await attendanceApi.checkOut({
        date: todayStr,
        check_out_time: new Date().toTimeString().substring(0, 8),
        location_coordinates: null,
        location_address: 'Office (Auto)',
        is_auto_checkout: true,
      });
      checkoutTriggeredRef.current = true;
      lastCheckoutDateRef.current = todayStr;
      onCheckoutCompleteRef.current?.();
    } catch (error: any) {
      console.error('Auto-checkout failed:', error);
    }
  }, []);

  const checkAndTriggerCheckout = useCallback(() => {
    const now = new Date();
    const checkoutTime = new Date();
    checkoutTime.setHours(AUTO_CHECKOUT_HOUR, AUTO_CHECKOUT_MINUTE, 0, 0);
    const todayStr = getTodayDateString();

    if (
      isEnabled &&
      now >= checkoutTime &&
      !checkoutTriggeredRef.current &&
      lastCheckoutDateRef.current !== todayStr
    ) {
      performAutoCheckout();
    }

    if (!isEnabled && lastCheckoutDateRef.current !== todayStr) {
      checkoutTriggeredRef.current = false;
    }
  }, [isEnabled, performAutoCheckout]);

  // Run stale-record fix once on mount (not every minute — it makes an API call)
  const checkAndFixStaleRecords = useCallback(async () => {
    if (staleCheckDoneRef.current) return;
    staleCheckDoneRef.current = true;

    const now = new Date();
    const isPastAutoCheckoutTime =
      now.getHours() > AUTO_CHECKOUT_HOUR ||
      (now.getHours() === AUTO_CHECKOUT_HOUR && now.getMinutes() >= AUTO_CHECKOUT_MINUTE);

    if (!isPastAutoCheckoutTime) return;

    try {
      const todayStr = getTodayDateString();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await attendanceApi.getMyAttendance({ startDate, endDate, limit: 31 });
      const records: any[] = response.data?.attendance || [];

      const staleRecords = records.filter(
        (r: any) => r.check_in_time && !r.check_out_time
      );

      for (const staleRecord of staleRecords) {
        try {
          const recordDate: string = staleRecord.date.split('T')[0];
          const isTodayRecord = recordDate === todayStr;
          await attendanceApi.checkOut({
            date: recordDate,
            check_out_time: isTodayRecord ? new Date().toTimeString().substring(0, 8) : '18:30:00',
            location_coordinates: null,
            location_address: 'Office (Auto)',
            is_auto_checkout: true,
          });
          onCheckoutCompleteRef.current?.();
        } catch (checkoutError: any) {
          console.error(`Failed to checkout stale record ${staleRecord.id}:`, checkoutError);
        }
      }
    } catch (error) {
      console.error('Error checking for stale records:', error);
    }
  }, []);

  useEffect(() => {
    checkAndTriggerCheckout();
    checkAndFixStaleRecords();

    const intervalId = setInterval(checkAndTriggerCheckout, 60000);

    const now = new Date();
    const isNearCheckoutTime =
      now.getHours() === AUTO_CHECKOUT_HOUR &&
      now.getMinutes() >= 25 &&
      now.getMinutes() <= 35;

    let rapidCheckIntervalId: ReturnType<typeof setInterval> | null = null;
    if (isNearCheckoutTime && isEnabled) {
      rapidCheckIntervalId = setInterval(checkAndTriggerCheckout, 10000);
    }

    return () => {
      clearInterval(intervalId);
      if (rapidCheckIntervalId) clearInterval(rapidCheckIntervalId);
    };
  }, [isEnabled, checkAndTriggerCheckout, checkAndFixStaleRecords]);

  useEffect(() => {
    if (isEnabled) {
      const todayStr = getTodayDateString();
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
