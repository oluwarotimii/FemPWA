import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PWAContextType {
  deferredPrompt: Event | null;
  isInstallable: boolean;
  isIOS: boolean;
  showInstallPrompt: () => void;
  hideInstallPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect if the user is on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // FOR TESTING: Force the install prompt to appear immediately
    // In a real app, you would remove this timeout or condition it behind a flag
    const timer = setTimeout(() => {
      setIsInstallable(true); // Force showing the prompt for testing
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const showInstallPrompt = () => {
    if (deferredPrompt) {
      // @ts-ignore - Cast to BeforeInstallPromptEvent
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      // @ts-ignore
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install the prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
      });
    } else {
      // If no deferred prompt, just hide the notification
      setIsInstallable(false);
    }
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
        showInstallPrompt,
        hideInstallPrompt,
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