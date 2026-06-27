'use client';

import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pago Cancelado</h1>
          <p className="text-gray-500 mt-1">
            No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 text-center mb-6">
          Tu reserva permanece activa. Debes completar el pago para confirmarla.
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </button>
          <button
            onClick={() => router.push('/user/reservations')}
            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver mis reservas
          </button>
        </div>
      </div>
    </div>
  );
}