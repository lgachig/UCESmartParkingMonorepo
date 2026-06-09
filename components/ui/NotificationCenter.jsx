import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Notification center: shows only notifications for the current user.
 * Fetches and subscribes to realtime by user_id.
 */
export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setNotifications([]);
      return;
    }
    fetchNotifications();
    const channel = supabase
      .channel(`notifications-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications(prev => [payload.new, ...prev])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications(prev => prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n))
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, fetchNotifications]);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle className="text-green-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-orange-500" size={24} />;
      case 'error': return <XCircle className="text-red-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 font-bold">Cargando avisos...</div>;

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Bell size={48} className="mb-4 opacity-20" />
        <p className="font-bold text-lg">Estás al día</p>
        <p className="text-sm">No hay notificaciones nuevas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notif) => (
        <div key={notif.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors group relative border border-transparent hover:border-blue-100">
          <div className="mt-1 flex-shrink-0">{getIcon(notif.type)}</div>
          <div className="flex-1 pr-6">
            <h4 className="font-black text-gray-800 text-base mb-1">{notif.title}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{notif.message}</p>
            <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-wider">{new Date(notif.created_at).toLocaleTimeString()}</p>
          </div>
          <button onClick={() => markAsRead(notif.id)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all opacity-0 group-hover:opacity-100" title="Marcar leída">
            <Check size={18} strokeWidth={3} />
          </button>
        </div>
      ))}
    </div>
  );
}