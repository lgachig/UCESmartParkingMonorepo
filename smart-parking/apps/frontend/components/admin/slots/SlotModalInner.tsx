'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CENTER, getIconNuevo, getIconExistente } from './constants';
import type { Zone, Slot, SlotStatus } from '@/services/parking.service';
import MapController from '@/components/map/MapController';

interface SlotFormData {
  number: string;
  status: SlotStatus;
  latitude: string;
  longitude: string;
  zone_id: string;
}

interface SlotModalInnerProps {
  isOpen: boolean;
  onClose: () => void;
  formData: SlotFormData;
  onFormChange: React.Dispatch<React.SetStateAction<SlotFormData>>;
  zones: Zone[];
  slots: Slot[];
  editingSlot: Slot | null;
  onSave: (e: React.FormEvent) => void;
  onOpenZoneModal: () => void;
}

function MapTracker({ onSelect }: { onSelect: (lat: string, lng: string) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

export default function SlotModalInner({
  isOpen,
  onClose,
  formData,
  onFormChange,
  zones,
  slots,
  editingSlot,
  onSave,
  onOpenZoneModal,
}: SlotModalInnerProps) {
  const [flyToTarget, setFlyToTarget] = useState<{ centerLatitude: number; centerLongitude: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFlyToTarget(null);
      return;
    }

    if (!formData.zone_id) {
      setFlyToTarget(null);
      return;
    }

    const selectedZone = zones.find((z) => String(z.id) === formData.zone_id);
    if (selectedZone) {
      setFlyToTarget({
        centerLatitude: selectedZone.centerLatitude,
        centerLongitude: selectedZone.centerLongitude,
      });

      // Auto-prefill next slot number (only in creation mode)
      if (!editingSlot) {
        const zoneCode = selectedZone.code;
        const zoneSlots = slots.filter((s) => s.zoneId === selectedZone.id);
        
        let maxNum = 0;
        let formatHasSpace = false;
        let formatHasHyphen = false;
        let formatPadded = true;

        for (const s of zoneSlots) {
          if (s.number.startsWith(zoneCode)) {
            const suffix = s.number.substring(zoneCode.length);
            const match = suffix.match(/^[\s-]*(\d+)/);
            if (match) {
              const val = parseInt(match[1], 10);
              if (val > maxNum) {
                maxNum = val;
                formatHasSpace = suffix.startsWith(' ');
                formatHasHyphen = suffix.startsWith('-');
                formatPadded = match[1].length >= 2;
              }
            }
          }
        }

        const nextNum = maxNum + 1;
        const nextNumStr = formatPadded && nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
        let separator = '';
        if (formatHasSpace) separator = ' ';
        else if (formatHasHyphen) separator = '-';
        else {
          separator = ' '; // default to space e.g. "QA 02"
        }

        onFormChange((prev) => ({
          ...prev,
          number: `${zoneCode}${separator}${nextNumStr}`,
        }));
      }
    }
  }, [formData.zone_id, isOpen, zones, slots, editingSlot, onFormChange]);

  if (!isOpen) return null;

  const iconExistente = getIconExistente();
  const iconNuevo = getIconNuevo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#001529]/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] p-6 lg:p-12 shadow-2xl flex flex-col lg:flex-row gap-6 lg:gap-10 relative border-t-[12px] border-[#003366] max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:text-red-500 transition-colors">
          <X size={20} />
        </button>

        <div className="w-full lg:w-1/3 flex flex-col gap-6 justify-start">
          <h2 className="text-2xl lg:text-4xl font-black text-[#003366] uppercase italic leading-none">
            {editingSlot ? 'Editar' : 'Nuevo'} <span className="text-[#CC0000]">Puesto</span>
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                className="flex-1 p-3 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-[#003366] outline-none"
                value={formData.zone_id}
                onChange={(e) => onFormChange((prev) => ({ ...prev, zone_id: e.target.value }))}
              >
                <option value="">Zona...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
              <button onClick={onOpenZoneModal} className="p-3 bg-[#CC0000] text-white rounded-2xl cursor-pointer">
                <Plus size={20} />
              </button>
            </div>
            
            <select
              className="w-full p-3 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-[#003366] outline-none"
              value={formData.status}
              onChange={(e) => onFormChange((prev) => ({ ...prev, status: e.target.value as SlotStatus }))}
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="RESERVED">RESERVED</option>
              <option value="OCCUPIED">OCCUPIED</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="DISABLED">DISABLED</option>
            </select>

            <input
              className="w-full p-3 bg-gray-150 rounded-[2rem] font-black text-2xl text-center text-[#003366] border-2 border-transparent focus:border-[#003366] outline-none"
              placeholder="EJ: A-01"
              value={formData.number}
              onChange={(e) => onFormChange((prev) => ({ ...prev, number: e.target.value }))}
            />
            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Coordenadas GPS</p>
              <p className="font-mono font-black text-[#003366] text-xs">
                {formData.latitude ? `${formData.latitude}, ${formData.longitude}` : '⚠️ TOCA EL MAPA'}
              </p>
            </div>
          </div>
          <form onSubmit={onSave}>
            <button type="submit" className="w-full py-4 bg-[#003366] hover:bg-blue-900 text-white rounded-2xl font-black text-lg uppercase shadow-xl cursor-pointer transition-colors">
              Guardar Cambios
            </button>
          </form>
        </div>

        <div className="w-full lg:flex-1 h-[300px] lg:h-[450px] rounded-[2rem] overflow-hidden border-4 border-gray-100 relative">
          <MapContainer center={MAP_CENTER} zoom={18} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapTracker onSelect={(lat, lng) => onFormChange((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />
            <MapController flyToZone={flyToTarget} />
            {slots.filter((s) => s.id !== editingSlot?.id).map((s) => (
              <Marker key={s.id} position={[s.latitude, s.longitude]} icon={iconExistente} />
            ))}
            {formData.latitude && (
              <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]} icon={iconNuevo} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
