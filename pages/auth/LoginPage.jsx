import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../utils/authSchemas';
import AuthPageLayout from '../../components/auth/AuthPageLayout';
import LoginHero from '../../components/auth/LoginHero';
import LoginForm from '../../components/auth/LoginForm';

export default function LoginPage() {
  const { user, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  if (user) return <Navigate to="/user" replace />;

  const onSubmit = async (data) => {
    setAuthError(null);
    try {
      await signIn(data.email, data.password);
      navigate('/user');
    } catch (error) {
      setAuthError(
        error.message === 'Invalid login credentials' ? 'Credenciales incorrectas.' : error.message
      );
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError('Error al conectar con Google.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 glass-panel rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 min-h-[650px]">
        <LoginHero />
        <LoginForm
          register={register}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          authError={authError}
          onSubmit={onSubmit}
          onGoogleLogin={handleGoogleLogin}
          isGoogleLoading={isGoogleLoading}
        />
      </div>
    </AuthPageLayout>
  );
}
