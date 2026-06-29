'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function CancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('payment_id');

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-md w-full text-white text-center shadow-2xl">

        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-3xl font-black mb-2">Pago cancelado</h1>
        <p className="text-white/70 mb-2 text-sm">
          No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
        </p>
        {paymentId && (
          <p className="text-white/40 text-xs mb-6">ID de pago: {paymentId}</p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push('/user')}
            className="w-full py-3 bg-white text-[#003366] font-black rounded-2xl hover:bg-white/90 transition-all"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
}