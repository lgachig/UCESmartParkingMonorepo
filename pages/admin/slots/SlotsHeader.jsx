import { Plus, Search } from 'lucide-react';

/**
 * Header for admin slots page: title, search and new slot button.
 */
export default function SlotsHeader({ searchTerm, onSearchChange, onNewSlot }) {
  return (
    <div className="flex-none sticky top-0 z-10 bg-[#f8fafc] pb-2 -mx-3 md:-mx-6 lg:-mx-8 px-3 md:px-6 lg:px-8 pt-0">
      <div className="bg-white p-5 lg:p-8 rounded-[2rem] lg:rounded-[3.5rem] shadow-md border-l-[10px] lg:border-l-[18px] border-[#003366] flex flex-col xl:flex-row justify-between items-center gap-4 lg:gap-8">
        <div className="text-center xl:text-left w-full xl:w-auto">
          <h1 className="text-2xl lg:text-5xl font-black text-[#003366] uppercase italic leading-none tracking-tighter">
            GESTIÓN <span className="text-[#CC0000]">SLOTS</span>
          </h1>
        </div>
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="BUSCAR..."
            className="w-full pl-10 pr-4 py-3 lg:py-6 bg-gray-100 rounded-2xl lg:rounded-[2rem] font-bold outline-none border-2 border-transparent focus:border-[#003366]"
          />
        </div>
        <button
          onClick={onNewSlot}
          className="w-full xl:w-auto px-6 py-3 lg:py-6 bg-[#003366] text-white rounded-2xl font-black uppercase shadow-xl"
        >
          <Plus size={18} /> NUEVO
        </button>
      </div>
    </div>
  );
}
