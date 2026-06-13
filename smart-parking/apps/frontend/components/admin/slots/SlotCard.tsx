'use client';

import { useState } from 'react';
import { Edit3, Trash2, XCircle } from 'lucide-react';
import { parkingService, type Slot } from '@/services/parking.service';
import { reservationService } from '@/services/reservation.service';

interface SlotCardProps {
  slot: Slot;
  onEdit: (slot: Slot) => void;
  onDelete: (slot: Slot) => void;
  onRefresh?: () => void;
}

export default function SlotCard({ slot, onEdit, onDelete, onRefresh }: SlotCardProps) {
  const [releasing, setReleasing] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'Libre', className: 'bg-green-100 text-green-800' };
      case 'RESERVED':
        return { label: 'Reservado', className: 'bg-blue-100 text-blue-800' };
      case 'OCCUPIED':
        return { label: 'Ocupado', className: 'bg-red-100 text-red-800' };
      case 'MAINTENANCE':
        return { label: 'Mantenimiento', className: 'bg-amber-100 text-amber-800' };
      case 'DISABLED':
      default:
        return { label: 'Desactivado', className: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusConfig = getStatusConfig(slot.status);
  const canRelease = slot.status === 'RESERVED' || slot.status === 'OCCUPIED';

  const handleAdminCancel = async () => {
    if (!confirm(`¿Liberar el puesto ${slot.number} y cancelar su reservación activa?`)) return;
    setReleasing(true);
    try {
      // 1. Find the active reservation for this slot
      const reservations = await reservationService.getBySlot(slot.id);
      const active = reservations.find((r) => r.status === 'PENDING' || r.status === 'ACTIVE');

      if (!active) {
        // No reservation found in reservation-service — force-release the slot in parking directly
        await parkingService.releaseSlot(slot.id);
        onRefresh?.();
        return;
      }

      // 2. Admin-cancel the reservation (releases slot + Redis lock)
      await reservationService.adminCancelReservation(active.id);
      onRefresh?.();
    } catch (err: any) {
      alert('Error al liberar: ' + (err.response?.data?.message || err.message));
      onRefresh?.();
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-5 lg:p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-4xl lg:text-5xl font-black text-[#003366] italic leading-none">{slot.number}</span>
        <span className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-6 italic">{slot.zone?.name || 'SIN ZONA'}</p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onEdit(slot)}
          className="flex-1 py-2 bg-gray-100 text-[#003366] rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer"
        >
          <Edit3 size={14} /> Editar
        </button>
        {canRelease && (
          <button
            onClick={handleAdminCancel}
            disabled={releasing}
            className="flex-1 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-100 transition-colors"
          >
            <XCircle size={14} />
            {releasing ? 'Liberando...' : 'Liberar'}
          </button>
        )}
        <button
          onClick={() => onDelete(slot)}
          className="p-2 bg-red-50 text-[#CC0000] rounded-xl cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
