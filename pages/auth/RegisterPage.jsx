import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { registerSchema } from '../../utils/authSchemas';
import AuthPageLayout from '../../components/auth/AuthPageLayout';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await signUp(data.email, data.password, data.fullName);
      navigate('/user');
    } catch (error) {
      setServerError(error.message || 'Error al crear la cuenta.');
    }
  };

  return (
    <AuthPageLayout withOrbs={false}>
      <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-[#CC0000] rounded-full blur-[200px] opacity-20 animate-pulse" />
      <div className="w-full max-w-2xl glass-panel p-8 md:p-12 rounded-[2rem] relative z-10 animate-in slide-in-from-bottom-8 duration-700">
        <Link to="/login" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors text-sm font-medium">
          ← Volver al Login
        </Link>

        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">Crear Nueva Cuenta</h2>
          <p className="text-white/60 text-lg">Únete a la plataforma oficial de parqueo UCE</p>
        </div>

        {serverError && (
          <div className="mb-8 p-4 bg-red-500/20 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3 text-white text-sm">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Nombre Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
              <input {...register('fullName')} type="text" placeholder="Ej: Juan Pérez" className="w-full pl-12 pr-4 py-4 rounded-xl glass-input text-base" />
            </div>
            {errors.fullName && <p className="text-xs text-red-400 font-medium ml-1">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Correo Institucional</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
              <input {...register('email')} type="email" placeholder="usuario@uce.edu.ec" className="w-full pl-12 pr-4 py-4 rounded-xl glass-input text-base" />
            </div>
            {errors.email && <p className="text-xs text-red-400 font-medium ml-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
                <input {...register('password')} type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 rounded-xl glass-input text-base" />
              </div>
              {errors.password && <p className="text-xs text-red-400 font-medium ml-1">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Confirmar</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
                <input {...register('confirmPassword')} type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 rounded-xl glass-input text-base" />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400 font-medium ml-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#CC0000] text-white rounded-xl font-black uppercase tracking-widest hover:bg-[#aa0000] active:scale-95 transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-3">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'CREAR MI CUENTA'}
            </button>
          </div>
        </form>
      </div>
    </AuthPageLayout>
  );
}
