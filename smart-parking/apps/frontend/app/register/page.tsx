'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, AlertCircle, User, Mail, Lock } from 'lucide-react';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/lib/schemas/register.schema';
import { useAuth } from '@/context/AuthContext';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
    } catch (error) {
      setServerError(getAuthErrorMessage(error, 'Error al crear la cuenta.'));
    }
  };

  return (
    <AuthPageLayout withOrbs={false}>
      <div className="absolute top-[-5%] right-[-5%] h-[600px] w-[600px] animate-pulse rounded-full bg-[#CC0000] opacity-20 blur-[200px]" />
      <div className="glass-panel relative z-10 w-full max-w-2xl rounded-[2rem] p-8 md:p-12">
        <Link
          href="/login"
          className="mb-8 inline-flex text-sm font-medium text-white/50 transition-colors hover:text-white"
        >
          ← Volver al Login
        </Link>

        <div className="mb-10 text-center">
          <h2 className="mb-2 text-4xl font-black tracking-tight text-white">
            Crear Nueva Cuenta
          </h2>
          <p className="text-lg text-white/60">
            Únete a la plataforma oficial de parqueo UCE
          </p>
        </div>

        {serverError && (
          <div className="mb-8 flex items-center gap-3 rounded-r-lg border-l-4 border-red-500 bg-red-500/20 p-4 text-sm text-white">
            <AlertCircle size={20} className="shrink-0 text-red-400" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold tracking-wider text-white/70 uppercase">
                Nombre
              </label>
              <div className="relative">
                <User
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40"
                  size={20}
                />
                <input
                  {...register('firstName')}
                  type="text"
                  placeholder="Luis"
                  className="glass-input w-full rounded-xl py-4 pr-4 pl-12 text-base"
                />
              </div>
              {errors.firstName && (
                <p className="ml-1 text-xs font-medium text-red-400">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold tracking-wider text-white/70 uppercase">
                Apellido
              </label>
              <div className="relative">
                <User
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40"
                  size={20}
                />
                <input
                  {...register('lastName')}
                  type="text"
                  placeholder="Achig"
                  className="glass-input w-full rounded-xl py-4 pr-4 pl-12 text-base"
                />
              </div>
              {errors.lastName && (
                <p className="ml-1 text-xs font-medium text-red-400">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold tracking-wider text-white/70 uppercase">
              Correo Institucional
            </label>
            <div className="relative">
              <Mail
                className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40"
                size={20}
              />
              <input
                {...register('email')}
                type="email"
                placeholder="usuario@uce.edu.ec"
                className="glass-input w-full rounded-xl py-4 pr-4 pl-12 text-base"
              />
            </div>
            {errors.email && (
              <p className="ml-1 text-xs font-medium text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold tracking-wider text-white/70 uppercase">
              Teléfono (opcional)
            </label>
            <input
              {...register('phone')}
              type="text"
              placeholder="0999999999"
              className="glass-input w-full rounded-xl px-4 py-4 text-base"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold tracking-wider text-white/70 uppercase">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40"
                  size={20}
                />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Password1!"
                  className="glass-input w-full rounded-xl py-4 pr-4 pl-12 text-base"
                />
              </div>
              {errors.password && (
                <p className="ml-1 text-xs font-medium text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold tracking-wider text-white/70 uppercase">
                Confirmar
              </label>
              <div className="relative">
                <Lock
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40"
                  size={20}
                />
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className="glass-input w-full rounded-xl py-4 pr-4 pl-12 text-base"
                />
              </div>
              {errors.confirmPassword && (
                <p className="ml-1 text-xs font-medium text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-white/50">
            La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y
            símbolo.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#CC0000] py-4 font-black tracking-widest text-white uppercase shadow-xl shadow-red-900/40 transition-all hover:bg-[#aa0000] active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              'CREAR MI CUENTA'
            )}
          </button>
        </form>
      </div>
    </AuthPageLayout>
  );
}
