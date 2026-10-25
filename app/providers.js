'use client';

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useLogoutSync } from '@/hooks/useLogoutSync';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }) {
  // Create QueryClient inside the component to prevent SSR state sharing issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  useLogoutSync();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
