import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { Car, Save, Loader2, AlertCircle } from 'lucide-react';

export default function UserVehiclePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [vehicle, setVehicle] = useState({ license_plate: '', make: '', model: '', color: '' });

  useEffect(() => {
    async function loadVehicleData() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase.from('vehicles').select('license_plate, make, model, color').eq('user_id', user.id).maybeSingle();
        if (error) return;
        if (data) setVehicle({ license_plate: data.license_plate || '', make: data.make || '', model: data.model || '', color: data.color || '' });
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) loadVehicleData();
  }, [user, authLoading]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const { error } = await supabase.from('vehicles').upsert(
        { user_id: user.id, license_plate: vehicle.license_plate.toUpperCase().trim(), make: vehicle.make.trim(), model: vehicle.model.trim(), color: vehicle.color.trim(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
      setMessage({ type: 'success', text: '¡Información actualizada!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center font-black text-[#003366]">
        <Loader2 className="animate-spin mb-4 text-[#CC0000]" size={40} />
        <p className="italic text-sm md:text-base">CARGANDO...</p>
      </div>
    );

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-5xl mx-auto w-full">
      <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-xl md:shadow-2xl overflow-hidden border-2 md:border-4 border-white">
        <div className="bg-[#003366] p-6 md:p-10 text-white relative overflow-hidden">
          <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter z-10 relative">Mi Vehículo</h1>
          <p className="text-blue-200 font-bold mt-1 md:mt-2 text-[10px] md:text-xs uppercase tracking-widest truncate max-w-[80%] z-10 relative">ID: {user?.id}</p>
          <Car className="absolute -right-4 -top-4 size-32 md:size-48 text-white/10 -rotate-12 pointer-events-none" />
        </div>
        <form onSubmit={handleSave} className="p-5 md:p-10 space-y-6 md:space-y-8">
          {message.text && (
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <AlertCircle size={18} className="shrink-0" /> {message.text}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {['license_plate', 'make', 'model', 'color'].map((key) => (
              <div key={key} className="space-y-1 md:space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 md:ml-4">
                  {key === 'license_plate' ? 'Placa' : key === 'make' ? 'Marca' : key === 'model' ? 'Modelo' : 'Color'}
                </label>
                <input
                  className="w-full p-4 md:p-6 bg-gray-50 border-2 md:border-4 border-transparent focus:border-[#003366] rounded-2xl md:rounded-[2rem] outline-none font-bold text-sm md:text-lg placeholder:text-gray-300"
                  value={vehicle[key]}
                  onChange={(e) => setVehicle({ ...vehicle, [key]: e.target.value })}
                  placeholder={key === 'license_plate' ? 'PBA-1234' : key === 'make' ? 'Ej. Toyota' : key === 'model' ? 'Ej. Corolla' : 'Ej. Blanco'}
                  required={key === 'license_plate'}
                />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} className="w-full py-4 md:py-6 bg-[#003366] text-white rounded-xl md:rounded-[2rem] font-black uppercase tracking-widest shadow-lg md:shadow-xl flex items-center justify-center gap-2 md:gap-3 active:scale-95 transition-all text-sm md:text-xl hover:bg-blue-900">
            {saving ? <Loader2 className="animate-spin w-4 h-4 md:w-6 md:h-6" /> : <Save className="w-4 h-4 md:w-6 md:h-6" />}
            {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </form>
      </div>
    </div>
  );
}
