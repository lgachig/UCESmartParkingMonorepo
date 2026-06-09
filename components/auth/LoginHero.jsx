import { Car, MapPin, ShieldCheck } from 'lucide-react';

/**
 * Left panel for login page: branding and feature highlights.
 */
export default function LoginHero() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#003366]/40 to-transparent text-white">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="Logo" className="h-12" />
          <span className="font-bold tracking-widest text-sm uppercase">Facultad de Ingeniería</span>
        </div>
        <h1 className="text-5xl font-black leading-tight mb-6">
          Gestión Inteligente <br />
          de <span className="text-blue-200">Espacios</span>
        </h1>
        <p className="text-lg text-white/80 max-w-md">
          Bienvenido a <strong>UCE Smart Parking</strong>. Optimiza tu tiempo en tiempo real.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <Car className="text-blue-300 mb-2" size={28} />
          <p className="text-xs font-bold">Monitoreo</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <MapPin className="text-red-300 mb-2" size={28} />
          <p className="text-xs font-bold">Ubicación</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <ShieldCheck className="text-green-300 mb-2" size={28} />
          <p className="text-xs font-bold">Seguridad</p>
        </div>
      </div>
    </div>
  );
}
