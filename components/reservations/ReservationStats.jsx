import { Car, Timer, TrendingUp } from 'lucide-react';

/**
 * Displays summary statistics for user's parking reservations:
 * total count, most used slot, and current status (on campus / away).
 */
export default function ReservationStats({ sessions, getMostUsedSlot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border-b-4 border-[#CC0000] flex items-center gap-4 md:gap-5">
        <div className="bg-red-50 p-3 rounded-xl shrink-0">
          <Car className="text-[#CC0000]" size={28} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-gray-400 uppercase">Total Reservas</p>
          <p className="text-2xl md:text-3xl font-black text-[#003366]">{sessions.length}</p>
        </div>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border-b-4 border-[#003366] flex items-center gap-4 md:gap-5">
        <div className="bg-blue-50 p-3 rounded-xl shrink-0">
          <TrendingUp className="text-[#003366]" size={28} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-gray-400 uppercase">Puesto Favorito</p>
          <p className="text-2xl md:text-3xl font-black text-[#003366]">{getMostUsedSlot()}</p>
        </div>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border-b-4 border-green-500 flex items-center gap-4 md:gap-5">
        <div className="bg-green-50 p-3 rounded-xl shrink-0">
          <Timer className="text-green-600" size={28} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-gray-400 uppercase">Estado Actual</p>
          <p className="text-lg md:text-xl font-black text-green-600 uppercase italic">
            {sessions[0]?.status === 'active' ? 'En el campus' : 'Fuera'}
          </p>
        </div>
      </div>
    </div>
  );
}
