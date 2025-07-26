import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { logError } from '../../lib/errorLogger';

/**
 * A component that displays a notification when the user's network status changes.
 * Shows a toast when the user goes offline or comes back online.
 */
const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShowNotification(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
      
      // Log the offline event
      logError('User went offline', {
        level: 'warning',
        context: 'NetworkStatusIndicator',
        metadata: {
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {isOnline ? (
        <Wifi className="h-5 w-5" />
      ) : (
        <WifiOff className="h-5 w-5" />
      )}
      <span className="font-medium">
        {isOnline ? 'You are back online' : 'You are offline'}
      </span>
      <button
        onClick={() => setShowNotification(false)}
        className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default NetworkStatusIndicator;