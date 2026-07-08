'use client';

import { useEffect, useState } from 'react';
import { systemService, type SystemStatus } from '@/services/system.service';
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Radio, Database, Clock,
  RefreshCw, Server, Send, CheckCircle, AlertCircle
} from 'lucide-react';

export default function SystemHealthPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const data = await systemService.getStatus();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching system health status:', err);
      setError(err?.message || 'Error de conexión con el gateway');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(true), 20000);
    return () => clearInterval(interval);
  }, []);

  const formatServiceName = (name: string) => {
    const replacements: Record<string, string> = {
      auth: 'Auth Service',
      user: 'User Service',
      vehicle: 'Vehicle Service',
      parking: 'Parking Service',
      reservation: 'Reservation Service',
      payment: 'Payment Service',
      notification: 'Notification Service',
      ai: 'AI Service',
      realtime: 'Realtime Service',
      audit: 'Audit Service',
    };
    return replacements[name] || name;
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="animate-spin text-[#003366] w-10 h-10 mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando estado del sistema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <AlertTriangle className="text-red-500 w-12 h-12 mb-4 animate-bounce" />
        <h3 className="text-lg font-black text-gray-800 mb-2">Error de Conexión</h3>
        <p className="text-gray-500 font-medium max-w-md text-sm mb-6">{error}</p>
        <button
          onClick={() => { setLoading(true); fetchStatus(); }}
          className="px-6 py-2.5 bg-[#003366] text-white rounded-xl font-bold text-xs shadow-md hover:bg-opacity-90 transition-all cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!status) return null;

  const isOperational = status.overallStatus === 'operational';

  return (
    <div className="space-y-6">
      {/* Banner de estado general */}
      <div className={`p-6 xl:p-8 rounded-3xl border transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white ${isOperational ? 'border-emerald-100 shadow-emerald-50/10' : 'border-amber-100 shadow-amber-50/10'
        }`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${isOperational ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <Activity className={`w-8 h-8 ${isRefreshing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg xl:text-2xl font-black text-gray-800">Estado del Sistema</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] xl:text-xs font-black uppercase tracking-wider ${isOperational ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                {isOperational ? 'Operacional' : 'Degradado'}
              </span>
            </div>
            <p className="text-xs xl:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
              Última actualización: {new Date(status.generatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Realtime Connections metrics inline */}
        <div className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100/70 transition-colors px-5 py-3 rounded-2xl border border-gray-100">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.realtime.connected ? 'bg-emerald-400' : 'bg-red-400'
              }`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${status.realtime.connected ? 'bg-emerald-500' : 'bg-red-500'
              }`}></span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-gray-400" />
            <span className="text-xs xl:text-sm font-black text-gray-600 uppercase tracking-widest">
              Conexiones Realtime:
            </span>
            <span className="text-sm xl:text-lg font-black text-[#003366]">
              {status.realtime.activeConnections !== null ? status.realtime.activeConnections : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de servicios microservicios */}
      <div className="bg-white p-6 xl:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xs xl:text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Server size={16} className="text-gray-400" /> Estado de Microservicios
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {status.services.map((service) => (
            <div
              key={service.name}
              className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-28 group ${service.up
                  ? 'border-gray-100 bg-white hover:border-emerald-200'
                  : 'border-red-100 bg-red-50/10 hover:bg-red-50/20'
                }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs xl:text-sm font-black text-gray-800 leading-snug group-hover:text-[#003366] transition-colors uppercase break-words pr-2">
                  {formatServiceName(service.name)}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${service.up ? 'bg-emerald-500 shadow-sm animate-pulse' : 'bg-red-500 animate-ping'
                  }`} />
              </div>
              <div className="mt-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${service.up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {service.up ? 'En Línea' : 'Caído'}
                </span>
                {!service.up && service.error && (
                  <p className="text-[9px] text-red-500 font-medium truncate mt-1.5" title={service.error}>
                    {service.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outbox Metrics section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['parking', 'reservation', 'payment'] as const).map((serviceKey) => {
          const outboxData = status.outbox[serviceKey];
          const displayNames = {
            parking: 'Parking Service',
            reservation: 'Reservation Service',
            payment: 'Payment Service',
          };

          return (
            <div key={serviceKey} className="bg-white p-6 xl:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow font-sans">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm xl:text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-gray-400" />
                  {displayNames[serviceKey]}
                </h4>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outbox</span>
              </div>

              {outboxData ? (
                <div className="grid grid-cols-3 gap-2">
                  {/* Pending */}
                  <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-2xl text-center group hover:bg-amber-50 transition-colors">
                    <div className="flex justify-center mb-1 text-amber-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Pendientes</span>
                    <span className="text-xl xl:text-3xl font-black text-amber-600 block mt-1 leading-none">
                      {outboxData.pending}
                    </span>
                  </div>

                  {/* Processed */}
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl text-center group hover:bg-emerald-50 transition-colors">
                    <div className="flex justify-center mb-1 text-emerald-500">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Procesados</span>
                    <span className="text-xl xl:text-3xl font-black text-emerald-600 block mt-1 leading-none">
                      {outboxData.processed}
                    </span>
                  </div>

                  {/* Failed */}
                  <div className="p-3 bg-red-50/50 border border-red-100/50 rounded-2xl text-center group hover:bg-red-50 transition-colors">
                    <div className="flex justify-center mb-1 text-red-500">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block">Fallidos</span>
                    <span className="text-xl xl:text-3xl font-black text-red-600 block mt-1 leading-none">
                      {outboxData.failed}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <AlertTriangle className="w-5 h-5 text-gray-400 mx-auto mb-1 animate-pulse" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Métricas No Disponibles</span>
                </div>
              )}

              {/* n8n status */}
              {outboxData && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> n8n
                    </span>
                    {outboxData.n8n.failed > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Con errores
                      </span>
                    ) : outboxData.n8n.sent > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> OK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-500">
                        Sin actividad
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-center">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Enviados</span>
                      <span className="text-lg font-black text-emerald-600 block leading-none mt-0.5">
                        {outboxData.n8n.sent}
                      </span>
                    </div>
                    <div className="p-2.5 bg-red-50/50 border border-red-100/50 rounded-xl text-center">
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block">Fallidos</span>
                      <span className="text-lg font-black text-red-600 block leading-none mt-0.5">
                        {outboxData.n8n.failed}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
