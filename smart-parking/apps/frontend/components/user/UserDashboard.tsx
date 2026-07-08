'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { parkingService, type Slot, type Zone } from '@/services/parking.service';
import { reservationService } from '@/services/reservation.service';
import { vehicleService } from '@/services/user.service';
import { aiService } from '@/services/ai.service';
import ZoneMenu from './ZoneMenu';
import SmartSuggestionCard, { type SuggestionType } from './SmartSuggestionCard';
import MapView from '../map/MapView';
import { CENTRO_UCE } from '../map/mapConstants';

interface SmartSuggestion {
  type: SuggestionType;
  slot: Slot;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const [flyToZone, setFlyToZone] = useState<any>(null);
  const [zonesMenuOpen, setZonesMenuOpen] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState<SmartSuggestion | null>(null);
  const [aiChecked, setAiChecked] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [z, s] = await Promise.all([
        parkingService.getZones(),
        parkingService.getSlots(),
      ]);
      setZones(z);
      setSlots(s);

      const savedActive = localStorage.getItem('my_reserved_slot_id');
      if (savedActive) {
        const mySlot = s.find((slot) => slot.id === savedActive);
        if (!mySlot || (mySlot.status !== 'RESERVED' && mySlot.status !== 'OCCUPIED')) {
          localStorage.removeItem('my_reserved_slot_id');
          setActiveSession(null);
        } else {
          setActiveSession(savedActive);
        }
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 0);

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedActive = localStorage.getItem('my_reserved_slot_id');
      setActiveSession(savedActive);
    };
    window.addEventListener('storage', handleStorageChange);
    const pollLocal = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollLocal);
    };
  }, []);

  useEffect(() => {
    if (!slots.length || activeSession || aiChecked) return;

    const askRecommendation = (lat?: number, lng?: number) => {
      aiService
        .getRecommendations(lat, lng)
        .then((result) => {
          if (!result.slotIds?.length) return;

          const topSlotId = result.slotIds[0];
          const slot = slots.find((s) => s.id === topSlotId);

          if (!slot || slot.status !== 'AVAILABLE') return;

          const wasReplaced = !!result.replacedFavorite;
          setAiSuggestion({
            type: wasReplaced ? 'ai-alternative' : 'ai',
            slot,
          });
        })
        .catch((err) => {
          // El ai-service puede no estar disponible; no rompemos el dashboard por esto
          console.error('No se pudo obtener recomendación del ai-service:', err);
        })
        .finally(() => setAiChecked(true));
    };

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => askRecommendation(pos.coords.latitude, pos.coords.longitude),
        () => askRecommendation(CENTRO_UCE[0], CENTRO_UCE[1]),
        { timeout: 3000 },
      );
    } else {
      askRecommendation(CENTRO_UCE[0], CENTRO_UCE[1]);
    }
  }, [slots, activeSession, aiChecked]);

  const smartSuggestion = useMemo<SmartSuggestion | null>(() => {
    if (suggestionDismissed || activeSession) return null;
    return aiSuggestion;
  }, [aiSuggestion, suggestionDismissed, activeSession]);

  const handleAcceptSuggestion = async () => {
    const slot = smartSuggestion?.slot;
    if (!slot || !user?.id) return;
    setIsReserving(true);
    try {
      const vehicle = await vehicleService.getMyVehicle();
      if (!vehicle) {
        console.error('Debes registrar un vehículo antes de reservar');
        return;
      }

      const reservation = await reservationService.create({ slotId: slot.id, vehicleId: vehicle.id });

      localStorage.setItem('my_reserved_slot_id', slot.id);
      setActiveSession(slot.id);

      setFlyToZone({ centerLatitude: slot.latitude, centerLongitude: slot.longitude });
      setSuggestionDismissed(true);
      fetchData();
    } catch (err) {
      console.error('Error reservando el puesto sugerido:', err);
    } finally {
      setIsReserving(false);
    }
  };

  const handleGoToZone = (zone: Zone) => {
    setFlyToZone(zone);
    setZonesMenuOpen(false);
  };

  return (
    <div className="w-full relative flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      <div className="flex-grow w-full rounded-2xl md:rounded-[3rem] overflow-hidden border-2 md:border-4 border-white bg-white shadow-2xl relative z-0">
        <MapView flyToZone={flyToZone} setSuggestionDismissed={setSuggestionDismissed} />
      </div>

      <ZoneMenu
        zones={zones}
        zonesMenuOpen={zonesMenuOpen}
        onToggle={() => setZonesMenuOpen((o) => !o)}
        onSelectZone={handleGoToZone}
      />

      {smartSuggestion && !suggestionDismissed && !activeSession && (
        <SmartSuggestionCard
          suggestion={smartSuggestion}
          onDismiss={() => setSuggestionDismissed(true)}
          onReserve={handleAcceptSuggestion}
          isReserving={isReserving}
        />
      )}
    </div>
  );
}