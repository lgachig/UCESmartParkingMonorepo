import { Plus, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CENTER, iconNuevo, iconExistente } from './constants';

function MapTracker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

/**
 * Modal to create or edit a parking slot. Includes zone select, number, and map to pick coordinates.
 */
export default function SlotModal({
  isOpen,
  onClose,
  formData,
  onFormChange,
  zones,
  slots,
  editingSlot,
  onSave,
  onOpenZoneModal,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#001529]/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] p-6 lg:p-12 shadow-2xl flex flex-col lg:flex-row gap-6 lg:gap-10 relative border-t-[12px] border-[#003366]">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:text-red-500">
          <X size={20} />
        </button>

        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <h2 className="text-2xl lg:text-4xl font-black text-[#003366] uppercase italic leading-none">
            {editingSlot ? 'Editar' : 'Nuevo'} <span className="text-[#CC0000]">Puesto</span>
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                className="flex-1 p-3 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-[#003366] outline-none"
                value={formData.zone_id}
                onChange={(e) => onFormChange({ ...formData, zone_id: e.target.value })}
              >
                <option value="">Zona...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
              <button onClick={onOpenZoneModal} className="p-3 bg-[#CC0000] text-white rounded-2xl">
                <Plus size={20} />
              </button>
            </div>
            <input
              className="w-full p-3 bg-gray-100 rounded-[2rem] font-black text-2xl text-center text-[#003366] border-2 border-transparent focus:border-[#003366] outline-none"
              placeholder="EJ: A-01"
              value={formData.number}
              onChange={(e) => onFormChange({ ...formData, number: e.target.value })}
            />
            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Coordenadas GPS</p>
              <p className="font-mono font-black text-[#003366] text-xs">
                {formData.latitude ? `${formData.latitude}, ${formData.longitude}` : '⚠️ TOCA EL MAPA'}
              </p>
            </div>
          </div>
          <form onSubmit={onSave}>
            <button type="submit" className="w-full py-4 bg-[#003366] text-white rounded-2xl font-black text-lg uppercase shadow-xl">
              Guardar Cambios
            </button>
          </form>
        </div>

        <div className="w-full lg:flex-1 h-[300px] lg:h-auto rounded-[2rem] overflow-hidden border-4 border-gray-100 relative">
          <MapContainer center={MAP_CENTER} zoom={18} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapTracker onSelect={(lat, lng) => onFormChange({ ...formData, latitude: lat, longitude: lng })} />
            {slots.filter((s) => s.id !== editingSlot?.id).map((s) => (
              <Marker key={s.id} position={[s.latitude, s.longitude]} icon={iconExistente} />
            ))}
            {formData.latitude && (
              <Marker position={[formData.latitude, formData.longitude]} icon={iconNuevo} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
