import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Login form: email, password, submit and Google button.
 */
export default function LoginForm({
  register,
  handleSubmit,
  isSubmitting,
  authError,
  onSubmit,
  onGoogleLogin,
  isGoogleLoading,
}) {
  return (
    <div className="flex flex-col justify-center p-8 md:p-16 bg-white/5 backdrop-blur-xl">
      <h2 className="text-3xl font-black text-white mb-2">Iniciar Sesión</h2>
      <p className="text-white/50 mb-8">Usa tus credenciales institucionales.</p>

      {authError && (
        <div className="mb-6 p-4 bg-red-500/20 border-l-4 border-red-500 text-white text-sm flex gap-3 items-center">
          <AlertCircle size={20} className="text-red-400" /> {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input
          {...register('email')}
          type="email"
          placeholder="usuario@uce.edu.ec"
          className="w-full p-4 rounded-xl bg-white/80 text-black outline-none"
        />
        <input
          {...register('password')}
          type="password"
          placeholder="••••••••"
          className="w-full p-4 rounded-xl bg-white/80 text-black outline-none"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-white text-[#003366] rounded-xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all"
        >
          {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'ACCEDER'}
        </button>
      </form>

      <div className="relative my-8 text-center text-xs uppercase text-white/40">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <span className="relative px-3 bg-[#1a1a1a]">O continúa con</span>
      </div>

      <button
        onClick={onGoogleLogin}
        disabled={isGoogleLoading}
        className="w-full py-3.5 bg-white/5 border border-white/10 text-white rounded-xl font-bold flex items-center justify-center gap-3"
      >
        {isGoogleLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            Google Institucional
          </>
        )}
      </button>
    </div>
  );
}
