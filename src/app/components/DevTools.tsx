import { useState, useEffect } from 'react';
import { Wrench, X, Home, Clock, Calendar, User, FileText, Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  // Show dev tools only in development
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    setIsVisible(isDev);
  }, []);

  const pages = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/login', label: 'Login', icon: Settings },
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/attendance', label: 'Attendance', icon: Clock },
    { path: '/leave', label: 'Leave', icon: Calendar },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/forms', label: 'Forms', icon: FileText },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/change-password', label: 'Change Password', icon: Settings },
    { path: '/fill-personal-details', label: 'Fill Details', icon: User },
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="mb-2 bg-white rounded-lg shadow-lg p-2 space-y-1 border">
          {pages.map((page, index) => {
            const Icon = page.icon;
            return (
              <button
                key={page.path}
                onClick={() => navigate(page.path)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100"
              >
                <Icon size={16} />
                <span>{page.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-full shadow-lg ${
          isOpen ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        } hover:opacity-90 transition-opacity`}
        aria-label={isOpen ? "Close Dev Tools" : "Open Dev Tools"}
      >
        {isOpen ? <X size={20} /> : <Wrench size={20} />}
      </button>
    </div>
  );
}