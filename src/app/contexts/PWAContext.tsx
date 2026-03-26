import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isIOS: boolean;
  isInstalled: boolean;
  showInstallPrompt: () => void;
  hideInstallPrompt: () => void;
  installApp: () => Promise<void>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect if the user is on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Check if already installed (running as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isWindowControlsOverlay = window.matchMedia('(display-mode: window-controls-overlay)').matches;
    setIsInstalled(isStandalone || isWindowControlsOverlay);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // Update UI to notify the user they can install the PWA
      setIsInstallable(true);
      console.log('PWA install prompt ready');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for when the app is installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      try {
        // Show the install prompt
        await deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
    } else if (isIOS) {
      // For iOS, we can't programmatically install, but we can show instructions
      console.log('iOS detected - show manual install instructions');
    } else {
      console.log('No install prompt available');
    }
  };

  const showInstallPrompt = () => {
    installApp();
  };

  const hideInstallPrompt = () => {
    setIsInstallable(false);
  };

  return (
    <PWAContext.Provider
      value={{
        deferredPrompt,
        isInstallable,
        isIOS,
        isInstalled,
        showInstallPrompt,
        hideInstallPrompt,
        installApp,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within PWAProvider');
  }
  return context;
}