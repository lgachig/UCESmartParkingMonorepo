import { X, Loader2 } from 'lucide-react';

/**
 * Suggestion to reserve the user's "usual" slot when it's available.
 */
export default function SmartSuggestionCard({ suggestion, onDismiss, onReserve, isReserving }) {
  if (!suggestion?.slot) return null;

  return (
    <div className="absolute bottom-4 md:bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-[92%] max-w-md bg-white p-4 md:p-5 rounded-2xl md:rounded-[2rem] shadow-2xl border-t-4 border-[#003366] flex flex-col gap-2 md:gap-3 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-start">
        <p className="font-black text-[#003366] uppercase text-xs md:text-sm">¿Tu puesto de siempre?</p>
        <button onClick={onDismiss} className="p-1 hover:bg-gray-100 rounded-full">
          <X size={18} className="md:w-[20px] md:h-[20px]" />
        </button>
      </div>
      <p className="text-gray-600 font-bold text-xs md:text-sm">
        Puesto #{suggestion.slot?.number} libre. Reserva ahora.
      </p>
      <button
        onClick={onReserve}
        disabled={isReserving}
        className="py-3 bg-[#003366] text-white rounded-xl font-black uppercase text-xs hover:bg-blue-900 transition-colors"
      >
        {isReserving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Sí, reservar'}
      </button>
    </div>
  );
}
