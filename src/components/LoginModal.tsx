import React, { useState } from 'react';
import {
  Lock,
  X,
  Shield,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Sparkles,
  Film,
  QrCode,
  UtensilsCrossed,
} from 'lucide-react';
import { UserSession } from '../types';
import { CORPORATE_USERS } from '../services/mockDatabaseService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [selectedEmail, setSelectedEmail] = useState<string>('admin@cinemax.com');
  const [password, setPassword] = useState<string>('cinemax2026');

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = CORPORATE_USERS.find((u) => u.email.toLowerCase() === selectedEmail.toLowerCase());
    if (found) {
      onLogin(found);
      onClose();
    } else {
      // Create guest or standard admin
      onLogin({
        id: 'USR-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        email: selectedEmail,
        fullName: 'Funcionario CineMax',
        role: 'admin',
        employeeBadgeId: 'EMP-GEN-501',
      });
      onClose();
    }
  };

  const handleQuickRole = (user: UserSession) => {
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-900/40">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-white">
                  Cine<span className="text-red-500">Max</span>
                </span>
                <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold border border-red-800">
                  STAFF PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Acceso Corporativo para Empleados y Operaciones</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Role Selection (Preloaded Credentials for 1-Click Testing) */}
        <div className="p-6 space-y-5">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              Acceso Rápido por Rol Operativo:
            </span>

            <div className="space-y-2">
              {CORPORATE_USERS.map((user) => {
                let roleColor = 'border-purple-800/80 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50';
                let roleIcon = <Film className="w-4 h-4 text-purple-400 shrink-0" />;
                let roleBadge = 'Administración';

                if (user.role === 'gatekeeper') {
                  roleColor = 'border-emerald-800/80 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/50';
                  roleIcon = <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />;
                  roleBadge = 'Portería & Accesos';
                } else if (user.role === 'confectionery') {
                  roleColor = 'border-amber-800/80 bg-amber-950/40 text-amber-200 hover:bg-amber-900/50';
                  roleIcon = <UtensilsCrossed className="w-4 h-4 text-amber-400 shrink-0" />;
                  roleBadge = 'Barra Express KDS';
                }

                return (
                  <button
                    key={user.id}
                    onClick={() => handleQuickRole(user)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all group ${roleColor}`}
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      {roleIcon}
                      <div>
                        <div className="font-bold text-white group-hover:text-amber-200 transition-colors">
                          {user.email}
                        </div>
                        <div className="text-[11px] text-slate-400">{user.fullName}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-950/70 border border-slate-700">
                      {roleBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-[#0f172a] px-3 text-[10px] uppercase font-mono text-slate-500">
              o ingresa credenciales
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleManualLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Correo Corporativo:</label>
              <input
                type="email"
                required
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                placeholder="empleado@cinemax.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña de Acceso:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all mt-2"
            >
              <span>Iniciar Sesión en el Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
