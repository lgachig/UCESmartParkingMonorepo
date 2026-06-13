'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { parkingService, type Slot, type Zone } from '@/services/parking.service';
import ZoneMenu from './ZoneMenu';
import SmartSuggestionCard from './SmartSuggestionCard';
import MapView from '../map/MapView';

export default function UserDashboard() {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('my_reservation_history');
      if (savedHistory) {
        try { return JSON.parse(savedHistory); } catch {}
      }
    }
    return [];
  });
  const [activeSession, setActiveSession] = useState<string | null>(null);
  
  const [flyToZone, setFlyToZone] = useState<any>(null);
  const [zonesMenuOpen, setZonesMenuOpen] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

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

    // Refresh slots periodically
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Keep track of activeSession changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedActive = localStorage.getItem('my_reserved_slot_id');
      setActiveSession(savedActive);

      const savedHistory = localStorage.getItem('my_reservation_history');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch {
          setHistory([]);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Poll storage local changes manually too
    const pollLocal = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollLocal);
    };
  }, []);

  const credits = useMemo(() => {
    const limit = user?.role === 'PROFESSOR' ? 5 : 3;
    // Calculate spent credits from history
    return Math.max(0, limit - history.length);
  }, [user, history]);

  const usualSlotNumber = useMemo(() => {
    if (!history?.length) return null;
    const counts = history.reduce((acc: any, num: string) => {
      acc[num] = (acc[num] || 0) + 1;
      return acc;
    }, {});
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    return entries.reduce((a: any, b: any) => (counts[a[0]] >= counts[b[0]] ? a : b))[0];
  }, [history]);

  const usualSlot = useMemo(
    () => (usualSlotNumber ? slots.find((s) => String(s.number) === String(usualSlotNumber)) : null),
    [slots, usualSlotNumber]
  );

  const smartSuggestion = useMemo(() => {
    if (suggestionDismissed || credits === 0 || activeSession) {
      return null;
    }
    if (usualSlot && usualSlot.status === 'AVAILABLE') {
      return { type: 'usual', slot: usualSlot };
    }
    return null;
  }, [credits, usualSlot, suggestionDismissed, activeSession]);

  const handleAcceptUsualSpot = async () => {
    const slot = smartSuggestion?.slot;
    if (!slot || !user?.id) return;
    setIsReserving(true);
    try {
      await parkingService.reserveSlot(slot.id);
      
      // Update local reservation
      localStorage.setItem('my_reserved_slot_id', slot.id);
      setActiveSession(slot.id);

      // Add to history
      const nextHistory = [...history, slot.number];
      localStorage.setItem('my_reservation_history', JSON.stringify(nextHistory));
      setHistory(nextHistory);

      setFlyToZone({ centerLatitude: slot.latitude, centerLongitude: slot.longitude });
      setSuggestionDismissed(true);
      fetchData();
    } catch (err) {
      console.error('Error reserving usual spot:', err);
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
          onReserve={handleAcceptUsualSpot}
          isReserving={isReserving}
        />
      )}
    </div>
  );
}
