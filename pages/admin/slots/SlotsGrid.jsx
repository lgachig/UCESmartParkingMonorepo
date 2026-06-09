import SlotCard from './SlotCard';

/**
 * Grid of slot cards with scroll.
 */
export default function SlotsGrid({ slots, onEdit, onDelete }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 pb-20">
        {slots.map((slot) => (
          <SlotCard key={slot.id} slot={slot} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
