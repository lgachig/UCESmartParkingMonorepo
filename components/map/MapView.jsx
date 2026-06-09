import { useState, useCallback, useEffect } from 'react';
import { useSlots, useReserveSlot, useActiveSession, useReleaseSlot } from '../../hooks/useParking';
import { useAuth } from '../../hooks/useAuth';
import { MapContainer, TileLayer, Polyline, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { CENTRO_UCE } from './mapConstants';
import MapController from './MapController';
import CoordTracker from './CoordTracker';
import ActionToast from './ActionToast';
import SlotDetailCard from './SlotDetailCard';
import { useParkingStore } from '../../store/parkingStore';

/**
 * Main map view: shows slots, user location, routes. Subscribes to Realtime so slot and session changes (e.g. admin release) update without reload.
 * Clears selection when active session ends so the user can reserve another slot immediately.
 */
export default function MarkingMap({ flyToZone, setSuggestionDismissed }) {
  const { user, profile, refetchProfile } = useAuth();
  const initialSlots = useParkingStore(state => state.slots);
  const slotsLoading = initialSlots.length === 0;
  const { mutate: reserve, isMutating } = useReserveSlot();
  const { release, isFinishing: isReleasing } = useReleaseSlot();
  const { data: activeSessionData, isLoading: sessionLoading } = useActiveSession(user?.id);

  const myActiveSlotId =
  activeSessionData?.slot_id ??
  activeSessionData?.parking_slots?.id ??
  null;

  const mySlot = initialSlots.find(
    s => String(s.id) === String(myActiveSlotId)
  );

  const hasActiveReservation = !!activeSessionData;

  const [mounted, setMounted] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [hoverCoords, setHoverCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ duration: null, distance: null });

  const showPopup = useCallback((msg, type = 'success') => {
    setActionStatus({ msg, type });
    setTimeout(() => setActionStatus(null), 4000);
  }, []);

  // When admin ends session, activeSessionData becomes null; clear selection so user can reserve another slot.
  useEffect(() => {
    if (!activeSessionData) {
      setSelectedSlot(null);
      setRoutePoints([]);
    }
  }, [activeSessionData]);

  useEffect(() => {
    if (!selectedSlot) return;

    const freshSlot = initialSlots.find(s => s.id === selectedSlot.id);

    if (!freshSlot) {
      setSelectedSlot(null);
      return;
    }

    if (freshSlot.status !== selectedSlot.status) {
      setSelectedSlot(freshSlot);
    }
}, [initialSlots, selectedSlot]);

  useEffect(() => {
    setMounted(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const calculateETA = useCallback(async (uLat, uLng, sLat, sLng) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/foot/${uLng},${uLat};${sLng},${sLat}?overview=false`);
      const data = await res.json();
      if (data.routes?.[0]) {
        setRouteInfo({
          duration: Math.round(data.routes[0].duration / 60),
          distance: (data.routes[0].distance / 1000).toFixed(1),
        });
      }
    } catch (err) {
      console.error('Error ETA:', err);
    }
  }, []);

  const trazarRutas = useCallback(
    (destino, origen) => {
      if (!origen || !destino) return;
      calculateETA(origen.lat, origen.lng, destino.latitude, destino.longitude);
      fetch(
        `https://router.project-osrm.org/route/v1/foot/${origen.lng},${origen.lat};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.routes?.[0])
            setRoutePoints(data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]));
        });
    },
    [calculateETA]
  );

  const handleReserve = async () => {
    const limit = profile?.role_id === 'r002' ? 5 : 3;
    if ((profile?.reservations_this_week || 0) >= limit) {
      showPopup(`Límite alcanzado (${limit}/semana)`, 'error');
      return;
    }
    if (hasActiveReservation) {
      showPopup('Ya tienes una reserva activa.', 'error');
      return;
    }
    try {
      await reserve({ slotId: selectedSlot.id, userId: user.id });
      if (refetchProfile) await refetchProfile();
      showPopup('Reserva exitosa', 'success');
    } catch {
      showPopup('Error al reservar', 'error');
    }
  };

  const handleReleaseSlot = async (slotId) => {
    try {
      await release(slotId, user.id);
      if (refetchProfile) await refetchProfile();
      setSelectedSlot(null);
      setRoutePoints([]);
    } catch (err) {
      showPopup('Error al liberar', 'error');
    }
  };

  if (!mounted || slotsLoading || (user?.id && sessionLoading)) {
    return (
      <div className="h-full w-full flex items-center justify-center font-black text-[#003366]">
        CARGANDO MAPA...
      </div>
    );
  }

  const limit = profile?.role_id === 'r002' ? 5 : 3;
  const reservasText = `${profile?.reservations_this_week ?? 0} / ${limit} semanales`;
  const isMineNow = selectedSlot && myActiveSlotId && String(selectedSlot.id) === String(myActiveSlotId);

  return (
    <div className="h-full w-full relative">
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
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={3}
            pathOptions={{ color: 'white', fillColor: '#2563EB', fillOpacity: 1, weight: 3 }}
          />
        )}

        {initialSlots.map((slot) => {
          const isMine = myActiveSlotId && String(slot.id) === String(myActiveSlotId);
          const isSelected = selectedSlot?.id === slot.id;
          const color = slot.status === 'available' ? '#22C55E' : isMine ? '#2563EB' : '#EF4444';

          return (
            <Marker
              key={slot.id}
              position={[slot.latitude, slot.longitude]}
              eventHandlers={{
                click: () => {
                  if (hasActiveReservation && !isMine) {
                    showPopup('Ya tienes una reserva activa.', 'error');
                    return;
                  }
                
                  if (slot.status !== 'available' && !isMine) {
                    showPopup('Este espacio no está disponible.', 'error');
                    return;
                  }
                
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
          routeInfo={routeInfo}
          reservasText={reservasText}
          isReleasing={isReleasing}
          isMutating={isMutating}
          hasActiveReservation={hasActiveReservation}
          onReserve={handleReserve}
          onRelease={handleReleaseSlot}
        />
      )}
    </div>
  );
}
