import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

const PULL_THRESHOLD = 80;
const MAX_PULL = 150;

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  isStandalone?: boolean;
}

export function PullToRefresh({ children, onRefresh, isStandalone }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isAtTop() || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [isAtTop, refreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff <= 0 || !isAtTop()) {
      setPullDistance(0);
      pulling.current = false;
      return;
    }
    setPullDistance(Math.min(diff * 0.5, MAX_PULL));
  }, [isAtTop, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) return;
    pulling.current = false;
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(0);
      if (onRefresh) {
        try { await onRefresh(); } catch { /* ignore */ }
        setRefreshing(false);
      } else {
        window.location.reload();
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const showIndicator = pullDistance > 0 || refreshing;

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex justify-center items-center overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: showIndicator ? Math.max(pullDistance, refreshing ? 60 : 0) : 0,
          opacity: showIndicator ? Math.min(pullDistance / PULL_THRESHOLD, 1) : 0,
        }}
      >
        {refreshing ? (
          <Loader2 className="w-6 h-6 text-[#1A2B3C] animate-spin" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <ArrowDown
              className="w-5 h-5 text-[#1A2B3C] transition-transform duration-200"
              style={{
                transform: `rotate(${Math.min(pullDistance / PULL_THRESHOLD * 180, 180)}deg)`,
              }}
            />
            <span className="text-xs text-gray-500 font-medium">
              {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
