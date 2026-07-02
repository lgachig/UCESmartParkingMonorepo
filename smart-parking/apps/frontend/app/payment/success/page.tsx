'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentService, type Receipt } from '@/services/payment.service';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('payment_id');

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setError('No se encontró el ID del pago.');
      setLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 5;

    const fetchReceipt = async () => {
      try {
        const data = await paymentService.getReceipt(paymentId);
        setReceipt(data);
        setLoading(false);
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(fetchReceipt, 2000);
        } else {
          setError('El recibo aún no está disponible. El pago fue procesado correctamente.');
          setLoading(false);
        }
      }
    };

    fetchReceipt();
  }, [paymentId]);

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-md w-full text-white text-center shadow-2xl">

        {loading && (
          <>
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-black mb-2">Procesando pago...</h1>
            <p className="text-white/70 text-sm">Verificando con Stripe</p>
          </>
        )}

        {!loading && !error && receipt && (
          <>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-black mb-1">¡Pago exitoso!</h1>
            <p className="text-white/70 mb-6 text-sm">Tu sesión de parqueo ha sido registrada</p>

            <div className="bg-white/10 rounded-2xl p-5 text-left space-y-3 mb-6 border border-white/10">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Recibo N°</span>
                <span className="font-bold text-sm">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Monto</span>
                <span className="font-bold text-green-400 text-sm">
                  ${Number(receipt.amount).toFixed(2)} {receipt.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Estado</span>
                <span className="font-bold text-green-400 text-sm">COMPLETADO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Método</span>
                <span className="font-bold text-sm capitalize">{receipt.paymentMethod}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/user')}
              className="w-full py-3 bg-white text-[#003366] font-black rounded-2xl hover:bg-white/90 transition-all"
            >
              Volver al inicio
            </button>
          </>
        )}

        {!loading && (error || !receipt) && (
          <>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-black mb-1">¡Pago recibido!</h1>
            <p className="text-white/70 mb-6 text-sm">
              {error || 'Tu pago fue procesado. El recibo estará disponible en breve.'}
            </p>
            <button
              onClick={() => router.push('/user')}
              className="w-full py-3 bg-white text-[#003366] font-black rounded-2xl hover:bg-white/90 transition-all"
            >
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}