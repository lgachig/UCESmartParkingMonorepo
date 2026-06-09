import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase'; 
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  History, 
  Car, 
  LogOut, 
  Menu,
  X,
  User,
  ChevronRight,
  FileText,
  Settings
} from 'lucide-react';

export default function Sidebar({ role = 'student' }) {
  const { profile } = useAuth(); 
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const isAdmin = role === 'admin' || role === 'r003';
  const isTeacher = role === 'teacher' || role === 'r002';

  let menuItems = [];

  if (isAdmin) {
    menuItems = [
      { icon: LayoutDashboard, label: 'Panel Principal', path: '/admin' },
      { icon: MapIcon, label: 'Gestión Espacios', path: '/admin/slots' },
      { icon: FileText, label: 'Reportes', path: '/admin/reports' },
    ];
  } else {
    menuItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/user' },
      { icon: History, label: 'Mis Reservas', path: '/user/reservations' },
      { icon: Car, label: 'Mi Vehículo', path: '/user/vehicle' },
    ];

  }

  const bgClass = 'bg-[#003366]';
  const buttonBgClass = scrolled || isOpen ? 'bg-white text-[#003366]' : 'bg-[#003366] text-white';

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`xl:hidden fixed top-4 left-4 z-[10001] p-2 rounded-xl transition-all duration-300 shadow-xl ${buttonBgClass}`}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] xl:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-72 ${bgClass} text-white z-[10000]
        transform transition-transform duration-300 ease-out shadow-2xl border-r border-white/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        xl:translate-x-0
      `}>
        <div className="h-24 flex items-center px-8 border-b border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                {isAdmin ? <Settings size={80} /> : <Car size={80} />}
            </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white p-2 rounded-lg shadow-lg">
                {isAdmin ? <Settings className="text-[#003366]" size={24} /> : <Car className="text-[#003366]" size={24} />}
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter italic">UCE PARKING</h1>
              <p className="text-[10px] font-medium text-blue-200 uppercase tracking-widest">
                {isAdmin ? 'ADMINISTRACIÓN' : 'SISTEMA INTELIGENTE'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3 shadow-inner">
                <div className="bg-blue-500/20 p-2 rounded-full">
                    <User size={20} className="text-blue-200" />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{profile?.full_name?.split(' ')[0] || 'Usuario'}</p>
                    <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">
                      {isAdmin ? 'Administrador' : (isTeacher ? 'Docente' : 'Estudiante')}
                    </p>
                </div>
            </div>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${isActive 
                  ? 'bg-white text-[#003366] shadow-lg font-bold translate-x-1' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }
              `}
              end={item.path === '/user' || item.path === '/admin'}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 relative z-10">
                    <item.icon size={20} className={isActive ? "animate-pulse" : ""} />
                    <span className="text-sm tracking-wide">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={16} className="text-[#CC0000]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 space-y-2 bg-gradient-to-t from-[#002244] to-transparent">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-200 hover:bg-red-500/10 hover:text-white transition-colors text-sm font-bold"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}