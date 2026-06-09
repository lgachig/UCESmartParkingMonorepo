import { Loader2 } from 'lucide-react';

/**
 * Full-screen or inline loading spinner. Optional message.
 */
export default function LoadingSpinner({ message = 'Cargando...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <Loader2 className="animate-spin text-[#003366] w-12 h-12" />
      {message && <p className="text-[#003366] font-bold animate-pulse">{message}</p>}
    </div>
  );
}
