import { LogOut, Navigation, Loader2, Clock, AlertTriangle } from 'lucide-react';

/**
 * Bottom card on map when a slot is selected: shows slot info, ETA, reserve/release actions.
 */
export default function SlotDetailCard({
  selectedSlot,
  isMineNow,
  routeInfo,
  reservasText,
  isReleasing,
  isMutating,
  hasActiveReservation,
  onReserve,
  onRelease,
}) {
  const limit = reservasText?.split('/')[1]?.trim() || '3';
  const canReserve = selectedSlot?.status === 'available' && !hasActiveReservation;

  return (
    <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[92%] max-w-md bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-2xl border-t-4 border-[#003366]">
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white font-black ${
            isMineNow ? 'bg-blue-600' : selectedSlot?.status === 'available' ? 'bg-[#003366]' : 'bg-[#CC0000]'
          }`}
        >
          <span className="text-[10px] opacity-70">Nº</span>
          <span className="text-2xl">{selectedSlot?.number}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">
            UCE Smart Parking
          </p>
          <h3 className="text-xl font-black text-[#003366] italic uppercase">
            {isMineNow ? 'Tu Reserva Activa' : 'Espacio Parqueo'}
          </h3>
        </div>
      </div>

      {routeInfo?.duration != null && (
        <div className="flex items-center justify-between mb-5 px-5 py-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
          <div className="flex items-center gap-3 text-[#003366]">
            <Clock size={22} className="animate-pulse" />
            <div>
              <p className="text-[9px] font-bold uppercase opacity-60 leading-none">Tiempo</p>
              <span className="text-2xl font-black italic">{routeInfo.duration} MIN</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase opacity-60 leading-none">Distancia</p>
            <span className="text-sm font-black text-gray-500">{routeInfo.distance} KM</span>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
        <AlertTriangle size={14} className="text-amber-600" />
        <p className="text-[10px] font-bold text-amber-800 uppercase">Reserva: {reservasText}</p>
      </div>

      <div className="flex flex-col gap-3">
        {isMineNow ? (
          <button
            onClick={() => onRelease(selectedSlot?.id)}
            disabled={isReleasing}
            className="w-full py-5 bg-[#CC0000] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3"
          >
            {isReleasing ? <Loader2 className="animate-spin" /> : <><LogOut size={20} /> FINALIZAR SESIÓN</>}
          </button>
        ) : (
          <button
            onClick={onReserve}
            disabled={!canReserve || isMutating}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg ${
              canReserve ? 'bg-[#003366] text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            {isMutating ? <Loader2 className="animate-spin" /> : selectedSlot?.status === 'available' ? <><Navigation size={20} /> RESERVAR</> : 'OCUPADO'}
          </button>
        )}
      </div>
    </div>
  );
}
