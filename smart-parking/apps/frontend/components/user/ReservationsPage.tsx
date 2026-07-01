'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Loader2, RefreshCw, DollarSign } from 'lucide-react';
import { reservationService, type Reservation } from '@/services/reservation.service';
import { paymentService } from '@/services/payment.service';
import { useAuth } from '@/context/AuthContext';

const RATE_PER_HOUR: Record<string, number> = {
  STUDENT: 10,
  GUEST: 10,
  PROFESSOR: 0,
  ADMIN: 0,
};

function getRateForRole(role?: string): number {
  if (!role) return 0;
  return RATE_PER_HOUR[role.toUpperCase()] ?? 0;
}

function calculateAmount(role: string | undefined, durationMinutes: number): number {
  const rate = getRateForRole(role);
  if (rate === 0 || durationMinutes <= 0) return 0;
  return Math.round((durationMinutes / 60) * rate * 100) / 100;
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  ACTIVE: { label: 'Activa', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  COMPLETED: { label: 'Completada', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  CANCELLED: { label: 'Cancelada', icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
  EXPIRED: { label: 'Expirada', icon: XCircle, color: 'text-red-400', bg: 'bg-red-50', border: 'border-red-200' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatDuration(min?: number) {
  if (!min) return '—';
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function ReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<{ [id: string]: boolean }>({});
  const [payErrors, setPayErrors] = useState<{ [id: string]: string }>({});
  const [paidFree, setPaidFree] = useState<{ [id: string]: boolean }>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const hasActiveReservation = reservations.some((r) => r.status === 'ACTIVE' && r.checkInAt);

  useEffect(() => {
    if (!hasActiveReservation) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasActiveReservation]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reservationService.getMyReservations();
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReservations(data);
    } catch {
      showToast('No se pudo cargar el historial', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePay = async (reservation: Reservation) => {
    setPaying((p) => ({ ...p, [reservation.id]: true }));
    setPayErrors((e) => { const n = { ...e }; delete n[reservation.id]; return n; });
    try {
      const checkout = await paymentService.startCheckoutFlow(reservation.id);

      if (checkout.free) {
        showToast('Reserva sin costo — no se requiere pago', 'success');
        setPaidFree((p) => ({ ...p, [reservation.id]: true }));
        await load();
        return;
      }

      if (checkout.url) {
        window.location.href = checkout.url;
      }
    } catch (err: any) {
      const msg =
        typeof err?.response?.data?.message === 'string'
          ? err.response.data.message
          : 'No se pudo iniciar el pago. Intenta de nuevo.';
      setPayErrors((e) => ({ ...e, [reservation.id]: msg }));
    } finally {
      setPaying((p) => ({ ...p, [reservation.id]: false }));
    }
  };

  const toastBg = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-[#003366]' };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-white font-bold shadow-2xl text-sm ${toastBg[toast.type]}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#003366] uppercase tracking-tight">Mis Reservas</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">{reservations.length} reservas en total</p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-xl border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#003366]" />
        </div>
      )}

      {!loading && reservations.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-gray-300" />
          </div>
          <p className="font-black text-gray-400 uppercase tracking-widest text-sm">Sin reservas aún</p>
        </div>
      )}

      <div className="space-y-3">
        {reservations.map((r) => {
          const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.EXPIRED;
          const Icon = cfg.icon;
          const isPaying = paying[r.id];
          const payError = payErrors[r.id];
          const wasPaidFree = paidFree[r.id];
          const isLiveTicking = r.status === 'ACTIVE' && !!r.checkInAt && !r.checkOutAt;
          const liveElapsedMs = isLiveTicking ? now - new Date(r.checkInAt as string).getTime() : 0;
          const liveElapsedMinutes = isLiveTicking ? liveElapsedMs / 60000 : 0;
          const liveAmount = isLiveTicking ? calculateAmount(user?.role, liveElapsedMinutes) : 0;
          const rate = getRateForRole(user?.role);
          const finalAmount =
            r.status === 'COMPLETED' && r.durationMinutes != null
              ? calculateAmount(user?.role, r.durationMinutes)
              : null;

          return (
            <div key={r.id}
              className={`rounded-2xl border-2 p-4 ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div>
                    <p className="font-black text-[#003366] text-sm uppercase tracking-wide">Código: {r.reservationCode}</p>
                    <p className={`text-xs font-bold uppercase ${cfg.color}`}>{cfg.label}</p>
                  </div>
                </div>

                {r.status === 'COMPLETED' && !wasPaidFree && (
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {finalAmount !== null && (
                      <span className="text-sm font-black text-[#003366]">
                        {formatMoney(finalAmount)}
                      </span>
                    )}
                    <button
                      onClick={() => handlePay(r)}
                      disabled={isPaying}
                      className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white text-xs font-black rounded-xl uppercase tracking-wide hover:bg-blue-900 transition-all disabled:opacity-50"
                    >
                      {isPaying ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                      {isPaying ? 'Procesando...' : 'Pagar'}
                    </button>
                  </div>
                )}

                {r.status === 'COMPLETED' && wasPaidFree && (
                  <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-xl border border-green-200 flex-shrink-0">
                    <CheckCircle size={12} /> Sin costo
                  </span>
                )}
              </div>

              {payError && (
                <p className="mt-2 text-xs text-red-600 font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">{payError}</p>
              )}

              {isLiveTicking && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border-2 border-blue-200 bg-white px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-gray-400">Tiempo transcurrido</p>
                      <p className="font-mono font-black text-sm text-[#003366] tabular-nums">
                        {formatElapsed(liveElapsedMs)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase text-gray-400">
                      {rate > 0 ? `Debes pagar (${formatMoney(rate)}/hora)` : 'Sin costo'}
                    </p>
                    <p className="flex items-center justify-end gap-1 font-black text-lg text-green-700 tabular-nums">
                      <DollarSign size={16} />
                      {formatMoney(liveAmount)}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Reservado</p>
                  <p className="font-bold text-gray-700">{formatDate(r.reservedAt)}</p>
                </div>
                {r.checkInAt && (
                  <div>
                    <p className="text-gray-400 font-semibold uppercase text-[10px]">Check-in</p>
                    <p className="font-bold text-gray-700">{formatDate(r.checkInAt)}</p>
                  </div>
                )}
                {r.checkOutAt && (
                  <div>
                    <p className="text-gray-400 font-semibold uppercase text-[10px]">Check-out</p>
                    <p className="font-bold text-gray-700">{formatDate(r.checkOutAt)}</p>
                  </div>
                )}
                {r.durationMinutes != null && (
                  <div>
                    <p className="text-gray-400 font-semibold uppercase text-[10px]">Duración</p>
                    <p className="font-bold text-gray-700">{formatDuration(r.durationMinutes)}</p>
                  </div>
                )}
                {r.cancelledAt && (
                  <div>
                    <p className="text-gray-400 font-semibold uppercase text-[10px]">Cancelado</p>
                    <p className="font-bold text-gray-700">{formatDate(r.cancelledAt)}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}