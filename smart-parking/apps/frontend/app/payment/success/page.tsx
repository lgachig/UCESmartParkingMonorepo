'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Receipt, ArrowLeft, Loader2 } from 'lucide-react';
import { paymentService, type Receipt as ReceiptType } from '@/services/payment.service';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('payment_id');
  const reservationId = searchParams.get('reservation_id');

  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!paymentId && !reservationId) {
        setLoading(false);
        return;
      }
      try {
        let data: ReceiptType;
        if (paymentId) {
          data = await paymentService.getReceipt(paymentId);
        } else {
          data = await paymentService.getReceiptByReservation(reservationId!);
        }
        setReceipt(data);
      } catch {
        setError('No se pudo cargar el recibo. El pago fue procesado exitosamente.');
      } finally {
        setLoading(false);
      }
    };

    // Esperar un momento para que el webhook procese
    const timer = setTimeout(fetchReceipt, 2000);
    return () => clearTimeout(timer);
  }, [paymentId, reservationId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¡Pago Exitoso!</h1>
          <p className="text-gray-500 mt-1">Tu reserva ha sido confirmada.</p>
        </div>

        {/* Receipt */}
        {loading ? (
          <div className="flex flex-col items-center py-6 text-gray-400 gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Generando recibo…</span>
          </div>
        ) : receipt ? (
          <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
              <Receipt className="h-5 w-5" />
              <span>Recibo Digital</span>
            </div>
            <Row label="N° Recibo" value={receipt.receiptNumber} />
            <Row label="Reservación" value={receipt.reservationId} short />
            <Row label="Monto" value={`$${receipt.amount.toFixed(2)} ${receipt.currency}`} />
            <Row label="Método" value={receipt.paymentMethod} />
            <Row label="Estado" value={receipt.status} />
            <Row label="Fecha" value={new Date(receipt.createdAt).toLocaleString('es-EC')} />
          </div>
        ) : (
          error && (
            <div className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
              {error}
            </div>
          )
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => router.push('/user/reservations')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            Ver mis reservas
          </button>
          <button
            onClick={() => router.push('/user')}
            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, short }: { label: string; value: string; short?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">
        {short ? `…${value.slice(-8)}` : value}
      </span>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}