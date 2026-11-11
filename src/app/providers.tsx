'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLiveStream } from '@/hooks/useLiveStream';

function LiveStreamBootstrap() {
  useLiveStream();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LiveStreamBootstrap />
      {children}
    </QueryClientProvider>
  );
}
