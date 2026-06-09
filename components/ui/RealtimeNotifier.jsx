"use client";
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth'; 
import { AlertTriangle, Bell, CheckCircle2, XCircle } from 'lucide-react';

export default function RealtimeNotifier() {
  const { profile, user } = useAuth();
  const [alert, setAlert] = useState(null);

  const showNotification = useCallback((msg, type) => {
    setAlert({ msg, type });
    try { 
      const audio = new Audio('/notification.mp3'); 
      audio.play(); 
    } catch(e) {
      console.log("Audio play blocked or not found");
    }
    setTimeout(() => setAlert(null), 8000);
  }, []);

  // Lógica de monitoreo de aforo (Solo ejecutada por el Admin para evitar duplicados)
  const checkGlobalStatus = useCallback(async () => {
    if (profile?.role_id !== 'r003') return; 
    
    const { data: slots } = await supabase.from('parking_slots').select('status');
    if (!slots || slots.length === 0) return;

    const occupied = slots.filter(s => s.status === 'occupied').length;
    const porcentaje = Math.round((occupied / slots.length) * 100);

    // Insertar en DB si hay hitos de ocupación
    if (porcentaje >= 100 || porcentaje === 80) {
      const type = porcentaje >= 100 ? 'danger' : 'warning';
      const title = porcentaje >= 100 ? "⚠️ PARQUEADERO LLENO" : "🔔 ALTA OCUPACIÓN";
      
      await supabase.from('notifications').insert({ 
        title, 
        message: `Aforo al ${porcentaje}%`, 
        type, 
        role_target: 'all',
        is_read: false 
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-system-alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          const n = payload.new;
          
          // FILTRO: Solo mostrar si es para mí o para todos (Global)
          const paraMi = n.role_target === 'all' || n.user_id === user.id;
          
          if (paraMi) {
            // Mostramos el Título de la notificación en el banner flotante
            showNotification(n.title, n.type || 'info');
          }
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'parking_slots' }, 
        () => { 
          // Si cambian los puestos, el admin verifica si debe disparar alerta de aforo
          if (profile?.role_id === 'r003') checkGlobalStatus(); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, profile, showNotification, checkGlobalStatus]);

  if (!alert) return null;

  const styles = {
    danger: "bg-red-600 border-white text-white shadow-red-500/50",
    success: "bg-green-600 border-white text-white shadow-green-500/50",
    info: "bg-[#003366] border-white text-white shadow-blue-500/50",
    warning: "bg-orange-500 border-white text-white shadow-orange-500/50"
  };

  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-md px-4 animate-in slide-in-from-top duration-500 pointer-events-auto">
      <div className={`${styles[alert.type] || styles.info} p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border-4`}>
        <div className="bg-white/20 p-3 rounded-full text-white">
          {alert.type === 'success' ? <CheckCircle2 size={32} /> : 
           alert.type === 'danger' ? <AlertTriangle size={32} /> : 
           alert.type === 'warning' ? <AlertTriangle size={32} /> : <Bell size={32} />}
        </div>
        <div className="flex-1">
          <p className="font-black text-lg uppercase text-white leading-tight tracking-tight">
            {alert.msg}
          </p>
        </div>
        <button 
          onClick={() => setAlert(null)} 
          className="text-white/70 hover:text-white transition-colors"
        >
          <XCircle size={24} />
        </button>
      </div>
    </div>
  );
}