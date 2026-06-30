import { paymentApi } from '@/lib/api';

export interface Receipt {
  receiptNumber: string;
  paymentId: string;
  reservationId: string;
  vehicle: Record<string, unknown>;
  user: Record<string, unknown>;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
  free?: boolean;
}

export interface PaymentRecord {
  id: string;
  reservationId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  fee?: { amount: number; currency: string; durationMinutes: number };
}

export const paymentService = {
  async createFromReservation(reservationId: string): Promise<PaymentRecord> {
    const { data } = await paymentApi.post<PaymentRecord>('/payments/from-reservation', {
      reservationId,
    });
    return data;
  },

  async createCheckoutSession(paymentId: string): Promise<CheckoutSession> {
    const { data } = await paymentApi.post<CheckoutSession>(
      `/payments/${paymentId}/checkout`,
    );
    return data;
  },

  async getByReservation(reservationId: string): Promise<PaymentRecord[]> {
    const { data } = await paymentApi.get<PaymentRecord[]>(
      `/payments/reservation/${reservationId}`,
    );
    return data;
  },

  async startCheckoutFlow(reservationId: string): Promise<CheckoutSession> {
    let payment: PaymentRecord | null = null;
    try {
      const payments = await this.getByReservation(reservationId);
      const pending = payments.find((p) => p.status === 'PENDING');
      const completed = payments.find((p) => p.status === 'COMPLETED');

      if (completed) {
        return { url: '', sessionId: '', free: true };
      }
      if (pending) {
        payment = pending;
      }
    } catch {
    }

    if (!payment) {
      payment = await this.createFromReservation(reservationId);
    }

    if (Number(payment.amount) === 0) {
      return { url: '', sessionId: '', free: true };
    }

    return this.createCheckoutSession(payment.id);
  },

  async getReceipt(paymentId: string): Promise<Receipt> {
    const { data } = await paymentApi.get<Receipt>(`/payments/${paymentId}/receipt`);
    return data;
  },

  async getReceiptByReservation(reservationId: string): Promise<Receipt> {
    const { data } = await paymentApi.get<Receipt>(`/payments/reservation/${reservationId}/receipt`);
    return data;
  },
};