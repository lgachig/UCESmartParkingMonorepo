'use client';

import SlotCard from './SlotCard';
import type { Slot } from '@/services/parking.service';

interface SlotsGridProps {
  slots: Slot[];
  onEdit: (slot: Slot) => void;
  onDelete: (slot: Slot) => void;
  onRefresh?: () => void;
}

export default function SlotsGrid({ slots, onEdit, onDelete, onRefresh }: SlotsGridProps) {
  return (
    <div className="flex-grow overflow-y-auto pr-1">
      {slots.length === 0 ? (
        <div className="text-center py-12 text-gray-400 italic">No hay puestos registrados</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 pb-20">
          {slots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} onEdit={onEdit} onDelete={onDelete} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}
