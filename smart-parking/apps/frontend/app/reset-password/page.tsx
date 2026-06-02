'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/lib/schemas/reset-password.schema';
import { authService } from '@/services/auth.service';
import { getAuthErrorMessage } from '@/lib/auth-errors';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';

  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenFromUrl },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setServerError(null);
    setSuccess(null);
    try {
      const result = await authService.resetPassword(
        data.token,
        data.newPassword,
      );
      setSuccess(result.message);
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      setServerError(
        getAuthErrorMessage(error, 'No se pudo restablecer la contraseña.'),
      );
    }
  };

  return (
    <div className="glass-panel relative z-10 w-full max-w-lg rounded-[2rem] p-8 md:p-12">
      <Link
        href="/login"
        className="mb-8 inline-flex text-sm font-medium text-white/50 transition-colors hover:text-white"
      >
        ← Volver al Login
      </Link>

      <h2 className="mb-2 text-3xl font-black text-white">Nueva contraseña</h2>
      <p className="mb-8 text-white/60">
        Define una contraseña segura para tu cuenta.
      </p>

      {serverError && (
        <div className="mb-6 flex items-center gap-3 border-l-4 border-red-500 bg-red-500/20 p-4 text-sm text-white">
          <AlertCircle size={20} className="shrink-0 text-red-400" />
          {serverError}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100">
          {success}. Redirigiendo al login...
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {!tokenFromUrl && (
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-wider text-white/70 uppercase">
              Token de recuperación
            </label>
            <input
              {...register('token')}
              type="text"
              placeholder="Pega el token recibido"
              className="glass-input w-full rounded-xl px-4 py-4"
            />
            {errors.token && (
              <p className="text-xs text-red-400">{errors.token.message}</p>
            )}
          </div>
        )}
        {tokenFromUrl && <input type="hidden" {...register('token')} />}

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-wider text-white/70 uppercase">
            Nueva contraseña
          </label>
          <div className="relative">
            <Lock
              className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40"
              size={20}
            />
            <input
              {...register('newPassword')}
              type="password"
              placeholder="Password1!"
              className="glass-input w-full rounded-xl py-4 pr-4 pl-12"
            />
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-400">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-wider text-white/70 uppercase">
            Confirmar contraseña
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
              className="glass-input w-full rounded-xl py-4 pr-4 pl-12"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-white py-4 font-black tracking-widest text-[#003366] uppercase"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            'ACTUALIZAR CONTRASEÑA'
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageLayout withOrbs={false}>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageLayout>
  );
}
