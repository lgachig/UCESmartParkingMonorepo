import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { useZones, useSlots, useReservationHistory, useReserveSlot, useActiveSession } from '../../../hooks/useParking';
import ZoneMenu from '../../../components/user/ZoneMenu';
import SmartSuggestionCard from '../../../components/user/SmartSuggestionCard';

const MarkingMap = lazy(() => import('../../../components/map/MapView'));

/**
 * User dashboard: map, zones menu, smart suggestion. Realtime updates come from RealtimeSync (admin end session → UI updates at once).
 */
export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { user, profile, refetchProfile } = useAuth();
  const { data: activeSession } = useActiveSession(user?.id);
  const { data: zones = [] } = useZones();
  const { data: slots = [] } = useSlots();
  const { data: sessions = [] } = useReservationHistory(user?.id);
  const { mutate: reserve, isMutating: isReserving } = useReserveSlot();

  const [flyToZone, setFlyToZone] = useState(null);
  const [zonesMenuOpen, setZonesMenuOpen] = useState(false);
  const [smartSuggestion, setSmartSuggestion] = useState(null);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  const credits = useMemo(() => {
    const limit = profile?.role_id === 'r002' ? 5 : 3;
    return Math.max(0, limit - (profile?.reservations_this_week || 0));
  }, [profile]);

  const usualSlotNumber = useMemo(() => {
    if (!sessions?.length) return null;
    const counts = sessions.reduce((acc, s) => {
      const num = s.parking_slots?.number;
      if (num) acc[num] = (acc[num] || 0) + 1;
      return acc;
    }, {});
    const entries = Object.entries(counts);
    return entries.length === 0 ? null : entries.reduce((a, b) => (counts[a[0]] >= counts[b[0]] ? a : b))[0];
  }, [sessions]);

  const usualSlot = useMemo(
    () => (usualSlotNumber ? slots.find((s) => String(s.number) === String(usualSlotNumber)) : null),
    [slots, usualSlotNumber]
  );

  useEffect(() => {
    if (suggestionDismissed || credits === 0 || activeSession) {
      setSmartSuggestion(null);
    } else if (usualSlot && usualSlot.status === 'available') {
      setSmartSuggestion({ type: 'usual', slot: usualSlot });
    }
  }, [credits, usualSlot, suggestionDismissed, activeSession]);

  const handleAcceptUsualSpot = async () => {
    const slot = smartSuggestion?.slot;
    if (!slot || !user?.id) return;
    try {
      await reserve({ slotId: slot.id, userId: user.id });
      if (refetchProfile) await refetchProfile();
      queryClient.refetchQueries({ queryKey: ['activeSession', user.id] });
      queryClient.refetchQueries({ queryKey: ['slots'] });
      setFlyToZone({ center_latitude: slot.latitude, center_longitude: slot.longitude });
      setSuggestionDismissed(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoToZone = (zone) => {
    setFlyToZone(zone);
    setZonesMenuOpen(false);
  };

  return (
    <div className="w-full relative flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
      <div className="flex-1 w-full rounded-2xl md:rounded-[3rem] overflow-hidden border-2 md:border-4 border-white shadow-2xl relative z-0">
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center font-black animate-pulse bg-slate-100">GPS UCE...</div>}>
          <MarkingMap flyToZone={flyToZone} setSuggestionDismissed={setSuggestionDismissed} />
        </Suspense>
      </div>

      <ZoneMenu zones={zones} zonesMenuOpen={zonesMenuOpen} onToggle={() => setZonesMenuOpen((o) => !o)} onSelectZone={handleGoToZone} />

      {smartSuggestion && !suggestionDismissed && !activeSession && (
        <SmartSuggestionCard
          suggestion={smartSuggestion}
          onDismiss={() => setSuggestionDismissed(true)}
          onReserve={handleAcceptUsualSpot}
          isReserving={isReserving}
        />
      )}
    </div>
  );
}
