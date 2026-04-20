import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import { toast } from 'sonner';

export function LoginScreen() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // The login function returns the user object on success
      // and throws an error on failure.
      const user = await login(email, password, rememberMe);

      if (user) {
        toast.success('Login successful!');
        // Always navigate to dashboard after login
        navigate('/dashboard');
      }
    } catch (error: any) {
      // Handle thrown errors from the login function
      console.error('Login error details:', error);
      
      // Use a more descriptive error message if available
      let errorMessage = 'Invalid credentials. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/femtech.png" alt="Femtech TMS Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Femtech TMS</h1>
          <p className="text-white/70">Sign in to continue</p>
        </div>

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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Stay logged in
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A2B3C] hover:bg-[#2C3E50] text-white h-12"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Need help?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
