import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Compass,
  LayoutDashboard,
  LogIn,
  Pause,
  Play,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/app/contexts/AuthContext';

const REDIRECT_SECONDS = 8;
const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const digitContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const digitItem = {
  hidden: { y: 40, opacity: 0, scale: 0.6 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 18 },
  },
};

export function NotFoundScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const [autoRedirect, setAutoRedirect] = useState(true);

  const homePath = isAuthenticated ? '/dashboard' : '/login';

  useEffect(() => {
    if (!autoRedirect) return;
    if (secondsLeft <= 0) {
      navigate(homePath, { replace: true });
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [autoRedirect, secondsLeft, homePath, navigate]);

  const toggleCountdown = useCallback(() => setAutoRedirect((v) => !v), []);

  const progress = autoRedirect ? secondsLeft / REDIRECT_SECONDS : 1;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50] flex items-center justify-center overflow-hidden p-4">
      {/* Floating background orbs */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#16a34a]/20 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="bg-white rounded-3xl shadow-2xl px-8 pt-0 pb-8 text-center">
          {/* Compass badge */}
          <motion.div
            className="w-20 h-20 -mt-10 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50] flex items-center justify-center shadow-lg ring-4 ring-white/60"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          >
            <motion.div
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Compass className="w-9 h-9 text-emerald-400" />
            </motion.div>
          </motion.div>

          {/* Animated 404 */}
          <motion.h1
            variants={digitContainer}
            initial="hidden"
            animate="show"
            className="text-6xl font-extrabold tracking-tight text-gray-900 mb-2 select-none"
          >
            {['4', '0', '4'].map((d, i) => (
              <motion.span key={i} variants={digitItem} className="inline-block">
                {d}
              </motion.span>
            ))}
          </motion.h1>

          <h2 className="text-lg font-bold text-gray-800 mb-1">You seem to be lost</h2>
          <p className="text-sm text-gray-500 mb-5">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Auto-redirect ring */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              type="button"
              onClick={toggleCountdown}
              aria-label={autoRedirect ? 'Pause automatic redirect' : 'Resume automatic redirect'}
              className="relative shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A2B3C] rounded-full active:scale-95 transition-transform"
            >
              <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
                <circle
                  cx="38"
                  cy="38"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="6"
                  className="stroke-gray-200"
                />
                <motion.circle
                  cx="38"
                  cy="38"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="stroke-emerald-500"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  animate={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress) }}
                  transition={{ duration: autoRedirect ? 0.95 : 0.3, ease: 'linear' }}
                />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {autoRedirect ? (
                  <span className="text-lg font-bold text-gray-900 tabular-nums leading-none">
                    {Math.max(secondsLeft, 0)}
                    <span className="block text-[9px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
                      sec
                    </span>
                  </span>
                ) : (
                  <Play className="w-5 h-5 text-gray-400" />
                )}
              </span>
            </button>

            <div className="text-left min-w-0">
              <p aria-live="polite" className="text-sm font-semibold text-gray-800">
                {autoRedirect
                  ? isAuthenticated
                    ? `Taking you to your dashboard…`
                    : `Redirecting you to sign in…`
                  : 'Auto-redirect paused'}
              </p>
              <button
                type="button"
                onClick={toggleCountdown}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1A2B3C] mt-1 transition-colors"
              >
                {autoRedirect ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {autoRedirect ? 'Tap to pause' : 'Tap to resume'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => navigate(homePath, { replace: true })}
                className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-white w-full h-12 text-base"
              >
                {isAuthenticated ? (
                  <>
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Go to Dashboard
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" /> Back to Login
                  </>
                )}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={() => navigate(-1)} variant="outline" className="w-full h-11">
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
