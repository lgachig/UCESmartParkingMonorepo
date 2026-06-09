import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import SlotsHeader from './SlotsHeader';
import SlotsGrid from './SlotsGrid';
import SlotModal from './SlotModal';
import ZoneModal from './ZoneModal';

/**
 * Admin slots page: list slots, add/edit/delete, add zones with location for user map.
 * Realtime: refetch slots/zones on any change so reservations and releases show immediately.
 */
export default function SlotsPage() {
  const [slots, setSlots] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ number: '', status: 'available', latitude: '', longitude: '', zone_id: '' });
  const [zoneFormData, setZoneFormData] = useState({ name: '', code: '', center_latitude: '', center_longitude: '' });

  const fetchData = useCallback(async () => {
    const { data: z } = await supabase.from('parking_zones').select('*').order('name');
    const { data: s } = await supabase.from('parking_slots').select('*, parking_zones(name)').order('number');
    setZones(z || []);
    setSlots(s || []);
    setLoading(false);
  }, []);

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-slots-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_slots' }, () => {
        fetchDataRef.current();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_zones' }, () => {
        fetchDataRef.current();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const filteredSlots = useMemo(() => {
    if (!searchTerm) return slots;
    const term = searchTerm.toLowerCase();
    return slots.filter((s) => s.number?.toString().toLowerCase().includes(term) || s.parking_zones?.name?.toLowerCase().includes(term));
  }, [slots, searchTerm]);

  const saveSlot = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.zone_id || !formData.number) return alert('Faltan datos obligatorios');
    const payload = {
      number: formData.number,
      status: formData.status,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      zone_id: formData.zone_id,
    };
    const { error } = editingSlot
      ? await supabase.from('parking_slots').update(payload).eq('id', editingSlot.id)
      : await supabase.from('parking_slots').insert([{ ...payload, id: crypto.randomUUID() }]);
    if (!error) {
      setIsSlotModalOpen(false);
      setEditingSlot(null);
      fetchData();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const saveZone = async (e) => {
    e.preventDefault();
    const lat = parseFloat(zoneFormData.center_latitude);
    const lng = parseFloat(zoneFormData.center_longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      alert('Debes ingresar la ubicación (latitud y longitud) para que el usuario pueda ir a la zona desde el mapa.');
      return;
    }
    const { error } = await supabase.from('parking_zones').insert([
      { ...zoneFormData, id: crypto.randomUUID(), center_latitude: lat, center_longitude: lng },
    ]);
    if (!error) {
      setIsZoneModalOpen(false);
      setZoneFormData({ name: '', code: '', center_latitude: '', center_longitude: '' });
      fetchData();
    }
  };

  const handleDeleteSlot = async (slot) => {
    if (!confirm('¿Borrar slot?')) return;
    const id = slot.id;
    setSlots((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from('parking_slots').delete().eq('id', id);
    if (error) {
      fetchData();
      alert('Error al borrar: ' + error.message);
    }
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setFormData({
      number: slot.number,
      status: slot.status,
      latitude: slot.latitude,
      longitude: slot.longitude,
      zone_id: slot.zone_id,
    });
    setIsSlotModalOpen(true);
  };

  const handleNewSlot = () => {
    setEditingSlot(null);
    setFormData({ number: '', status: 'available', latitude: '', longitude: '', zone_id: '' });
    setIsSlotModalOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black text-[#003366] animate-pulse text-lg">
        CARGANDO...
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-4 p-3 md:p-6 lg:p-8 font-sans">
      <SlotsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNewSlot={handleNewSlot}
      />
      <SlotsGrid
        slots={filteredSlots}
        onEdit={handleEditSlot}
        onDelete={handleDeleteSlot}
      />
      <SlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        formData={formData}
        onFormChange={setFormData}
        zones={zones}
        slots={slots}
        editingSlot={editingSlot}
        onSave={saveSlot}
        onOpenZoneModal={() => setIsZoneModalOpen(true)}
      />
      {isZoneModalOpen && (
        <ZoneModal
          formData={zoneFormData}
          onFormChange={setZoneFormData}
          onSave={saveZone}
          onClose={() => setIsZoneModalOpen(false)}
        />
      )}
    </div>
  );
}
