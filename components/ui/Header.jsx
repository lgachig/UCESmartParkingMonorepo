import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../contexts/SidebarContext";
import { Bell, User, Menu } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

export default function Header({ title, variant = "user" }) {
  const { user, profile } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1280);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Usuario";
  const displayRole = profile?.role_id === 'r003' ? 'Administrador' : (profile?.role_id === 'r002' ? 'Docente' : 'Estudiante');

  const leftMargin = isDesktop ? "18rem" : "0";

  return (
    <header 
      className="h-20 xl:h-32 fixed top-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 z-40 transition-all duration-300 flex items-center justify-between px-6 xl:px-12 shadow-sm"
      style={{ left: leftMargin }}
    >
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="xl:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
          <Menu size={28} />
        </button>
        <div className="flex flex-col justify-center">
          <span className="hidden xl:block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Módulo Activo</span>
          <h2 className="text-lg md:text-xl xl:text-5xl font-black text-gray-900 uppercase tracking-tighter truncate leading-none">
            {title || "Panel Principal"}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4 xl:gap-10">
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2 xl:p-4 rounded-2xl transition-all duration-300 group ${showNotifications ? "bg-blue-50 text-[#003366]" : "hover:bg-gray-100 text-gray-500"}`}>
            <Bell size={24} className="xl:w-9 xl:h-9 transition-transform group-hover:scale-110" />
            <span className="absolute top-2 right-2 xl:top-4 xl:right-4 w-2 h-2 xl:w-3 xl:h-3 bg-[#CC0000] rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute top-16 xl:top-32 right-[-60px] md:right-0 w-[320px] xl:w-[480px] z-50 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-white rounded-2xl xl:rounded-[2rem] shadow-2xl ring-1 ring-black/5 overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm flex justify-between items-center">
                  <h3 className="font-black text-lg xl:text-xl text-gray-800">Avisos</h3>
                </div>
                <div className="max-h-[400px] xl:max-h-[500px] overflow-y-auto custom-scrollbar bg-white p-2">
                  <NotificationCenter />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-10 xl:h-14 w-px bg-gray-200 hidden md:block"></div>

        <div className="flex items-center gap-3 xl:gap-6 cursor-pointer group p-2 rounded-2xl hover:bg-gray-50 transition-all">
          <div className="text-right hidden md:block">
            <p className="text-sm xl:text-xl font-black text-gray-800 leading-tight">{displayName}</p>
            <p className="text-[10px] xl:text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{displayRole}</p>
          </div>
          <div className="w-10 h-10 xl:w-14 xl:h-14 rounded-full bg-gradient-to-br from-[#003366] to-blue-600 flex items-center justify-center text-white shadow-xl border-2 xl:border-4 border-white ring-1 ring-gray-200">
            <User size={20} className="xl:w-7 xl:h-7" />
          </div>
        </div>
      </div>
    </header>
  );
}