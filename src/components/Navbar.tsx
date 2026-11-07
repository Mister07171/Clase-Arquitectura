import React from 'react';
import {
  Film,
  QrCode,
  UtensilsCrossed,
  BarChart3,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Wifi,
  WifiOff,
  User,
  LogOut,
  Mail,
  Lock,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useCinema } from '../context/CinemaContext';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    activeReservation,
    remainingSeconds,
    isExpiringSoon,
    cancelActiveReservation,
    demoFastTimer,
    setDemoFastTimer,
    offlineMode,
    currentUser,
    logout,
    setIsLoginModalOpen,
    latestEmail,
    setIsEmailModalOpen,
  } = useCinema();

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isStaff = currentUser.role !== 'customer';

  // Dynamic Navigation items based on authenticated role
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'b2c',
      label: 'Cartelera & Boletos',
      icon: <Film className="w-4 h-4" />,
      badge:
        activeReservation.selectedSeatIds.length > 0
          ? `${activeReservation.selectedSeatIds.length} Sillas`
          : undefined,
    },
  ];

  // If employee or admin, add operational views
  if (isStaff) {
    if (currentUser.role === 'admin' || currentUser.role === 'gatekeeper') {
      navItems.push({
        id: 'gate',
        label: 'Terminal de Accesos',
        icon: <QrCode className="w-4 h-4" />,
      });
    }

    if (currentUser.role === 'admin' || currentUser.role === 'confectionery') {
      navItems.push({
        id: 'kds',
        label: 'Barra Express KDS',
        icon: <UtensilsCrossed className="w-4 h-4" />,
      });
    }

    if (currentUser.role === 'admin') {
      navItems.push({
        id: 'admin',
        label: 'Gestión Corporativa',
        icon: <BarChart3 className="w-4 h-4" />,
      });
    }

    navItems.push({
      id: 'architecture',
      label: 'Auditoría & Métricas',
      icon: <ShieldCheck className="w-4 h-4" />,
    });
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Top Corporate Status Ribbon */}
      <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 px-4 py-1 text-xs text-slate-300 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-red-500 tracking-wider uppercase text-[11px]">
            CineMax Entertainment Group
          </span>
          <span className="text-slate-600">•</span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">Sistema Centralizado de Operaciones</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
            Criptografía HMAC-SHA256 &bull; Concurrencia 0.00%
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Demo Fast Timer */}
          <div className="flex items-center gap-1.5 text-[11px] bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
            <span className="text-slate-400">Temporizador de Retención:</span>
            <button
              onClick={() => setDemoFastTimer(!demoFastTimer)}
              className={`px-1.5 py-0.5 rounded font-mono font-medium text-[10px] transition-colors ${
                demoFastTimer
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Alternar entre 10 minutos estándar o 1 minuto rápido para demostración de expiración"
            >
              {demoFastTimer ? '1 min (Rápido)' : '10 min (Estándar)'}
            </button>
          </div>

          {/* Network status */}
          <div className="flex items-center gap-1 text-[11px]">
            {offlineMode ? (
              <span className="flex items-center gap-1 text-amber-400 font-medium bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
                Caché Offline
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
                <Wifi className="w-3 h-3 text-emerald-400" />
                En Línea
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Corporate Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('b2c')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-900/30">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                  Cine<span className="text-red-500">Max</span>
                </span>
                <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded font-mono border border-red-800/50">
                  ENTERTAINMENT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Plataforma Oficial de Cinema</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 ring-1 ring-red-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions: Timer + Customer Email Shortcut + Employee RBAC */}
          <div className="flex items-center gap-2.5">
            {/* Active Reservation Timer Widget */}
            {activeReservation.selectedSeatIds.length > 0 && remainingSeconds > 0 && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  isExpiringSoon
                    ? 'bg-red-950/80 border-red-500 text-red-200 ring-2 ring-red-500/50 animate-pulse'
                    : 'bg-amber-950/60 border-amber-500/70 text-amber-200'
                }`}
                title="Tiempo restante para completar tu compra"
              >
                {isExpiringSoon ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-400" />
                )}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider font-sans font-bold leading-none text-slate-400">
                    {isExpiringSoon ? '¡Por vencer!' : 'Retención activa'}
                  </span>
                  <span className="font-bold text-sm leading-none mt-0.5">
                    {formatTimer(remainingSeconds)}
                  </span>
                </div>
                <button
                  onClick={cancelActiveReservation}
                  className="p-1 hover:bg-slate-800/80 rounded text-slate-400 hover:text-red-400 ml-1 transition-colors"
                  title="Liberar butacas inmediatamente"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Email Inbox Button (If an order was made) */}
            {latestEmail && (
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                title="Abrir correo transaccional de confirmación"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Mi Correo</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </button>
            )}

            {/* RBAC Employee Access / Logout Controls */}
            {isStaff ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-[11px] font-bold text-white truncate max-w-[130px]">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[9px] font-mono text-amber-400 uppercase">
                      {currentUser.role} • {currentUser.employeeBadgeId}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setActiveTab('b2c');
                  }}
                  className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors ml-1"
                  title="Cerrar sesión de empleado"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-red-900/30 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Acceso Empleados</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
