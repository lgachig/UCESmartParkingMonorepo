import React, { useEffect, useState } from 'react';
import client from './api/axios';
import SlotCard, { type Slot } from './components/SlotCard';
import LoginForm from './components/LoginForm';

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('accessToken'));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | Slot['status']>('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get<Slot[]>('/parking/slots');
      setSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const handleAction = async (id: string, action: string) => {
    try {
      await client.patch(`/parking/slots/${id}/${action}`);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al actualizar el slot');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAuthed(false);
  };

  if (!authed) {
    return <LoginForm onSuccess={() => setAuthed(true)} />;
  }

  const filtered = filter === 'ALL' ? slots : slots.filter((s) => s.status === filter);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', background: '#F9FAFB', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Gestión de Slots</h2>
        <button onClick={logout}>Salir</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            style={{ marginRight: 8, fontWeight: filter === f ? 700 : 400 }}
          >
            {f}
          </button>
        ))}
        <button style={{ float: 'right' }} onClick={load}>Refrescar</button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map((slot) => (
            <SlotCard key={slot.id} slot={slot} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}