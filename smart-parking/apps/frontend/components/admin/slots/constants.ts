import L from 'leaflet';

export const MAP_CENTER: [number, number] = [-0.1985, -78.5035];

export const getIconNuevo = () => new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const getIconExistente = () => new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
});
