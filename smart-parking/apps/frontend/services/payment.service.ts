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
  stripeSessionId?: string | null;
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
    let existingPayments: PaymentRecord[] = [];
    try {
      existingPayments = await this.getByReservation(reservationId);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status && status !== 404 && status !== 404) {
        throw err;
      }
    }

    const completed = existingPayments.find((p) => p.status === 'COMPLETED');
    if (completed) {
      return { url: '', sessionId: '', free: true };
    }

    const pending = existingPayments.find((p) => p.status === 'PENDING');

    if (pending) {
      const amount = Number(pending.amount);
      if (amount === 0) {
        return { url: '', sessionId: '', free: true };
      }
      return this.createCheckoutSession(pending.id);
    }

    let payment: PaymentRecord;
    try {
      payment = await this.createFromReservation(reservationId);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        const retried = await this.getByReservation(reservationId);
        const retryPending = retried.find((p) => p.status === 'PENDING');
        const retryCompleted = retried.find((p) => p.status === 'COMPLETED');
        if (retryCompleted) return { url: '', sessionId: '', free: true };
        if (retryPending) {
          if (Number(retryPending.amount) === 0) return { url: '', sessionId: '', free: true };
          return this.createCheckoutSession(retryPending.id);
        }
      }
      throw err;
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