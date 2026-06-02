import { Car, MapPin, ShieldCheck } from 'lucide-react';
import { env } from '@/lib/env';

export function LoginHero() {
  return (
    <div className="hidden flex-col justify-between bg-gradient-to-br from-[#003366]/40 to-transparent p-12 text-white lg:flex">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white font-black text-[#003366]">
            UCE
          </div>
          <span className="text-sm font-bold tracking-widest uppercase">
            Facultad de Ingeniería
          </span>
        </div>
        <h1 className="mb-6 text-5xl leading-tight font-black">
          Gestión Inteligente <br />
          de <span className="text-blue-200">Espacios</span>
        </h1>
        <p className="max-w-md text-lg text-white/80">
          Bienvenido a <strong>{env.appName}</strong>. Optimiza tu tiempo en
          tiempo real.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <Car className="mb-2 text-blue-300" size={28} />
          <p className="text-xs font-bold">Monitoreo</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <MapPin className="mb-2 text-red-300" size={28} />
          <p className="text-xs font-bold">Ubicación</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <ShieldCheck className="mb-2 text-green-300" size={28} />
          <p className="text-xs font-bold">Seguridad</p>
        </div>
      </div>
    </div>
  );
}
