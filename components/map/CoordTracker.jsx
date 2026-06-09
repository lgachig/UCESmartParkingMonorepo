import { useMapEvents } from 'react-leaflet';

/**
 * Tracks mouse move for coords tooltip and click-to-copy coordinates.
 */
export default function CoordTracker({ setHoverCoords, showPopup }) {
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
      navigator.clipboard.writeText(coords);
      showPopup(`Copiado: ${coords}`, 'info');
    },
  });
  return null;
}
