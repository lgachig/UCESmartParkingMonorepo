'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { LoginHero } from '@/components/auth/LoginHero';
import { LoginForm } from '@/components/auth/LoginForm';
import {
  loginSchema,
  type LoginFormValues,
} from '@/lib/schemas/login.schema';
import { useAuth } from '@/context/AuthContext';
import { getHomeRouteForRole } from '@/lib/env';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getHomeRouteForRole(user.role));
    }
  }, [isLoading, isAuthenticated, user, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    try {
      await login(data.email, data.password);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error, 'No se pudo iniciar sesión.'));
    }
  };

  if (isLoading) return null;

  return (
    <AuthPageLayout>
      <div className="glass-panel relative z-10 grid min-h-[650px] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2.5rem] shadow-2xl lg:grid-cols-2">
        <LoginHero />
        <LoginForm
          register={register}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          authError={authError}
          onSubmit={onSubmit}
        />
      </div>
    </AuthPageLayout>
  );
}
