'use client';

import { useEffect, useState, useMemo, startTransition, useCallback } from 'react';
import SlotsHeader from './SlotsHeader';
import SlotsGrid from './SlotsGrid';
import SlotModal from './SlotModal';
import ZoneModal from './ZoneModal';
import FacultyModal from './FacultyModal';
import { parkingService, type Slot, type Zone, type Faculty, type SlotStatus } from '@/services/parking.service';
import { realtimeService, type SlotUpdateEvent } from '@/services/realtime.service';

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    number: '',
    status: 'AVAILABLE' as SlotStatus,
    latitude: '',
    longitude: '',
    zone_id: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [z, s, f] = await Promise.all([
        parkingService.getZones(),
        parkingService.getSlots(),
        parkingService.getFaculties(),
      ]);
      setZones(z);
      setSlots(s);
      setFaculties(f);
    } catch (err) {
      console.error('Error fetching admin slot data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => { fetchData(); });
    const interval = setInterval(() => {
      startTransition(() => { fetchData(); });
    }, 15000);

    realtimeService.connect();
    const handleRealtimeSlotEvent = (event: SlotUpdateEvent) => {
      if (event.eventType === 'slot.created' || event.eventType === 'slot.deleted') {
        startTransition(() => { fetchData(); });
        return;
      }
      setSlots((prev) => {
        const idx = prev.findIndex((s) => s.id === event.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          ...(event.status !== undefined && { status: event.status }),
          ...(event.number !== undefined && { number: String(event.number) }),
          ...(event.zoneId !== undefined && { zoneId: event.zoneId }),
          ...(event.facultyId !== undefined && { facultyId: event.facultyId }),
          ...(event.latitude !== undefined && { latitude: event.latitude }),
          ...(event.longitude !== undefined && { longitude: event.longitude }),
        };
        return next;
      });
    };
    const unsubscribeSlotUpdate = realtimeService.onSlotUpdate(handleRealtimeSlotEvent);

    return () => {
      clearInterval(interval);
      unsubscribeSlotUpdate();
    };
  }, [fetchData]);

  const filteredSlots = useMemo(() => {
    if (!searchTerm) return slots;
    const term = searchTerm.toLowerCase();
    return slots.filter(
      (s) =>
        s.number?.toLowerCase().includes(term) ||
        s.zone?.name?.toLowerCase().includes(term)
    );
  }, [slots, searchTerm]);

  const saveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.zone_id || !formData.number) {
      alert('Faltan datos obligatorios');
      return;
    }

    const zoneIdNum = parseInt(formData.zone_id);
    const selectedZone = zones.find((z) => z.id === zoneIdNum);
    if (!selectedZone) {
      alert('Zona no encontrada');
      return;
    }

    const payload = {
      number: formData.number,
      status: formData.status,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      zoneId: zoneIdNum,
      facultyId: selectedZone.facultyId,
    };

    try {
      if (editingSlot) {
        await parkingService.updateSlot(editingSlot.id, payload);
      } else {
        await parkingService.createSlot(payload);
      }
      setIsSlotModalOpen(false);
      setEditingSlot(null);
      fetchData();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };


  const handleDeleteSlot = async (slot: Slot) => {
    if (!confirm(`¿Borrar puesto ${slot.number}?`)) return;
    try {
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
      await parkingService.deleteSlot(slot.id);
      fetchData();
    } catch (err: any) {
      fetchData();
      alert('Error al borrar: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditSlot = (slot: Slot) => {
    setEditingSlot(slot);
    setFormData({
      number: slot.number,
      status: slot.status,
      latitude: String(slot.latitude),
      longitude: String(slot.longitude),
      zone_id: String(slot.zoneId),
    });
    setIsSlotModalOpen(true);
  };

  const handleNewSlot = () => {
    setEditingSlot(null);
    setFormData({
      number: '',
      status: 'AVAILABLE' as SlotStatus,
      latitude: '',
      longitude: '',
      zone_id: '',
    });
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
        onNewZone={() => {
          setIsZoneModalOpen(true);
        }}
        onNewFaculty={() => setIsFacultyModalOpen(true)}
      />
      <SlotsGrid
        slots={filteredSlots}
        onEdit={handleEditSlot}
        onDelete={handleDeleteSlot}
        onRefresh={fetchData}
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
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
          faculties={faculties}
          zones={zones}
          onSuccess={fetchData}
          onOpenFacultyModal={() => setIsFacultyModalOpen(true)}
        />
      )}
      <FacultyModal
        isOpen={isFacultyModalOpen}
        onClose={() => setIsFacultyModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}