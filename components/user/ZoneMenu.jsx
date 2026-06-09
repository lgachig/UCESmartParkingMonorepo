import { MapPin } from 'lucide-react';

/**
 * Floating button + dropdown to jump to a zone on the map.
 */
export default function ZoneMenu({ zones, zonesMenuOpen, onToggle, onSelectZone }) {
  return (
    <div className="absolute top-3 right-3 md:top-6 md:right-6 z-40 flex flex-col items-end gap-2">
      <button
        onClick={onToggle}
        className="bg-white/95 px-3 py-2 md:px-4 md:py-3 rounded-xl shadow-lg border-l-4 border-[#003366] flex items-center gap-2 font-black text-[#003366] uppercase text-xs md:text-sm transition-transform active:scale-95"
      >
        <MapPin size={16} className="md:w-[18px] md:h-[18px]" /> Zonas
      </button>
      {zonesMenuOpen && (
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden min-w-[160px] md:min-w-[200px] max-h-[200px] md:max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone)}
              className="w-full text-left px-3 py-2.5 md:px-4 md:py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 font-bold text-[#003366] text-xs md:text-sm flex items-center gap-2"
            >
              <MapPin size={14} className="text-[#CC0000]" /> {zone.name || zone.id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
