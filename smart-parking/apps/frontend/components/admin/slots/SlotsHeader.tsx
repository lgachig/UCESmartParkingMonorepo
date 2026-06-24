'use client';

import { Plus, Search } from 'lucide-react';

interface SlotsHeaderProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onNewSlot: () => void;
  onNewZone: () => void;
  onNewFaculty: () => void;
}

export default function SlotsHeader({
  searchTerm,
  onSearchChange,
  onNewSlot,
  onNewZone,
  onNewFaculty,
}: SlotsHeaderProps) {
  return (
    <div className="flex-none sticky top-0 z-10 bg-slate-100 pb-2 -mx-3 md:-mx-6 lg:-mx-8 px-3 md:px-6 lg:px-8 pt-0">
      <div className="bg-white p-5 lg:p-8 rounded-[2rem] lg:rounded-[3.5rem] shadow-md border-l-[10px] lg:border-l-[18px] border-[#003366] flex flex-col xl:flex-row justify-between items-center gap-4 lg:gap-8">
        <div className="text-center xl:text-left w-full xl:w-auto">
          <h1 className="text-2xl lg:text-5xl font-black text-[#003366] uppercase italic leading-none tracking-tighter">
            GESTIÓN <span className="text-[#CC0000]">SLOTS</span>
          </h1>
        </div>
        <div className="relative w-full max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="BUSCAR..."
            className="w-full pl-10 pr-4 py-3 lg:py-4 bg-gray-100 rounded-2xl lg:rounded-[2rem] font-bold outline-none border-2 border-transparent focus:border-[#003366]"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <button
            onClick={onNewFaculty}
            className="flex-1 sm:flex-none px-4 py-3 lg:py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus size={18} /> FACULTAD
          </button>
          <button
            onClick={onNewZone}
            className="flex-1 sm:flex-none px-4 py-3 lg:py-4 bg-[#CC0000] hover:bg-red-700 text-white rounded-2xl font-black uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus size={18} /> ZONA
          </button>
          <button
            onClick={onNewSlot}
            className="flex-1 sm:flex-none px-4 py-3 lg:py-4 bg-[#003366] hover:bg-blue-900 text-white rounded-2xl font-black uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus size={18} /> PUESTO
          </button>
        </div>
      </div>
    </div>
  );
}
