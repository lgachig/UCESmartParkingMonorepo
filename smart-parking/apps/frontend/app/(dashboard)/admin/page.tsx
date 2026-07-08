'use client';

import { useEffect, useState, useRef } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import {
  Calendar, Clock, Users, Car, Download, History, Flame, TrendingUp,
  XCircle, FileText, Filter, LayoutDashboard, Loader2,
} from 'lucide-react';
import { parkingService, type Slot, type GlobalStats } from '@/services/parking.service';
import { getAdminAnalytics, type AdminAnalytics } from '@/lib/admin-metrics';
import SystemHealthPanel from '@/components/admin/SystemHealthPanel';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  colorBg: string;
  colorText: string;
}

function StatCard({ icon, label, value, trend, colorBg, colorText }: StatCardProps) {
  return (
    <div className="p-5 xl:p-10 rounded-3xl xl:rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all bg-white">
      <div className="flex justify-between items-start mb-4 xl:mb-6">
        <div className="p-3 xl:p-5 rounded-2xl xl:rounded-3xl" style={{ backgroundColor: colorBg, color: colorText }}>
          {icon}
        </div>
        {trend && (
          <span className="px-2 py-1 rounded-lg text-[10px] xl:text-xs font-black uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-100">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs xl:text-sm font-black text-gray-400 uppercase tracking-widest mb-1 xl:mb-2">{label}</p>
        <p className="text-3xl xl:text-7xl font-black text-gray-800 tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      const [slotsData, statsData] = await Promise.all([
        parkingService.getSlots(),
        parkingService.getGlobalStats(),
      ]);
      setSlots(slotsData);
      setGlobalStats(statsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [isMounted]);

  const emptyAnalytics: AdminAnalytics = {
    filteredSessions: [],
    dataReport: { dayCounts: [], hourCounts: [], roleCounts: [], topUsers: [] },
    stats: { totalSessions: 0, activeNow: 0, mostUsedSlot: '-', avgTime: '0 min' },
    userStats: { total: 0, active: 0, inactive: 0, newLast7Days: 0, newLast30Days: 0, byRole: {}, recentProfiles: [] },
  };

  const [analytics, setAnalytics] = useState<AdminAnalytics>(emptyAnalytics);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Combina datos reales de reservation-service, user-service y parking-service
  // (ver apps/frontend/lib/admin-metrics.ts) — sin datos simulados.
  useEffect(() => {
    if (!isMounted || !slots.length || !globalStats) return;

    let cancelled = false;
    setAnalyticsLoading(true);

    getAdminAnalytics(slots, globalStats.occupied + globalStats.reserved, filters)
      .then((result) => {
        if (!cancelled) setAnalytics(result);
      })
      .catch((err) => {
        console.error('Error fetching admin analytics:', err);
        if (!cancelled) setAnalytics(emptyAnalytics);
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isMounted, slots, globalStats, filters]);

  const exportChartsToPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      setIsExporting(true);
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      await new Promise((r) => setTimeout(r, 800));
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Reporte_UCE_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const COLORS = ['#003366', '#CC0000', '#10b981', '#f59e0b'];

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-[#003366]" size={48} />
      </div>
    );
  }

  return (
    <DashboardShell allowedRoles={['ADMIN']}>
      <div className="p-4 md:p-6 xl:p-12 space-y-6 xl:space-y-10 bg-[#f8fafc] min-h-screen font-sans">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-6">
          <div className="w-full xl:w-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 text-[#003366] rounded-lg">
                <LayoutDashboard size={20} className="xl:w-8 xl:h-8" />
              </div>
              <span className="text-xs xl:text-base font-bold text-gray-400 uppercase tracking-widest">
                Administración
              </span>
            </div>
            <h1 className="text-3xl md:text-3xl xl:text-7xl font-black text-gray-900 tracking-tighter leading-none">
              Visión General
            </h1>
          </div>
          <div className="w-full xl:w-auto flex flex-col md:flex-row gap-3 bg-white p-3 rounded-2xl xl:rounded-[2rem] shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl w-full md:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={18} className="text-gray-400 shrink-0" />
                <input
                  type="date"
                  className="bg-transparent text-sm font-bold text-gray-600 outline-none w-full"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <span className="hidden sm:block text-gray-300 font-light">|</span>
              <input
                type="date"
                className="bg-transparent text-sm font-bold text-gray-600 outline-none w-full sm:w-auto"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setFilters({ startDate: '', endDate: '' })}
                className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                title="Limpiar"
              >
                <XCircle size={20} />
              </button>
              <button
                onClick={exportChartsToPDF}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#003366] text-white rounded-xl font-bold text-sm shadow-lg transition-all whitespace-nowrap cursor-pointer"
              >
                {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        <div ref={dashboardRef} style={{ backgroundColor: '#f8fafc', padding: '10px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-8 mb-8">

            <StatCard
              icon={<Car className="w-6 h-6 xl:w-8 xl:h-8" />}
              label="Ocupación"
              value={analytics.stats.activeNow}
              trend="Live"
              colorBg="#f0fdf4"
              colorText="#15803d"
            />
            <StatCard
              icon={<Clock className="w-6 h-6 xl:w-8 xl:h-8" />}
              label="Promedio"
              value={analytics.stats.avgTime}
              trend="Avg"
              colorBg="#faf5ff"
              colorText="#7e22ce"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 xl:w-8 xl:h-8" />}
              label="Top Puesto"
              value={`#${analytics.stats.mostUsedSlot}`}
              trend="Hot"
              colorBg="#fff7ed"
              colorText="#c2410c"
            />
          </div>

          {/* Panel de Estado del Sistema */}
          <div className="mb-8">
            <SystemHealthPanel />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8 mb-8">
            <div
              className="bg-white p-6 xl:p-10 rounded-3xl xl:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col justify-between"
              style={{ minHeight: '400px' }}
            >
              <div>
                <h3 className="text-lg xl:text-3xl font-black text-gray-800 mb-1">Roles</h3>
                <p className="text-xs xl:text-lg text-gray-400 font-medium">Distribución</p>
              </div>
              <div className="flex-1 w-full relative min-h-[300px] xl:min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.dataReport.roleCounts}
                      innerRadius="65%"
                      outerRadius="90%"
                      paddingAngle={5}
                      dataKey="value"
                      cornerRadius={8}
                      stroke="none"
                      cy="50%"
                    >
                      {analytics.dataReport.roleCounts.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10">
                  <span className="text-4xl xl:text-6xl font-black text-gray-800 leading-none">
                    {analytics.userStats.total}
                  </span>
                  <span className="text-xs xl:text-base text-gray-400 font-black uppercase tracking-widest mt-1">
                    Total
                  </span>
                </div>
              </div>
            </div>

            <div className="xl:col-span-2 bg-white p-6 xl:p-10 rounded-3xl xl:rounded-[3rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg xl:text-3xl font-black text-gray-800 mb-1">Top Usuarios</h3>
                  <p className="text-xs xl:text-lg text-gray-400 font-medium">Mayor frecuencia</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <History size={24} className="xl:w-8 xl:h-8" />
                </div>
              </div>
              <div className="space-y-3">
                {analytics.dataReport.topUsers.map((user, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 xl:p-4 bg-gray-50 hover:bg-blue-50/50 rounded-2xl transition-colors group"
                    style={{ backgroundColor: '#f9fafb' }}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-8 h-8 xl:w-12 xl:h-12 flex items-center justify-center rounded-xl font-black text-sm xl:text-xl ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-400 border'
                          }`}
                      >
                        #{i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-gray-800 text-sm xl:text-xl uppercase group-hover:text-[#003366]">
                          {user.name}
                        </p>
                        <div className="h-1.5 xl:h-2 w-24 xl:w-32 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-[#003366] rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (user.value / (analytics.dataReport.topUsers[0]?.value || 1)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg xl:text-3xl font-black text-[#003366]">{user.value}</p>
                      <p className="text-[10px] xl:text-xs font-bold text-gray-400 uppercase">Visitas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 mb-8">
            <div className="bg-white p-6 xl:p-10 rounded-3xl xl:rounded-[3rem] shadow-sm border border-gray-100">
              <h3 className="text-lg xl:text-3xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <Flame className="text-orange-500" size={24} /> Por Hora
              </h3>
              <div className="h-[250px] xl:h-[350px] w-full">
                <ResponsiveContainer>
                  <AreaChart data={analytics.dataReport.hourCounts}>
                    <defs>
                      <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hora" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="cantidad" stroke="#f97316" strokeWidth={3} fill="url(#colorVisitas)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 xl:p-10 rounded-3xl xl:rounded-[3rem] shadow-sm border border-gray-100">
              <h3 className="text-lg xl:text-3xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <Calendar className="text-blue-500" size={24} /> Días
              </h3>
              <div className="h-[250px] xl:h-[350px] w-full">
                <ResponsiveContainer>
                  <BarChart data={analytics.dataReport.dayCounts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="visitas" fill="#003366" radius={[8, 8, 8, 8]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl xl:rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px] xl:h-[800px]">
            <div className="p-6 xl:p-10 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <h3 className="text-lg xl:text-3xl font-black text-gray-800 flex gap-2 items-center">
                <FileText size={24} className="text-[#CC0000] xl:w-10 xl:h-10" /> Bitácora
              </h3>
              <span className="bg-blue-50 text-blue-800 px-3 py-1 xl:px-6 xl:py-2 rounded-xl font-black text-xs xl:text-sm uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                {analyticsLoading && <Loader2 className="animate-spin" size={14} />}
                {analytics.filteredSessions.length} Recientes
              </span>
            </div>
            <div className="overflow-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/95 backdrop-blur-sm text-gray-500 font-black uppercase text-xs xl:text-sm tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-4 xl:p-8">Usuario</th>
                    <th className="p-4 xl:p-8 text-center">Puesto</th>
                    <th className="p-4 xl:p-8">Entrada</th>
                    <th className="p-4 xl:p-8 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm xl:text-lg">
                  {analytics.filteredSessions.length > 0 ? (
                    analytics.filteredSessions.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 xl:p-8">
                          <p className="font-bold text-gray-800 text-sm xl:text-xl">
                            {row.profiles?.full_name || 'Desconocido'}
                          </p>
                          <p className="text-[10px] xl:text-xs text-gray-400 font-mono mt-1 font-bold">
                            ID: {row.id.substring(5, 9)}
                          </p>
                        </td>
                        <td className="p-4 xl:p-8 text-center">
                          <span className="inline-block w-10 h-10 xl:w-16 xl:h-16 leading-10 xl:leading-[64px] bg-gray-100 rounded-xl xl:rounded-2xl font-black text-sm xl:text-2xl text-[#003366]">
                            {row.parking_slots?.number}
                          </span>
                        </td>
                        <td className="p-4 xl:p-8 text-gray-600 font-bold text-xs xl:text-base">
                          <div className="flex items-center gap-2">
                            ↑ {new Date(row.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-4 xl:p-8 text-center">
                          <span
                            className={`px-3 py-1 xl:px-6 xl:py-2 rounded-lg text-[10px] xl:text-sm font-black uppercase tracking-wide border ${row.status === 'active'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                              }`}
                          >
                            {row.status === 'active' ? 'En Curso' : 'Fin'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-gray-400 italic">
                        Sin datos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}