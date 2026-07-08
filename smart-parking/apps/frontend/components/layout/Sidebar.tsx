'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/env';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

function getMenuItems(role: UserRole): MenuItem[] {
  if (role === 'ADMIN') {
    return [
      { icon: LayoutDashboard, label: 'Panel Principal', path: '/admin' },
      { icon: MapIcon, label: 'Gestión Espacios', path: '/admin/slots' },
      { icon: FileText, label: 'Reportes', path: '/admin/reports' },
    ];
  }

  return [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/user' },
    { icon: History, label: 'Mis Reservas', path: '/user/reservations' },
    { icon: Settings, label: 'Settings', path: '/user/settings' },
  ];
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'PROFESSOR':
      return 'Docente';
    case 'GUEST':
      return 'Invitado';
    default:
      return 'Estudiante';
  }
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const menuItems = getMenuItems(user.role);
  const displayName = user.email.split('@')[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[10001] rounded-xl bg-[#003366] p-2 text-white shadow-xl xl:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm xl:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-[10000] h-full w-72 transform border-r border-white/5 bg-[#003366] text-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } xl:translate-x-0`}
      >
        <div className="relative flex h-24 items-center overflow-hidden border-b border-white/10 px-8">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            {isAdmin ? <Settings size={80} /> : <Car size={80} />}
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 shadow-lg">
              {isAdmin ? (
                <Settings className="text-[#003366]" size={24} />
              ) : (
                <Car className="text-[#003366]" size={24} />
              )}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter italic">
                UCE PARKING
              </h1>
              <p className="text-[10px] font-medium tracking-widest text-blue-200 uppercase">
                {isAdmin ? 'ADMINISTRACIÓN' : 'SISTEMA INTELIGENTE'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner">
            <div className="rounded-full bg-blue-500/20 p-2">
              <User size={20} className="text-blue-200" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold">{displayName}</p>
              <p className="text-[10px] font-bold tracking-wider text-blue-200 uppercase">
                {getRoleLabel(user.role)}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path !== '/user' &&
                item.path !== '/admin' &&
                pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 transition-all ${
                  isActive
                    ? 'translate-x-1 bg-white font-bold text-[#003366] shadow-lg'
                    : 'text-blue-100 hover:translate-x-1 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="text-sm tracking-wide">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} className="text-[#CC0000]" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full space-y-2 bg-gradient-to-t from-[#002244] to-transparent p-6">
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold text-red-200 transition-colors hover:bg-red-500/10 hover:text-white"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
