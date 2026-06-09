import { useState, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useReservationHistory } from '../../../hooks/useParking';
import { History, Loader2 } from 'lucide-react';
import ReservationStats from '../../../components/reservations/ReservationStats';
import SessionCard from '../../../components/reservations/SessionCard';
import SessionDetailModal from '../../../components/reservations/SessionDetailModal';

export default function UserReservationsPage() {
  const { user } = useAuth();
  const { data: sessions = [], isLoading: loading } = useReservationHistory(user?.id);
  const [selectedSession, setSelectedSession] = useState(null);

  const getMostUsedSlot = useCallback(() => {
    if (sessions.length === 0) return '-';
    const counts = sessions.reduce((acc, s) => {
      const num = s.parking_slots?.number;
      if (num) acc[num] = (acc[num] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b), '-');
  }, [sessions]);

  const calculateDuration = (start, end, status) => {
    const startTime = new Date(start);
    const endTime = status === 'active' ? new Date() : new Date(end);
    const diffInMs = endTime - startTime;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMins / 60);
    const mins = diffInMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center font-black text-[#003366] bg-gray-50">
        <Loader2 className="animate-spin mb-4" size={50} />
        <p className="uppercase italic tracking-[0.3em] text-base md:text-lg px-4">Cargando Historial UCE...</p>
      </div>
    );

  return (
    <div className="p-4 md:p-6 lg:p-12 max-w-7xl mx-auto min-h-[60vh] flex flex-col bg-gray-50/50 relative">
      <div className="mb-6 md:mb-10 shrink-0">
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-[#003366] p-3 md:p-4 rounded-2xl shadow-xl shrink-0">
            <History className="text-white" size={28} />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl md:text-5xl font-black text-[#003366] uppercase italic tracking-tighter leading-none">
              Mi Actividad
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] md:text-xs tracking-widest mt-1 md:mt-2 ml-1">
              Panel de Control de Estacionamiento
            </p>
          </div>
        </div>
        <ReservationStats sessions={sessions} getMostUsedSlot={getMostUsedSlot} />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 md:pr-4 custom-scrollbar-sm pb-10">
        <div className="grid gap-4 md:gap-6">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              calculateDuration={calculateDuration}
              onViewLocation={setSelectedSession}
            />
          ))}
        </div>
      </div>

      {selectedSession && (
        <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}
