'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/lib/schemas/forgot-password.schema';
import { authService } from '@/services/auth.service';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setServerError(null);
    setSuccess(null);
    setResetUrl(null);
    try {
      const result = await authService.forgotPassword(data.email);
      setSuccess(result.message);
      if (result.resetUrl) {
        setResetUrl(result.resetUrl);
      }
    } catch (error) {
      setServerError(
        getAuthErrorMessage(error, 'No se pudo procesar la solicitud.'),
      );
    }
  };

  return (
    <AuthPageLayout withOrbs={false}>
      <div className="glass-panel relative z-10 w-full max-w-lg rounded-[2rem] p-8 md:p-12">
        <Link
          href="/login"
          className="mb-8 inline-flex text-sm font-medium text-white/50 transition-colors hover:text-white"
        >
          ← Volver al Login
        </Link>

        <h2 className="mb-2 text-3xl font-black text-white">
          Recuperar contraseña
        </h2>
        <p className="mb-8 text-white/60">
          Ingresa tu correo institucional. Si existe una cuenta, recibirás
          instrucciones para restablecer tu contraseña.
        </p>

        {serverError && (
          <div className="mb-6 flex items-center gap-3 border-l-4 border-red-500 bg-red-500/20 p-4 text-sm text-white">
            <AlertCircle size={20} className="shrink-0 text-red-400" />
            {serverError}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100">
            {success}
            {resetUrl && (
              <p className="mt-3 break-all">
                Enlace de prueba (QA/dev):{' '}
                <Link href={resetUrl} className="font-bold underline">
                  {resetUrl}
                </Link>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="relative">
            <Mail
              className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40"
              size={20}
            />
            <input
              {...register('email')}
              type="email"
              placeholder="usuario@uce.edu.ec"
              className="glass-input w-full rounded-xl py-4 pr-4 pl-12"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-xl bg-[#CC0000] py-4 font-black tracking-widest text-white uppercase"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'ENVIAR ENLACE'}
          </button>
        </form>
      </div>
    </AuthPageLayout>
  );
}
