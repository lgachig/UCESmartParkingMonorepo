import { QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '../contexts/SidebarContext';
import { queryClient } from '../lib/queryClient';
import RealtimeSync from './RealtimeSync';

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <RealtimeSync />
        {children}
      </SidebarProvider>
    </QueryClientProvider>
  );
}