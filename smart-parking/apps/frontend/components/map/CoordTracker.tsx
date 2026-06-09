import { useMapEvents } from 'react-leaflet';

interface CoordTrackerProps {
  setHoverCoords?: (coords: { lat: string; lng: string; x: number; y: number } | null) => void;
  showPopup: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CoordTracker({ setHoverCoords, showPopup }: CoordTrackerProps) {
  useMapEvents({
    mousemove(e) {
      if (setHoverCoords) {
        setHoverCoords({
          lat: e.latlng.lat.toFixed(6),
          lng: e.latlng.lng.toFixed(6),
          x: e.containerPoint.x,
          y: e.containerPoint.y,
        });
      }
    },
    click(e) {
      const coords = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(coords);
        showPopup(`Copiado: ${coords}`, 'info');
      }
    },
  });
  return null;
}
