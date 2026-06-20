"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * PWA Install Prompt - guides users to install MedMate as a PWA
 * 
 * iOS: Shows instructions to "Add to Home Screen" via Safari
 * Android: Uses beforeinstallprompt API for native install prompt
 * Desktop: Can also prompt for installation
 */
export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    // @ts-ignore
    const isIOSStandalone = window.navigator.standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    setIsIOS(iOS);
    setIsAndroid(android);

    // Check if user has already dismissed prompt
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Android: Capture beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // iOS: Show prompt after a delay (Safari doesn't have beforeinstallprompt)
    if (iOS) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android: Use native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    }
    // iOS: Just show instructions (already visible)
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="p-4 shadow-lg border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Install MedMate
            </h3>
            
            {isIOS ? (
              <div className="text-xs text-muted-foreground space-y-2">
                <p>Get app-like notifications:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tap the Share button <span className="font-mono">⎋</span></li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Open the installed app</li>
                  <li>Allow notifications</li>
                </ol>
              </div>
            ) : isAndroid ? (
              <p className="text-xs text-muted-foreground">
                Install MedMate for faster access and push notifications even when the browser is closed.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Install MedMate for a better experience with notifications and offline access.
              </p>
            )}

            <div className="flex gap-2 mt-3">
              {!isIOS && (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs"
              >
                Later
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
