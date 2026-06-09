import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { Download, History, Flame, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function BigDecisionCard({ title, value, desc, color }) {
  const bg = { blue: 'bg-[#003366]', orange: 'bg-[#f97316]', green: 'bg-[#10b981]' };
  return (
    <div className={`${bg[color]} p-12 rounded-[3.5rem] text-white shadow-2xl transform hover:scale-105 transition-transform`}>
      <p className="text-xs font-black opacity-60 uppercase tracking-widest">{title}</p>
      <h3 className="text-4xl font-black mt-2 uppercase italic leading-none">{value}</h3>
      <p className="text-sm mt-4 font-bold opacity-80 uppercase">{desc}</p>
    </div>
  );
}

export default function AdminStatics() {
  const [dataReport, setDataReport] = useState({ dayCounts: [], hourCounts: [], roleCounts: [], topUsers: [] });
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data: sessions } = await supabase.from('parking_sessions').select('start_time, user_id, profiles:user_id ( full_name, role_id )');
      const { data: profiles } = await supabase.from('profiles').select('role_id');
      processChartData(sessions || [], profiles || []);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (sessions, profiles) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayCounts = days.map((day) => ({ name: day, visitas: 0 }));
    const hourCounts = Array.from({ length: 15 }, (_, i) => ({ hora: `${i + 7}:00`, cantidad: 0 }));
    const userMap = {};
    sessions.forEach((s) => {
      const date = new Date(s.start_time);
      dayCounts[date.getDay()].visitas++;
      const hour = date.getHours();
      if (hour >= 7 && hour <= 21) hourCounts[hour - 7].cantidad++;
      const userName = s.profiles?.full_name || 'Usuario General';
      userMap[userName] = (userMap[userName] || 0) + 1;
    });
    const topUsers = Object.entries(userMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    const rolesMap = { r001: 'Estudiantes', r002: 'Docentes', r003: 'Administrativos' };
    const roleStats = profiles.reduce((acc, curr) => { const name = rolesMap[curr.role_id] || 'Otros'; acc[name] = (acc[name] || 0) + 1; return acc; }, {});
    setDataReport({ dayCounts, hourCounts, roleCounts: Object.entries(roleStats).map(([name, value]) => ({ name, value })), topUsers });
  };

  useEffect(() => { fetchHistory(); }, []);

  const downloadPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Reporte_UCE_Smart.pdf');
  };

  const COLORS = ['#003366', '#f97316', '#10b981', '#6366f1'];

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl animate-pulse text-[#003366]">PREPARANDO INTELIGENCIA...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-6xl font-black text-[#003366] italic uppercase leading-none tracking-tighter">Reporte Maestro</h1>
          <p className="text-xl text-gray-400 font-bold mt-4 uppercase tracking-widest">Estadísticas de Uso UCE Smart</p>
        </div>
        <button onClick={downloadPDF} className="flex items-center gap-4 px-10 py-6 bg-[#003366] text-white rounded-[2rem] font-black text-lg uppercase shadow-2xl hover:bg-blue-900 transition-all">
          <Download size={24} /> Descargar PDF
        </button>
      </div>

      <div ref={reportRef} className="space-y-12 p-6 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-gray-100 flex flex-col items-center">
            <h2 className="text-2xl font-black text-gray-800 uppercase mb-8 italic text-center">Usuarios por Rol</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataReport.roleCounts} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                    {dataReport.roleCounts.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={20} wrapperStyle={{ fontSize: '16px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-800 uppercase mb-8 flex items-center gap-4 italic"><History size={30} className="text-blue-600" /> Top 5 Reincidencia</h2>
            <div className="grid grid-cols-1 gap-6">
              {dataReport.topUsers.map((user, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border-l-[12px] border-[#003366]">
                  <p className="text-2xl font-black text-[#003366] uppercase">{user.name}</p>
                  <div className="text-right bg-white px-8 py-3 rounded-full shadow-inner">
                    <p className="text-3xl font-black text-blue-600">{user.value} <span className="text-sm text-gray-400">USOS</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
          <h2 className="text-2xl font-black text-gray-800 uppercase mb-10 flex items-center gap-4 italic"><Flame size={32} className="text-orange-500" /> Saturación por Hora (Puntos Críticos)</h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataReport.hourCounts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="hora" tick={{ fontSize: 14, fontWeight: 'bold' }} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '20px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="cantidad" stroke="#f97316" strokeWidth={6} fill="#f97316" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
          <h2 className="text-2xl font-black text-gray-800 uppercase mb-10 flex items-center gap-4 italic text-[#003366]"><TrendingUp size={32} /> Tendencia Semanal de Ingresos</h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataReport.dayCounts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 16, fontWeight: 'black' }} axisLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="visitas" fill="#003366" radius={[20, 20, 0, 0]} barSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <BigDecisionCard title="ESTADO" value="ALTA DEMANDA" desc="Reforzar mañanas" color="blue" />
          <BigDecisionCard title="DÍA PICO" value={dataReport.dayCounts.length ? dataReport.dayCounts.reduce((p, c) => (p.visitas > c.visitas ? p : c)).name : '-'} desc="Mayor tráfico" color="orange" />
          <BigDecisionCard title="ESTRATEGIA" value="3H LÍMITE" desc="Optimizar rotación" color="green" />
        </div>
      </div>
    </div>
  );
}
