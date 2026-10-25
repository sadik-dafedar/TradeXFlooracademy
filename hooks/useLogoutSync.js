'use client';

import { useEffect } from 'react';

/**
 * Hook to sync logout across multiple tabs
 * When a user logs out in one tab, this hook detects the storage event 
 * and redirects other tabs to login/home.
 */
export function useLogoutSync() {
    useEffect(() => {
        const syncLogout = (event) => {
            if (event.key === 'logout-event') {
                // Redirect to login or just reload to clear session state from memory
                window.location.href = '/login';
            }
        };

        window.addEventListener('storage', syncLogout);
        return () => window.removeEventListener('storage', syncLogout);
    }, []);
}
