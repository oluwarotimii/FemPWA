import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl font-bold text-gray-300">404</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-sm text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/login')} className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-white w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" /> Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
