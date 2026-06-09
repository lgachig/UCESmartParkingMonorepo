import { MapPin, X, Info, TrendingUp } from 'lucide-react';

/**
 * Modal displaying detailed information about a selected parking session,
 * including slot number, sector, and coordinates.
 */
export default function SessionDetailModal({ session, onClose }) {
  if (!session) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#003366]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-lg rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-red-50 text-gray-400 hover:text-[#CC0000] rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={28} />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-50 text-[#003366] rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner">
            <MapPin size={40} className="md:w-12 md:h-12" />
          </div>

          <h3 className="text-2xl md:text-4xl font-black text-[#003366] uppercase italic tracking-tighter">
            Puesto {session.parking_slots?.number}
          </h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Detalles de Referencia</p>

          <div className="mt-6 md:mt-8 space-y-4">
            <div className="flex justify-between items-center p-4 md:p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-[#CC0000] shrink-0" />
                <span className="text-xs font-black text-gray-400 uppercase">Sector:</span>
              </div>
              <span className="text-xs font-bold text-[#003366]">Facultad de Ingeniería</span>
            </div>

            <div className="flex justify-between items-center p-4 md:p-5 bg-gray-50 rounded-2xl border border-gray-100 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <TrendingUp size={18} className="text-[#003366] shrink-0" />
                <span className="text-xs font-black text-gray-400 uppercase">Coordenadas:</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white px-3 py-1 rounded-lg shadow-sm truncate">
                {session.parking_slots?.latitude}, {session.parking_slots?.longitude}
              </span>
            </div>
          </div>

          <p className="mt-4 md:mt-6 text-sm text-gray-500 italic font-medium px-4">
            &quot;Ubicado en el área sombreada junto al edificio administrativo.&quot;
          </p>

          <button
            onClick={onClose}
            className="w-full mt-8 md:mt-10 py-4 md:py-5 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-800 transition-all active:scale-95"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
}
