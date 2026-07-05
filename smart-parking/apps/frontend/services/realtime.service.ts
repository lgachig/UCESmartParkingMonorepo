import { io, Socket } from 'socket.io-client';
import { env } from '@/lib/env';
import type { SlotStatus } from './parking.service';

export interface SlotUpdateEvent {
  eventType: string;
  id: string;
  number?: number;
  status?: SlotStatus;
  previousStatus?: string;
  zoneId?: number;
  facultyId?: number;
  timestamp: string;
  latitude?: number;
  longitude?: number;
}

export interface RealtimeSubscription {
  zoneId?: number;
  facultyId?: number;
}

type SlotUpdateHandler = (event: SlotUpdateEvent) => void;

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(`${env.realtimeUrl}/realtime`, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });
  }
  return socket;
}

export const realtimeService = {
  connect(subscription?: RealtimeSubscription): Socket {
    const s = getSocket();
    if (subscription?.zoneId !== undefined) {
      s.io.opts.query = { ...s.io.opts.query, zoneId: subscription.zoneId };
    }
    if (subscription?.facultyId !== undefined) {
      s.io.opts.query = { ...s.io.opts.query, facultyId: subscription.facultyId };
    }
    if (!s.connected) {
      s.connect();
    }
    return s;
  },

  subscribe(subscription: RealtimeSubscription): void {
    getSocket().emit('subscribe', subscription);
  },

  unsubscribe(): void {
    getSocket().emit('unsubscribe');
  },

  onSlotUpdate(handler: SlotUpdateHandler): () => void {
    const s = getSocket();
    s.on('slot:update', handler);
    return () => s.off('slot:update', handler);
  },

  onConnectionChange(onChange: (connected: boolean) => void): () => void {
    const s = getSocket();
    const onConnect = () => onChange(true);
    const onDisconnect = () => onChange(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  },

  disconnect(): void {
    socket?.disconnect();
  },
};