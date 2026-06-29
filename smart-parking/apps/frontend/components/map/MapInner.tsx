'use client';

import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { CENTRO_UCE } from './mapConstants';
import MapController from './MapController';
import CoordTracker from './CoordTracker';
import ActionToast from './ActionToast';
import SlotDetailCard from './SlotDetailCard';
import { useAuth } from '@/context/AuthContext';
import { parkingService, type Slot } from '@/services/parking.service';
import { reservationService, type Reservation } from '@/services/reservation.service';
import { paymentService } from '@/services/payment.service';
import { vehicleService } from '@/services/user.service';

interface MapInnerProps {
  flyToZone?: any;
  setSuggestionDismissed?: (val: boolean) => void;
}

export default function MapInner({ flyToZone, setSuggestionDismissed }: MapInnerProps) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [actionStatus, setActionStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ lat: string; lng: string; x: number; y: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ duration: number | null; distance: string | null }>({ duration: null, distance: null });

  const [myActiveSlotId, setMyActiveSlotId] = useState<string | null>(null);
  const [myActiveReservation, setMyActiveReservation] = useState<Reservation | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  const syncActiveReservation = useCallback(async (slotId: string | null) => {
    if (!slotId) { setMyActiveReservation(null); return; }
    try {
      const reservations = await reservationService.getMyReservations();
      const active = reservations.find(
        (r) => r.slotId === slotId && (r.status === 'PENDING' || r.status === 'ACTIVE'),
      );
      setMyActiveReservation(active ?? null);
    } catch {
      setMyActiveReservation(null);
    }
  }, []);

  const fetchSlots = useCallback(async () => {
    try {
      const data = await parkingService.getSlots();
      setSlots(data);
      const saved = localStorage.getItem('my_reserved_slot_id');
      if (saved) {
        const mySlot = data.find((s) => s.id === saved);
        if (!mySlot || (mySlot.status !== 'RESERVED' && mySlot.status !== 'OCCUPIED')) {
          localStorage.removeItem('my_reserved_slot_id');
          setMyActiveSlotId(null);
          setMyActiveReservation(null);
        } else {
          setMyActiveSlotId(saved);
          await syncActiveReservation(saved);
        }
      } else {
        setMyActiveSlotId(null);
        setMyActiveReservation(null);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  }, [syncActiveReservation]);

  const showPopup = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionStatus({ msg, type });
    setTimeout(() => setActionStatus(null), 4000);
  }, []);

  useEffect(() => {
    fetchSlots();
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
    const interval = setInterval(fetchSlots, 10000);
    return () => { navigator.geolocation.clearWatch(watchId); clearInterval(interval); };
  }, [fetchSlots]);

  useEffect(() => {
    if (!selectedSlot) return;
    const fresh = slots.find((s) => s.id === selectedSlot.id);
    if (!fresh) { setSelectedSlot(null); }
    else if (fresh.status !== selectedSlot.status) { setSelectedSlot(fresh); }
  }, [slots, selectedSlot]);

  const calculateETA = useCallback(async (uLat: number, uLng: number, sLat: number, sLng: number) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/foot/${uLng},${uLat};${sLng},${sLat}?overview=false`);
      const data = await res.json();
      if (data.routes?.[0]) {
        setRouteInfo({ duration: Math.round(data.routes[0].duration / 60), distance: (data.routes[0].distance / 1000).toFixed(1) });
      }
    } catch (err) { console.error('Error ETA:', err); }
  }, []);

  const trazarRutas = useCallback((destino: Slot, origen: { lat: number; lng: number } | null) => {
    if (!origen || !destino) return;
    calculateETA(origen.lat, origen.lng, destino.latitude, destino.longitude);
    fetch(`https://router.project-osrm.org/route/v1/foot/${origen.lng},${origen.lat};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`)
      .then((res) => res.json())
      .then((data) => { if (data.routes?.[0]) setRoutePoints(data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]])); })
      .catch((err) => console.error('Error fetching route:', err));
  }, [calculateETA]);

  // ── NUEVO: extrae siempre un string del error, nunca un objeto ──
  const extractErrorMessage = (err: any, fallback: string): string => {
    if (typeof err?.response?.data?.message === 'string') return err.response.data.message;
    if (typeof err?.response?.data?.error === 'string') return err.response.data.error;
    if (typeof err?.message === 'string') return err.message;
    return fallback;
  };

  const handleReserve = async () => {
    if (!selectedSlot) return;
    if (myActiveSlotId) { showPopup('Ya tienes una reserva activa.', 'error'); return; }
    setIsMutating(true);
    try {
      const vehicle = await vehicleService.getMyVehicle();
      if (!vehicle) { showPopup('Debes registrar un vehículo antes de reservar', 'error'); return; }

      await parkingService.reserveSlot(selectedSlot.id);

      let reservation: Reservation;
      try {
        reservation = await reservationService.create({ slotId: selectedSlot.id, vehicleId: vehicle.id });
      } catch (reservationErr: any) {
        try { await parkingService.releaseSlot(selectedSlot.id); } catch { /* ignore */ }
        showPopup(extractErrorMessage(reservationErr, 'No se pudo crear la reserva'), 'error');
        return;
      }

      localStorage.setItem('my_reserved_slot_id', selectedSlot.id);
      setMyActiveSlotId(selectedSlot.id);
      setMyActiveReservation(reservation);
      showPopup('¡Reserva exitosa! Tienes 10 min para llegar.', 'success');
      await fetchSlots();
    } catch (err: any) {
      showPopup(extractErrorMessage(err, 'Error al reservar'), 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const handleCheckIn = async () => {
    if (!myActiveReservation || myActiveReservation.status !== 'PENDING') return;
    setIsMutating(true);
    try {
      await reservationService.checkIn(myActiveReservation.id);
      if (selectedSlot) await parkingService.occupySlot(selectedSlot.id);
      showPopup('Check-in exitoso', 'success');
      await fetchSlots();
      await syncActiveReservation(myActiveSlotId);
    } catch (err: any) {
      showPopup(extractErrorMessage(err, 'Error en check-in'), 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const handleReleaseSlot = async (slotId: string) => {
    setIsReleasing(true);
    try {
      const reservations = await reservationService.getMyReservations();
      const active = reservations.find(
        (r) => r.slotId === slotId && (r.status === 'PENDING' || r.status === 'ACTIVE'),
      );

      if (active?.status === 'PENDING') {
        await reservationService.cancel(active.id);
        try { await parkingService.releaseSlot(slotId); } catch { /* ya liberado */ }
        localStorage.removeItem('my_reserved_slot_id');
        setMyActiveSlotId(null); setMyActiveReservation(null); setSelectedSlot(null); setRoutePoints([]);
        showPopup('Reserva cancelada', 'success');
        await fetchSlots();
        return;
      }

      if (active?.status === 'ACTIVE') {
        let completed: Reservation;
        try {
          completed = await reservationService.checkOut(active.id);
        } catch (err: any) {
          showPopup(extractErrorMessage(err, 'Error al finalizar sesión'), 'error');
          return;
        }

        let checkout;
        try {
          checkout = await paymentService.startCheckoutFlow(completed.id);
        } catch {
          // Stripe falló pero ya se hizo checkout — guardar para pagar desde Mis Reservas
          localStorage.setItem('pending_payment_reservation_id', completed.id);
          try { await parkingService.releaseSlot(slotId); } catch { /* ignore */ }
          localStorage.removeItem('my_reserved_slot_id');
          setMyActiveSlotId(null); setMyActiveReservation(null); setSelectedSlot(null); setRoutePoints([]);
          await fetchSlots();
          showPopup('Sesión finalizada. Paga desde "Mis Reservas".', 'info');
          return;
        }

        localStorage.setItem('pending_payment_reservation_id', completed.id);
        try { await parkingService.releaseSlot(slotId); } catch { /* ignore */ }
        localStorage.removeItem('my_reserved_slot_id');
        setMyActiveSlotId(null); setMyActiveReservation(null); setSelectedSlot(null); setRoutePoints([]);

        if (checkout.free) {
          localStorage.removeItem('pending_payment_reservation_id');
          showPopup('Sesión finalizada sin cargo', 'success');
          await fetchSlots();
          return;
        }

        window.location.href = checkout.url;
        return;
      }

      try { await parkingService.releaseSlot(slotId); } catch { /* ignore */ }
      localStorage.removeItem('my_reserved_slot_id');
      setMyActiveSlotId(null); setMyActiveReservation(null); setSelectedSlot(null); setRoutePoints([]);
      showPopup('Espacio liberado', 'success');
      await fetchSlots();
    } catch (err: any) {
      showPopup(extractErrorMessage(err, 'Error al finalizar sesión'), 'error');
    } finally {
      setIsReleasing(false);
    }
  };

  if (loading) {
    return <div className="h-full w-full flex items-center justify-center font-black text-[#003366] animate-pulse">CARGANDO MAPA...</div>;
  }

  const limit = user?.role === 'PROFESSOR' ? 5 : 3;
  const reservasText = `${myActiveSlotId ? 1 : 0} / ${limit} semanales`;
  const isMineNow = selectedSlot && myActiveSlotId && String(selectedSlot.id) === String(myActiveSlotId);

  return (
    <div className="h-full w-full relative min-h-[500px]">
      {actionStatus && <ActionToast type={actionStatus.type} msg={actionStatus.msg} />}

      {hoverCoords && (
        <div
          className="pointer-events-none absolute z-[5000] bg-[#003366] text-white px-3 py-1.5 rounded-xl text-[10px] font-mono border-2 border-white shadow-2xl"
          style={{ left: hoverCoords.x + 15, top: hoverCoords.y + 15 }}
        >
          <span className="font-bold">{hoverCoords.lat}, {hoverCoords.lng}</span>
        </div>
      )}

      <MapContainer center={CENTRO_UCE} zoom={19} maxZoom={22} className="h-full w-full z-0 rounded-3xl md:rounded-[3rem]">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={19} maxZoom={22} />
        <MapController selectedSlot={selectedSlot} flyToZone={flyToZone} />
        <CoordTracker setHoverCoords={setHoverCoords} showPopup={showPopup} />

        {userLocation && (
          <Circle center={[userLocation.lat, userLocation.lng]} radius={3}
            pathOptions={{ color: 'white', fillColor: '#2563EB', fillOpacity: 1, weight: 3 }} />
        )}

        {slots.map((slot) => {
          const isMine = myActiveSlotId && String(slot.id) === String(myActiveSlotId);
          const isSelected = selectedSlot?.id === slot.id;
          const color = slot.status === 'AVAILABLE' ? '#22C55E' : isMine ? '#2563EB' : '#EF4444';
          return (
            <Marker key={slot.id} position={[slot.latitude, slot.longitude]}
              eventHandlers={{
                click: () => {
                  if (myActiveSlotId && !isMine) { showPopup('Ya tienes una reserva activa.', 'error'); return; }
                  if (slot.status !== 'AVAILABLE' && !isMine) { showPopup('Este espacio no está disponible.', 'error'); return; }
                  setSuggestionDismissed?.(true);
                  setSelectedSlot(slot);
                  trazarRutas(slot, userLocation);
                },
              }}
              icon={L.divIcon({
                html: `<div style="background:${color}; width:30px; height:30px; border-radius:8px; border:3px solid white; display:flex; align-items:center; justify-content:center; color:white; font-weight:900; transition: 0.3s; transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'}">${isSelected ? 'P' : ''}</div>`,
                className: '',
              })}
            />
          );
        })}

        {routePoints.length > 0 && (
          <Polyline positions={routePoints} pathOptions={{ color: '#2563EB', weight: 6, opacity: 0.5 }} />
        )}
      </MapContainer>

      {selectedSlot && (
        <SlotDetailCard
          selectedSlot={selectedSlot}
          isMineNow={!!isMineNow}
          reservationStatus={
            myActiveReservation && String(myActiveReservation.slotId) === String(selectedSlot.id)
              ? myActiveReservation.status : null
          }
          routeInfo={routeInfo}
          reservasText={reservasText}
          isReleasing={isReleasing}
          isMutating={isMutating}
          hasActiveReservation={!!myActiveSlotId}
          onReserve={handleReserve}
          onCheckIn={handleCheckIn}
          onRelease={handleReleaseSlot}
        />
      )}
    </div>
  );
}