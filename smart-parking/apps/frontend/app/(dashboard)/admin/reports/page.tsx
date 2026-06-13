'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search, CheckCircle2, LogOut,
  PieChart, Activity, AlertTriangle, FileText, Loader2
} from 'lucide-react';
import { parkingService, type Slot } from '@/services/parking.service';
import { reservationService } from '@/services/reservation.service';
import StatCard from '@/components/admin/StatCard';
import { DashboardShell } from '@/components/layout/DashboardShell';

interface EnrichedSlot extends Slot {
  profiles?: { full_name: string };
  vehicles?: { license_plate: string; model: string };
  alertasActivas: string[];
  tiempoH: string;
}

export default function AdminReportsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isReleasingMap, setIsReleasingMap] = useState<Record<string, boolean>>({});

  const fetchSlots = useCallback(async () => {
    try {
      const data = await parkingService.getSlots();
      setSlots(data);
    } catch (err) {
      console.error('Error fetching reports slots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 10000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  const handleAdminRelease = async (slotId: string) => {
    if (confirm('¿Liberar este puesto?')) {
      setIsReleasingMap((prev) => ({ ...prev, [slotId]: true }));
      try {
        try {
          const reservations = await reservationService.getBySlot(slotId);
          const active = reservations.find((r) => r.status === 'PENDING' || r.status === 'ACTIVE');
          if (active) {
            await reservationService.adminCancelReservation(active.id);
          } else {
            await parkingService.releaseSlot(slotId);
          }
        } catch (reserveErr) {
          console.warn('Failed to release via reservation-service, falling back to direct release:', reserveErr);
          await parkingService.releaseSlot(slotId);
        }
        await fetchSlots();
      } catch (err) {
        alert('Error al liberar puesto');
      } finally {
        setIsReleasingMap((prev) => ({ ...prev, [slotId]: false }));
      }
    }
  };

  const enrichedData = useMemo<EnrichedSlot[]>(() => {
    const mockNames = ['Luis Achig', 'María Flores', 'Carlos Torres', 'Ana Benavídez', 'José Gómez', 'Elena Castro'];
    const mockPlates = ['PBA-1024', 'PBF-5678', 'PDH-3021', 'PCX-8902', 'PBY-7761', 'PIC-5120'];
    const mockModels = ['Toyota Corolla', 'Chevrolet Sail', 'Hyundai Accent', 'Kia Sportage', 'Suzuki Grand Vitara', 'Mazda BT-50'];

    return slots.map((slot) => {
      // Calculate a stable index from slot UUID
      const charSum = slot.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const name = mockNames[charSum % mockNames.length];
      const plate = mockPlates[charSum % mockPlates.length];
      const model = mockModels[charSum % mockModels.length];
      
      const hours = ((charSum % 70) / 10 + 0.5).toFixed(1);
      const isOccupied = slot.status === 'OCCUPIED';
      const isReserved = slot.status === 'RESERVED';

      const alertas: string[] = [];
      if (isOccupied && parseFloat(hours) > 5.0) {
        alertas.push('EXCESO');
      }
      if (isOccupied && charSum % 5 === 0) {
        alertas.push('SIN REG');
      }

      return {
        ...slot,
        profiles: isOccupied || isReserved ? { full_name: name } : undefined,
        vehicles: isOccupied || isReserved ? { license_plate: plate, model } : undefined,
        alertasActivas: alertas,
        tiempoH: hours,
      };
    });
  }, [slots]);

  const stats = useMemo(() => {
    const total = slots.length;
    const occupied = slots.filter((s) => s.status === 'OCCUPIED').length;
    const reserved = slots.filter((s) => s.status === 'RESERVED').length;
    const maintenance = slots.filter((s) => s.status === 'MAINTENANCE').length;
    const disabled = slots.filter((s) => s.status === 'DISABLED').length;

    const occupiedRate = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;
    const alertCount = enrichedData.filter((s) => s.alertasActivas.length > 0).length;

    return {
      total,
      occupied,
      reserved,
      maintenance,
      disabled,
      available: total - (occupied + reserved + maintenance + disabled),
      rate: occupiedRate,
      alertCount,
    };
  }, [slots, enrichedData]);

  const filteredSlots = useMemo(() => {
    const term = filter.toLowerCase().trim();
    if (!term) return enrichedData;
    return enrichedData.filter(
      (s) =>
        s.number.toLowerCase().includes(term) ||
        s.profiles?.full_name?.toLowerCase().includes(term)
    );
  }, [filter, enrichedData]);

  const handleGenerateReport = async () => {
    // Dynamically import jsPDF and autoTable on the client to avoid SSR issues
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.text('UCE SMART PARKING - REPORTE DE OCUPACIÓN', 14, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 26);

    const rows = filteredSlots.map((s) => [
      s.number,
      s.status,
      s.zone?.name || 'N/A',
      s.profiles?.full_name || 'N/A',
      s.vehicles?.license_plate || 'N/A',
      s.status === 'OCCUPIED' ? `${s.tiempoH}h` : 'N/A',
      s.alertasActivas.join(', ') || 'Ninguna',
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Puesto', 'Estado', 'Zona', 'Usuario', 'Placa', 'Tiempo', 'Alertas']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
    });

    doc.save(`Reporte_Ocupacion_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black text-[#003366] animate-pulse">
        <Loader2 className="animate-spin mr-2" /> CARGANDO MONITOR...
      </div>
    );
  }

  return (
    <DashboardShell allowedRoles={['ADMIN']}>
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
              className="w-full pl-10 pr-4 py-3 lg:py-4 bg-gray-100 rounded-full font-black text-xs lg:text-base outline-none focus:ring-2 focus:ring-[#003366] transition-all"
            />
          </div>
          <button
            onClick={handleGenerateReport}
            className="w-full lg:w-auto bg-green-600 text-white px-6 py-3 lg:py-4 rounded-full font-black uppercase shadow-lg flex items-center justify-center gap-2 text-xs lg:text-sm cursor-pointer"
          >
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

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {filteredSlots.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic">No hay puestos coincidentes</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 pb-20">
            {filteredSlots.map((slot) => {
              const isOccupied = slot.status === 'OCCUPIED';
              const isReserved = slot.status === 'RESERVED';
              const hasAlert = slot.alertasActivas.length > 0;
              const isReleasing = isReleasingMap[slot.id] || false;

              return (
                <div
                  key={slot.id}
                  className={`p-5 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] border-4 transition-all duration-300 relative overflow-hidden group ${
                    hasAlert ? 'border-red-500 bg-red-50' : isOccupied ? 'border-transparent bg-white shadow-md' : 'border-transparent bg-gray-100 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 lg:h-2 ${hasAlert ? 'bg-red-500' : isOccupied ? 'bg-[#003366]' : 'bg-gray-300'}`} />
                  <div className="flex justify-between items-start mb-4 mt-2">
                    <div
                      className={`w-12 h-12 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center text-2xl lg:text-3xl font-black shadow-inner ${
                        isOccupied || isReserved ? 'bg-[#003366] text-white' : 'bg-white text-gray-300'
                      }`}
                    >
                      {slot.number}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {hasAlert && (
                        <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[9px] font-black uppercase animate-pulse">
                          ⚠️ Alerta
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-md text-[9px] lg:text-[10px] font-black uppercase ${
                          isOccupied
                            ? 'bg-red-100 text-red-700'
                            : isReserved
                            ? 'bg-blue-100 text-blue-700'
                            : slot.status === 'MAINTENANCE'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>
                  </div>
                  {isOccupied || isReserved ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          {isReserved ? 'Reservado por' : 'Ocupante'}
                        </p>
                        <p className="text-base lg:text-lg font-black text-gray-800 truncate">
                          {slot.profiles?.full_name || 'Desconocido'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2 lg:p-3 rounded-xl border border-gray-100">
                        <span className="font-mono font-bold text-xs lg:text-sm text-gray-600">
                          {slot.vehicles?.license_plate || '---'}
                        </span>
                        {isOccupied && (
                          <span className="text-[10px] lg:text-xs font-black bg-[#003366] text-white px-2 py-1 rounded-lg">
                            {slot.tiempoH}h
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAdminRelease(slot.id)}
                        disabled={isReleasing}
                        className="w-full py-2 lg:py-3 bg-red-100 text-red-600 rounded-xl font-black text-[10px] lg:text-xs uppercase hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isReleasing ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <><LogOut size={14} /> Liberar</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 lg:h-24 flex flex-col items-center justify-center text-gray-400">
                      <CheckCircle2 size={24} className="mb-1 opacity-20" />
                      <span className="font-black uppercase text-[10px] tracking-widest">
                        {slot.status === 'MAINTENANCE' ? 'Mantenimiento' : 'Disponible'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </DashboardShell>
  );
}
