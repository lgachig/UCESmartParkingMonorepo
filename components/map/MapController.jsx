import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Controls map view: flies to selected slot or zone center.
 */
export default function MapController({ selectedSlot, flyToZone }) {
  const currentMap = useMap();

  useEffect(() => {
    if (!currentMap) return;
    if (flyToZone?.center_latitude != null && flyToZone?.center_longitude != null) {
      currentMap.flyTo([flyToZone.center_latitude, flyToZone.center_longitude], 18, { duration: 1.2 });
      return;
    }
    if (selectedSlot) {
      currentMap.flyTo([selectedSlot.latitude, selectedSlot.longitude], 20, { duration: 1.5 });
    }
  }, [selectedSlot, flyToZone, currentMap]);

  return null;
}
