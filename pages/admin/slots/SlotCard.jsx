import { Edit3, Trash2 } from 'lucide-react';

/**
 * Single slot card for admin slots grid. Shows number, status, zone and edit/delete actions.
 */
export default function SlotCard({ slot, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-[2rem] p-5 lg:p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-4xl lg:text-5xl font-black text-[#003366] italic leading-none">{slot.number}</span>
        <span className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase ${slot.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
          {slot.status === 'available' ? 'Libre' : 'Ocupado'}
        </span>
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-6 italic">{slot.parking_zones?.name || 'SIN ZONA'}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(slot)}
          className="flex-1 py-2 bg-gray-100 text-[#003366] rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1"
        >
          <Edit3 size={14} /> Editar
        </button>
        <button
          onClick={() => onDelete(slot)}
          className="p-2 bg-red-50 text-[#CC0000] rounded-xl"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
