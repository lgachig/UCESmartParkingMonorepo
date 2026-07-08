import { reservationApi } from '@/lib/api';

export interface Reservation {
  id: string;
  userId: string;
  vehicleId: string;
  slotId: string;
  reservationCode: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  reservedAt: string;
  expiresAt: string;
  checkInAt?: string;
  checkOutAt?: string;
  durationMinutes?: number;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const reservationService = {
  async getRecent(params?: { limit?: number; startDate?: string; endDate?: string }): Promise<Reservation[]> {
    const search = new URLSearchParams();
    if (params?.limit) search.append('limit', String(params.limit));
    if (params?.startDate) search.append('startDate', params.startDate);
    if (params?.endDate) search.append('endDate', params.endDate);
    const { data } = await reservationApi.get<Reservation[]>(`/reservations/recent?${search.toString()}`);
    return data;
  },

  async getStatistics(): Promise<{
    total_reservations: number;
    active_reservations: number;
    completed_reservations: number;
    cancelled_reservations: number;
    expired_reservations: number;
    average_duration: number;
  }> {
    const { data } = await reservationApi.get('/reservations/statistics');
    return data;
  },

  async getMyReservations(): Promise<Reservation[]> {
    const { data } = await reservationApi.get<Reservation[]>('/reservations/my-reservations');
    return data;
  },

  async create(payload: { slotId: string; vehicleId: string }): Promise<Reservation> {
    const { data } = await reservationApi.post<Reservation>('/reservations', payload);
    return data;
  },

  async cancel(id: string): Promise<Reservation> {
    const { data } = await reservationApi.put<Reservation>(`/reservations/${id}/cancel`);
    return data;
  },

  async checkIn(id: string): Promise<Reservation> {
    const { data } = await reservationApi.post<Reservation>(`/reservations/${id}/check-in`);
    return data;
  },

  async checkOut(id: string): Promise<Reservation> {
    const { data } = await reservationApi.post<Reservation>(`/reservations/${id}/check-out`);
    return data;
  },

  async adminCancelReservation(reservationId: string): Promise<Reservation> {
    const { data } = await reservationApi.patch<Reservation>(
      `/internal/reservations/${reservationId}/admin-cancel`,
      {},
      { headers: { 'x-service-key': process.env.NEXT_PUBLIC_INTERNAL_SERVICE_KEY ?? 'internal_service_secret_key' } },
    );
    return data;
  },

  async getBySlot(slotId: string): Promise<Reservation[]> {
    const { data } = await reservationApi.get<Reservation[]>(
      `/internal/reservations/slot/${slotId}`,
      { headers: { 'x-service-key': process.env.NEXT_PUBLIC_INTERNAL_SERVICE_KEY ?? 'internal_service_secret_key' } },
    );
    return data;
  },
};