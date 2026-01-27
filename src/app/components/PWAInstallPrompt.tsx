import { useState } from 'react';
import { usePWA } from '@/app/contexts/PWAContext';
import { Button } from '@/app/components/ui/button';
import { X } from 'lucide-react';

export function PWAInstallPrompt() {
  const { isInstallable, isIOS, showInstallPrompt, hideInstallPrompt } = usePWA();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  // Show iOS-specific instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-xl shadow-lg max-w-xs z-50 transform transition-transform duration-300 animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                SP
              </div>
              <p className="font-semibold">Install Staff Portal</p>
            </div>
            <p className="text-xs opacity-90 mb-3">
              Tap the share button and Add to Home Screen
            </p>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                className="text-blue-600 text-xs"
                onClick={() => setIsVisible(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-700 ml-2"
            onClick={() => setIsVisible(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Show install prompt for other platforms
  if (isInstallable) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 text-gray-800 p-4 rounded-xl shadow-lg max-w-xs z-50 transform transition-transform duration-300 animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-indigo-100 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                SP
              </div>
              <p className="font-semibold">Install App</p>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Add to your home screen for quick access
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={hideInstallPrompt}
              >
                Later
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                onClick={() => {
                  showInstallPrompt();
                  setIsVisible(false);
                }}
              >
                Install
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 ml-2"
            onClick={() => {
              hideInstallPrompt();
              setIsVisible(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}