'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import type {
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';
import type { LoginFormValues } from '@/lib/schemas/login.schema';
import Link from 'next/link';

interface LoginFormProps {
  register: UseFormRegister<LoginFormValues>;
  handleSubmit: UseFormHandleSubmit<LoginFormValues>;
  isSubmitting: boolean;
  authError: string | null;
  onSubmit: (data: LoginFormValues) => void;
}

export function LoginForm({
  register,
  handleSubmit,
  isSubmitting,
  authError,
  onSubmit,
}: LoginFormProps) {
  return (
    <div className="flex flex-col justify-center bg-white/5 p-8 backdrop-blur-xl md:p-16">
      <h2 className="mb-2 text-3xl font-black text-white">Iniciar Sesión</h2>
      <p className="mb-8 text-white/50">
        Usa tus credenciales institucionales.
      </p>

      {authError && (
        <div className="mb-6 flex items-center gap-3 border-l-4 border-red-500 bg-red-500/20 p-4 text-sm text-white">
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input
          {...register('email')}
          type="email"
          placeholder="usuario@uce.edu.ec"
          className="w-full rounded-xl bg-white/80 p-4 text-black outline-none"
        />
        <input
          {...register('password')}
          type="password"
          placeholder="••••••••"
          className="w-full rounded-xl bg-white/80 p-4 text-black outline-none"
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-white/70 hover:text-white hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-white py-4 font-black tracking-widest text-[#003366] uppercase transition-all hover:bg-blue-50"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto animate-spin" />
          ) : (
            'ACCEDER'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-white/60">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="font-bold text-white hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
}
