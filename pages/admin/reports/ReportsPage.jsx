import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSlots, useReleaseSlot } from '../../../hooks/useParking';
import {
  Search, CheckCircle2, LogOut,
  PieChart, Activity, AlertTriangle, FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StatCard from '../../../components/admin/StatCard';

/**
 * Admin monitor/reports page. Real-time slots and sessions; release session and export PDF.
 */
export default function ReportsPage() {
  const { data: rawSlots = [], isLoading: loading } = useSlots();
  const { release } = useReleaseSlot();
  const [filter, setFilter] = useState('');
  const [enrichedData, setEnrichedData] = useState([]);

  const fetchEnrichedData = useCallback(async () => {
    if (!rawSlots || rawSlots.length === 0) return;
    try {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, role_id');
      const { data: vehicles } = await supabase.from('vehicles').select('user_id, license_plate, model');
      const { data: sessions } = await supabase.from('parking_sessions').select('*').eq('status', 'active');

      const enriched = rawSlots.map((slot) => {
        const profile = profiles?.find((p) => p.id === slot.user_id);
        const vehicle = vehicles?.find((v) => v.user_id === slot.user_id);
        const session = sessions?.find((s) => s.slot_id === slot.id);
        const ahora = new Date();
        const entrada = session ? new Date(session.start_time) : null;
        const horas = entrada ? (ahora - entrada) / (1000 * 60 * 60) : 0;
        const alertas = [];
        if (slot.status === 'occupied' && horas > 5) alertas.push('EXCESO');
        if (slot.status === 'occupied' && !vehicle) alertas.push('SIN REG');

        return { ...slot, profiles: profile, vehicles: vehicle, alertasActivas: alertas, tiempoH: horas.toFixed(1) };
      });
      setEnrichedData(enriched);
    } catch (error) { console.error(error); }
  }, [rawSlots]);

  useEffect(() => {
    fetchEnrichedData();
  }, [fetchEnrichedData]);

  const handleAdminRelease = async (slotId, userId) => {
    if (!userId) return alert('Espacio vacío.');
    if (confirm('¿Liberar?')) await release(slotId, userId);
  };

  const stats = useMemo(() => {
    const total = rawSlots.length;
    const occupied = enrichedData.filter((s) => s.status === 'occupied').length;
    return {
      total,
      occupied,
      available: total - occupied,
      rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      alertCount: enrichedData.filter((s) => s.alertasActivas?.length > 0).length,
    };
  }, [rawSlots.length, enrichedData]);

  const filteredSlots = useMemo(() => {
    const term = filter.toLowerCase().trim();
    if (!term) return enrichedData;
    return enrichedData.filter((s) => s.number.toString().includes(term) || s.profiles?.full_name?.toLowerCase().includes(term));
  }, [filter, enrichedData]);

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    doc.text('REPORTE MONITOR', 14, 20);
    const rows = filteredSlots.map((s) => [s.number, s.status, s.profiles?.full_name || 'N/A', s.tiempoH + 'h']);
    autoTable(doc, { startY: 30, head: [['Slot', 'Estado', 'Usuario', 'Tiempo']], body: rows });
    doc.save('Monitor.pdf');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#003366] animate-pulse">CARGANDO...</div>;

  return (
    <div className="h-full min-h-0 flex flex-col gap-4 p-3 md:p-6 lg:p-8 font-sans bg-[#f8fafc]">
      <div className="flex-none sticky top-0 z-10 bg-[#f8fafc] pb-2 -mx-3 md:-mx-6 lg:-mx-8 px-3 md:px-6 lg:px-8 pt-0">
        <div className="bg-white p-5 lg:p-8 rounded-[2rem] lg:rounded-[3.5rem] shadow-sm border-l-[10px] lg:border-l-[15px] border-[#003366] flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-6">
          <div className="text-center lg:text-left w-full lg:w-auto">
            <h1 className="text-2xl lg:text-5xl font-black text-[#003366] uppercase italic leading-none tracking-tighter">
              MONITOR <span className="text-[#CC0000]">MAESTRO</span>
            </h1>
            <p className="text-[10px] lg:text-sm font-bold text-gray-400 mt-1 uppercase tracking-[0.3em]">Tiempo Real</p>
          </div>
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="BUSCAR..."
              className="w-full pl-10 pr-4 py-3 lg:py-6 bg-gray-100 rounded-full font-black text-xs lg:text-lg outline-none focus:ring-2 focus:ring-[#003366] transition-all"
            />
          </div>
          <button onClick={handleGenerateReport} className="w-full lg:w-auto bg-green-600 text-white px-6 py-3 lg:py-4 rounded-full font-black uppercase shadow-lg flex items-center justify-center gap-2 text-xs lg:text-sm">
            <FileText size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 flex-none">
        <StatCard icon={<PieChart size={20} />} label="Ocupación" value={`${stats.rate}%`} color="blue" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Libres" value={stats.available} color="green" />
        <StatCard icon={<Activity size={20} />} label="Total" value={stats.total} color="orange" />
        <StatCard icon={<AlertTriangle size={20} />} label="Alertas" value={stats.alertCount} color={stats.alertCount > 0 ? 'red' : 'gray'} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 pb-20">
          {filteredSlots.map((slot) => {
            const isOccupied = slot.status === 'occupied';
            const hasAlert = slot.alertasActivas?.length > 0;

            return (
              <div
                key={slot.id}
                className={`p-5 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] border-4 transition-all duration-300 relative overflow-hidden group ${hasAlert ? 'border-red-500 bg-red-50' : isOccupied ? 'border-transparent bg-white shadow-md' : 'border-transparent bg-gray-100 opacity-60 hover:opacity-100'}`}
              >
                <div className={`absolute top-0 left-0 w-full h-1.5 lg:h-2 ${hasAlert ? 'bg-red-500' : isOccupied ? 'bg-[#003366]' : 'bg-gray-300'}`} />
                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center text-2xl lg:text-3xl font-black shadow-inner ${isOccupied ? 'bg-[#003366] text-white' : 'bg-white text-gray-300'}`}>
                    {slot.number}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {hasAlert && <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[9px] font-black uppercase animate-pulse">⚠️ Alerta</span>}
                    <span className={`px-2 py-1 rounded-md text-[9px] lg:text-[10px] font-black uppercase ${isOccupied ? 'bg-blue-50 text-blue-700' : 'bg-green-100 text-green-700'}`}>{slot.status}</span>
                  </div>
                </div>
                {isOccupied ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Ocupante</p>
                      <p className="text-base lg:text-lg font-black text-gray-800 truncate">{slot.profiles?.full_name || 'Desconocido'}</p>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-2 lg:p-3 rounded-xl border border-gray-100">
                      <span className="font-mono font-bold text-sm lg:text-lg text-gray-600">{slot.vehicles?.license_plate || '---'}</span>
                      <span className="text-[10px] lg:text-xs font-black bg-[#003366] text-white px-2 py-1 rounded-lg">{slot.tiempoH}h</span>
                    </div>
                    <button
                      onClick={() => handleAdminRelease(slot.id, slot.user_id)}
                      className="w-full py-2 lg:py-3 bg-red-100 text-red-600 rounded-xl font-black text-[10px] lg:text-xs uppercase hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut size={14} /> Liberar
                    </button>
                  </div>
                ) : (
                  <div className="h-20 lg:h-24 flex flex-col items-center justify-center text-gray-400">
                    <CheckCircle2 size={24} className="mb-1 opacity-20" />
                    <span className="font-black uppercase text-[10px] tracking-widest">Disponible</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
