import { useState, useEffect } from 'react';
import { usePWA } from '@/app/contexts/PWAContext';
import { Button } from '@/app/components/ui/button';
import { X, Download, Share, Plus } from 'lucide-react';

export function PWAInstallPrompt() {
  const { isInstallable, isIOS, isInstalled, showInstallPrompt, hideInstallPrompt } = usePWA();
  const [isVisible, setIsVisible] = useState(true);
  const [wasDismissed, setWasDismissed] = useState(false);

  // Don't show if already installed or dismissed
  useEffect(() => {
    if (isInstalled) {
      setIsVisible(false);
    }
  }, [isInstalled]);

  if (!isVisible || wasDismissed || isInstalled) {
    return null;
  }

  // Show iOS-specific instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-[#1A2B3C] text-white p-4 rounded-xl shadow-lg max-w-md mx-auto z-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <img src="/femtech.png" alt="Femtech" className="w-8 h-8 rounded-full object-contain bg-white" />
              <p className="font-semibold">Install Femtech TMS</p>
            </div>
            <p className="text-xs opacity-90 mb-3">
              Install our app for quick access:
            </p>
            <div className="bg-white/10 rounded-lg p-3 mb-3 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-white text-[#1A2B3C] rounded px-1.5 py-0.5 font-bold">1</span>
                <span>Tap the <Share className="w-3 h-3 inline" /> Share button</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white text-[#1A2B3C] rounded px-1.5 py-0.5 font-bold">2</span>
                <span>Scroll down and tap "Add to Home Screen"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white text-[#1A2B3C] rounded px-1.5 py-0.5 font-bold">3</span>
                <span>Tap <Plus className="w-3 h-3 inline" /> Add</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                className="text-[#1A2B3C] text-xs"
                onClick={() => {
                  setWasDismissed(true);
                  setIsVisible(false);
                }}
              >
                Not Now
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 ml-2"
            onClick={() => {
              setWasDismissed(true);
              setIsVisible(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Show install prompt for Android/Desktop
  if (isInstallable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 text-gray-800 p-4 rounded-xl shadow-lg max-w-md mx-auto z-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <img src="/femtech.png" alt="Femtech" className="w-8 h-8 rounded-full object-contain bg-[#1A2B3C]" />
              <p className="font-semibold">Install Femtech TMS</p>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Add to your home screen for quick access and offline support
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setWasDismissed(true);
                  hideInstallPrompt();
                  setIsVisible(false);
                }}
              >
                Later
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-xs"
                onClick={() => {
                  showInstallPrompt();
                  setIsVisible(false);
                }}
              >
                <Download className="w-3 h-3 mr-1" />
                Install
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 ml-2"
            onClick={() => {
              setWasDismissed(true);
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