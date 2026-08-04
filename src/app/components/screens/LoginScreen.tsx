import { useState, useEffect } from 'react';
import { Eye, EyeOff, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';

type LoginPhase = 'idle' | 'connecting' | 'authenticating' | 'retrying';

function classifyError(error: any): { message: string; isRetryable: boolean } {
  if (!navigator.onLine) {
    return {
      message: 'No internet connection. Please check your network and try again.',
      isRetryable: false,
    };
  }

  const status = error?.response?.status;

  if (status === 401 || status === 403) {
    return {
      message: error.response?.data?.message || 'Incorrect email or password. Please try again.',
      isRetryable: false,
    };
  }

  if (status === 400) {
    return {
      message: error.response?.data?.message || 'Please check your email and password.',
      isRetryable: false,
    };
  }

  if (status === 429) {
    return {
      message: 'Too many login attempts. Please wait a moment and try again.',
      isRetryable: false,
    };
  }

  if (status >= 500) {
    return {
      message: 'The server encountered an error. Please try again shortly.',
      isRetryable: true,
    };
  }

  const isTimeout =
    error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
  const isNetworkError =
    error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';

  if (isTimeout) {
    return {
      message: 'The connection timed out. This can happen on slower networks — please try again.',
      isRetryable: true,
    };
  }

  if (isNetworkError) {
    return {
      message: 'Unable to reach the server. Please check your internet and try again.',
      isRetryable: true,
    };
  }

  return {
    message: error?.message || 'Something went wrong. Please try again.',
    isRetryable: true,
  };
}

const phaseLabel: Record<LoginPhase, string> = {
  idle: 'Sign In',
  connecting: 'Connecting…',
  authenticating: 'Signing in…',
  retrying: 'Retrying…',
};

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<LoginPhase>('idle');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [errorInfo, setErrorInfo] = useState<{ message: string; isRetryable: boolean } | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorInfo(null);
    setLoading(true);
    setPhase('connecting');

    // Show "retrying" message after 6 s so users know we're still working
    const retryTimer = setTimeout(() => setPhase('retrying'), 6000);
    const authTimer = setTimeout(() => setPhase('authenticating'), 2000);

    try {
      const user = await login(email, password);
      if (user) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      const info = classifyError(error);
      setErrorInfo(info);
    } finally {
      clearTimeout(retryTimer);
      clearTimeout(authTimer);
      setLoading(false);
      setPhase('idle');
    }
  };

  const isDisabled = loading || isOffline;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/femtech.png" alt="Femtech HR Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Femtech TMS</h1>
          <p className="text-white/70">Sign in to continue</p>
        </div>

        {/* Offline banner */}
        {isOffline && (
          <div className="mb-4 flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-100 rounded-xl px-4 py-3 text-sm">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>You're offline. Connect to the internet to sign in.</span>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorInfo(null); }}
                placeholder="your@email.com"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorInfo(null); }}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {errorInfo && (
              <div className={`rounded-lg px-4 py-3 text-sm ${
                errorInfo.isRetryable
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <p>{errorInfo.message}</p>
                {errorInfo.isRetryable && (
                  <p className="mt-1 text-xs opacity-75">
                    Tip: On slower connections the server may take up to 60 seconds to respond — just tap Sign In again.
                  </p>
                )}
              </div>
            )}

            {/* Slow-network hint shown while waiting */}
            {(phase === 'retrying' || phase === 'connecting') && (
              <p className="text-xs text-center text-gray-400">
                {phase === 'retrying'
                  ? 'Still connecting… the server may be starting up. Please wait.'
                  : 'Connecting to server…'}
              </p>
            )}

            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full bg-[#1A2B3C] hover:bg-[#2C3E50] text-white h-12 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {phaseLabel[phase]}
                </>
              ) : errorInfo?.isRetryable ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center space-y-2">
              <Link to="/forgot-password" className="block text-sm text-blue-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom hint for very slow networks */}
        <p className="text-center text-white/40 text-xs mt-6">
          Having trouble? Wait 30 seconds and try again — the server may be waking up.
        </p>
      </div>
    </div>
  );
}
