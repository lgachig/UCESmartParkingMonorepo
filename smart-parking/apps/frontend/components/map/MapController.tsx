import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
  selectedSlot?: { latitude: number; longitude: number } | null;
  flyToZone?: { center_latitude?: number; center_longitude?: number; centerLatitude?: number; centerLongitude?: number } | null;
}

export default function MapController({ selectedSlot, flyToZone }: MapControllerProps) {
  const currentMap = useMap();

  useEffect(() => {
    if (!currentMap) return;

    // Support both snake_case and camelCase center coordinates
    const lat = flyToZone?.centerLatitude ?? flyToZone?.center_latitude;
    const lng = flyToZone?.centerLongitude ?? flyToZone?.center_longitude;

    if (lat != null && lng != null) {
      currentMap.flyTo([lat, lng], 18, { duration: 1.2 });
      return;
    }

    if (selectedSlot) {
      currentMap.flyTo([selectedSlot.latitude, selectedSlot.longitude], 20, { duration: 1.5 });
    }
  }, [selectedSlot, flyToZone, currentMap]);

  return null;
}
