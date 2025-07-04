import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

// Configuration options
const DEFAULT_DELAY = 30000; // 30 seconds before showing the modal
const STORAGE_KEY = 'bod_signup_prompt';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface SignUpPromptState {
  showPrompt: boolean;
  setShowPrompt: (show: boolean) => void;
  permanentlyDismiss: () => void;
  temporarilyDismiss: () => void;
}

export const useSignUpPrompt = (): SignUpPromptState => {
  const { user } = useAuth();
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    // Don't show prompt if user is logged in
    if (user) {
      setShowPrompt(false);
      return;
    }

    // Check if current path is an auth or business listing page
    const authPaths = [
      '/login',
      '/signup',
      '/forgot-password',
      '/business/new',
      '/claim-account',
      '/claim-business'
    ];
    
    // Check if the current path starts with any of the auth paths
    const isAuthPath = authPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
    
    // Don't show prompt on auth or business listing pages
    if (isAuthPath) {
      setShowPrompt(false);
      return;
    }

    // Check if user has dismissed the prompt before
    const promptState = localStorage.getItem(STORAGE_KEY);
    if (promptState) {
      const { dismissed, dismissedUntil } = JSON.parse(promptState);
      
      // If permanently dismissed or temporary dismissal is still valid
      if (dismissed === true || (dismissedUntil && new Date(dismissedUntil) > new Date())) {
        return;
      }
    }

    // Set timer to show the prompt after delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, DEFAULT_DELAY);

    return () => clearTimeout(timer);
  }, [user, location.pathname]);

  // Permanently dismiss the prompt (user clicked "Don't show again")
  const permanentlyDismiss = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dismissed: true })
    );
    setShowPrompt(false);
  };

  // Temporarily dismiss the prompt (user clicked "Maybe later")
  const temporarilyDismiss = () => {
    const dismissedUntil = new Date(Date.now() + DISMISS_DURATION).toISOString();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dismissed: false, dismissedUntil })
    );
    setShowPrompt(false);
  };

  return {
    showPrompt,
    setShowPrompt,
    permanentlyDismiss,
    temporarilyDismiss
  };
};