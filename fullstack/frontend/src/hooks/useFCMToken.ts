import { useEffect, useState, useRef } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging, FIREBASE_ENABLED } from '../config/firebase';
import api from '../api/axios';
import { useAuth } from './useAuth';
import logger from '../utils/logger';

// Track synced token per user across renders — prevents duplicate POST calls
const syncedTokens = new Map<number, string>();

/**
 * Hook to handle FCM token acquisition and synchronization with the backend
 * for authenticated users. Syncs once per user per session.
 */
export const useFCMToken = () => {
  const { user, isAuthenticated } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const syncingRef = useRef(false);

  // Use user.id as dependency — stable primitive, won't trigger on object reference changes
  const userId = user?.id;

  useEffect(() => {
    if (!isAuthenticated || !userId || !FIREBASE_ENABLED || !messaging) {
      return;
    }

    // Prevent concurrent syncs
    if (syncingRef.current) return;

    const syncFCMToken = async () => {
      syncingRef.current = true;
      try {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          logger.warn('[useFCMToken] VAPID key not found in environment');
          return;
        }

        if (typeof Notification === 'undefined') {
          logger.warn('[useFCMToken] Notifications are not supported in this browser');
          return;
        }

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            logger.warn('[useFCMToken] Notification permission was not granted');
            return;
          }
        }

        if (Notification.permission !== 'granted') {
          logger.warn('[useFCMToken] Notification permission is not granted');
          return;
        }

        const serviceWorkerRegistration = await navigator.serviceWorker.ready;
        logger.info('[useFCMToken] Requesting FCM token...');
        const token = await getToken(messaging!, { vapidKey, serviceWorkerRegistration });

        if (token) {
          setFcmToken(token);

          // Skip API call if this exact token was already synced for this user
          if (syncedTokens.get(userId) === token) {
            logger.info('[useFCMToken] Token unchanged, skipping sync');
            return;
          }

          await api.post('/notifications/token', { token });
          syncedTokens.set(userId, token);
          logger.info('[useFCMToken] Token synced');
        }
      } catch (err: any) {
        if (err.message?.includes('atob') || err.message?.includes('VAPID') || err.code === 'messaging/invalid-vapid-key') {
          logger.warn('[useFCMToken] Push notifications disabled (Invalid VAPID key or browser restriction)');
        } else {
          logger.error('[useFCMToken] FCM Error', { error: err.message });
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        syncingRef.current = false;
      }
    };

    const timer = setTimeout(syncFCMToken, 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, userId]);

  return { fcmToken, error };
};
