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
}

export const paymentService = {
  async getReceipt(paymentId: string): Promise<Receipt> {
    const { data } = await paymentApi.get<Receipt>(`/payments/${paymentId}/receipt`);
    return data;
  },

  async getReceiptByReservation(reservationId: string): Promise<Receipt> {
    const { data } = await paymentApi.get<Receipt>(`/payments/reservation/${reservationId}/receipt`);
    return data;
  },
};