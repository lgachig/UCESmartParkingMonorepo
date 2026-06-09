import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useParkingStore } from '../store/parkingStore';

/**
 * Single source of Realtime: one subscription to parking_slots and parking_sessions.
 * Updates Zustand store (slots) and refetches React Query so admin and user UIs update
 * without reload. Must live inside QueryClientProvider.
 */
export default function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { updateSlot, addSlot, removeSlot } = useParkingStore.getState();

    const channel = supabase
      .channel('app-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_slots' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && updateSlot) {
            updateSlot(payload.new);
          }
          if (payload.eventType === 'INSERT' && addSlot) {
            addSlot(payload.new);
          }
          if (payload.eventType === 'DELETE' && removeSlot) {
            removeSlot(payload.old?.id);
          }
          queryClient.refetchQueries({ queryKey: ['slots'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_sessions' },
        () => {
          queryClient.refetchQueries({ queryKey: ['slots'] });
          queryClient.refetchQueries({ queryKey: ['activeSession'] });
          queryClient.refetchQueries({ queryKey: ['reservations'] });
          queryClient.refetchQueries({ queryKey: ['profile'] });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[RealtimeSync] Channel error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}
