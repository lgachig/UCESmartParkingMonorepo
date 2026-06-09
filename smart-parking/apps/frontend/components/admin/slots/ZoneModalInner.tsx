'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CENTER, getIconNuevo, getIconExistente } from './constants';
import { parkingService, type Faculty, type Zone } from '@/services/parking.service';
import MapController from '@/components/map/MapController';

interface ZoneModalInnerProps {
  isOpen: boolean;
  onClose: () => void;
  faculties: Faculty[];
  zones: Zone[];
  onSuccess: () => void;
  onOpenFacultyModal: () => void;
}

function MapTracker({ onSelect }: { onSelect: (lat: string, lng: string) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

export default function ZoneModalInner({
  isOpen,
  onClose,
  faculties,
  zones,
  onSuccess,
  onOpenFacultyModal,
}: ZoneModalInnerProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    center_latitude: '',
    center_longitude: '',
    faculty_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<{ centerLatitude: number; centerLongitude: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        code: '',
        center_latitude: '',
        center_longitude: '',
        faculty_id: '',
      });
      setEditingId(null);
      setFlyToTarget(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const iconExistente = getIconExistente();
  const iconNuevo = getIconNuevo();

  const handleSelectZone = (z: Zone) => {
    setEditingId(z.id);
    setFormData({
      name: z.name,
      code: z.code,
      center_latitude: String(z.centerLatitude),
      center_longitude: String(z.centerLongitude),
      faculty_id: String(z.facultyId),
    });
    setFlyToTarget({ centerLatitude: z.centerLatitude, centerLongitude: z.centerLongitude });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      center_latitude: '',
      center_longitude: '',
      faculty_id: '',
    });
    setFlyToTarget(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la zona "${name}"? Se eliminarán también todos sus puestos asociados.`)) return;
    try {
      setLoading(true);
      await parkingService.deleteZone(id);
      if (editingId === id) {
        handleCancelEdit();
      }
      onSuccess();
    } catch (err: any) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(formData.center_latitude);
    const lng = parseFloat(formData.center_longitude);
    const facId = parseInt(formData.faculty_id);

    if (!formData.name || !formData.code) {
      alert('Nombre y código son obligatorios');
      return;
    }

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(facId)) {
      alert('Debes ingresar la facultad y la ubicación (latitud y longitud) del centro de la zona.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.toUpperCase().trim(),
        centerLatitude: lat,
        centerLongitude: lng,
        facultyId: facId,
      };

      if (editingId !== null) {
        await parkingService.updateZone(editingId, payload);
      } else {
        await parkingService.createZone(payload);
      }
      
      if (editingId !== null) {
        setEditingId(null);
      }
      setFormData({ name: '', code: '', center_latitude: '', center_longitude: '', faculty_id: '' });
      setFlyToTarget(null);
      onSuccess();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-[#001529]/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-7xl rounded-[2.5rem] p-6 lg:p-10 shadow-2xl flex flex-col lg:flex-row gap-6 lg:gap-8 relative border-t-[12px] border-[#CC0000] max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:text-red-500 transition-colors">
          <X size={20} />
        </button>

        {/* Columna 1: Listado de Zonas */}
        <div className="w-full lg:w-1/4 flex flex-col max-h-[450px] lg:max-h-[500px]">
          <h3 className="text-xl font-black text-[#003366] uppercase mb-4">Zonas Existentes</h3>
          {zones.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No hay zonas registradas.</p>
          ) : (
            <div className="flex-grow overflow-y-auto pr-2 space-y-2">
              {zones.map((z) => {
                const fac = faculties.find((f) => f.id === z.facultyId);
                return (
                  <div
                    key={z.id}
                    className={`flex justify-between items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      editingId === z.id ? 'border-[#CC0000] bg-red-50/10' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectZone(z)}
                  >
                    <div className="overflow-hidden">
                      <p className="font-black text-sm text-[#003366] truncate uppercase">{z.name}</p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="inline-block px-2 py-0.5 bg-gray-150 text-gray-650 rounded-md font-mono text-[9px] font-black uppercase">
                          {z.code}
                        </span>
                        {fac && (
                          <span className="text-[10px] text-gray-400 font-bold uppercase truncate">
                            {fac.code}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSelectZone(z)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(z.id, z.name)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna 2: Formulario */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 justify-start">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-[#003366] uppercase italic leading-none">
              {editingId !== null ? 'Editar' : 'Nueva'} <span className="text-[#CC0000]">Zona</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Define los datos y selecciona la ubicación en el mapa.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                Facultad
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 p-3 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-[#003366] outline-none"
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                >
                  <option value="">Facultad...</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onOpenFacultyModal}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all cursor-pointer"
                  title="Nueva Facultad"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                Nombre de la Zona
              </label>
              <input
                className="w-full p-3 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-[#003366] outline-none"
                placeholder="ej. Nivel 1, Zona Ciencias"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                Código de la Zona
              </label>
              <input
                className="w-full p-3 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-[#003366] outline-none"
                placeholder="ej. N1, ZC"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-100">
              <p className="text-[10px] font-black text-red-400 uppercase mb-1 flex items-center gap-1">
                <MapPin size={10} /> Coordenadas del Centro
              </p>
              <p className="font-mono font-black text-[#CC0000] text-xs">
                {formData.center_latitude
                  ? `${formData.center_latitude}, ${formData.center_longitude}`
                  : '⚠️ TOCA EL MAPA PARA UBICAR'}
              </p>
            </div>

            <div className="flex gap-2">
              {editingId !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-4 bg-gray-250 hover:bg-gray-300 text-gray-700 rounded-2xl font-black uppercase text-sm cursor-pointer transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-[#CC0000] hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase shadow-xl cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : editingId !== null ? 'Guardar Cambios' : 'Crear Zona'}
              </button>
            </div>
          </form>
        </div>

        {/* Columna 3: Mapa */}
        <div className="w-full lg:flex-1 h-[300px] lg:h-[500px] rounded-[2rem] overflow-hidden border-4 border-gray-100 relative">
          <MapContainer center={MAP_CENTER} zoom={18} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapTracker
              onSelect={(lat, lng) =>
                setFormData({ ...formData, center_latitude: lat, center_longitude: lng })
              }
            />
            <MapController flyToZone={flyToTarget} />
            {/* Draw existing zones centers */}
            {zones.filter((z) => z.id !== editingId).map((z) => (
              <Marker
                key={z.id}
                position={[z.centerLatitude, z.centerLongitude]}
                icon={iconExistente}
              />
            ))}
            {/* Draw current selected zone center */}
            {formData.center_latitude && (
              <Marker
                position={[
                  parseFloat(formData.center_latitude),
                  parseFloat(formData.center_longitude),
                ]}
                icon={iconNuevo}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
