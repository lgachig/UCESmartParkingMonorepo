import { Clock, CheckCircle2 } from 'lucide-react';

/**
 * Toast notification for map actions (success, error, info).
 */
export default function ActionToast({ type = 'success', msg }) {
  if (!msg) return null;

  const bgClass =
    type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-sm animate-in fade-in zoom-in">
      <div className={`flex items-center gap-4 p-5 rounded-[2rem] shadow-2xl border-4 border-white ${bgClass} text-white`}>
        {type === 'info' ? <Clock size={24} /> : <CheckCircle2 size={30} />}
        <span className="font-black uppercase italic text-sm">{msg}</span>
      </div>
    </div>
  );
}
