import { Calendar, Timer, MapPin } from 'lucide-react';

/**
 * Renders a single parking session card with slot info, status, date, duration,
 * and a button to view location details.
 */
export default function SessionCard({ session, calculateDuration, onViewLocation }) {
  return (
    <div
      className="group bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-md hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-[#003366]/10 flex flex-col md:flex-row items-center gap-6 md:gap-8"
    >
      <div
        className={`w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center font-black shrink-0 shadow-lg ${
          session.status === 'active' ? 'bg-[#CC0000] text-white' : 'bg-[#003366] text-white'
        }`}
      >
        <span className="text-[10px] uppercase opacity-60">Puesto</span>
        <span className="text-3xl md:text-4xl">{session.parking_slots?.number}</span>
      </div>

      <div className="flex-1 space-y-3 text-center md:text-left min-w-0">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase italic">Campus Central UCE</h2>
          <span
            className={`mx-auto md:mx-0 px-4 py-1 rounded-full text-[10px] font-black ${
              session.status === 'active' ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {session.status === 'active' ? '● SESIÓN ACTIVA' : 'FINALIZADO'}
          </span>
        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-3">
          <div className="flex items-center gap-2 text-gray-500 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-sm font-bold">
            <Calendar size={16} className="text-[#003366] shrink-0" />
            {new Date(session.start_time).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-[#CC0000] bg-red-50 px-4 py-2 rounded-xl text-sm font-black">
            <Timer size={16} className="shrink-0" />
            {calculateDuration(session.start_time, session.end_time, session.status)}
          </div>
        </div>
      </div>

      <button
        onClick={() => onViewLocation(session)}
        className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#003366] transition-all active:scale-95 shadow-lg"
      >
        <MapPin size={16} /> Ver Ubicación
      </button>
    </div>
  );
}
