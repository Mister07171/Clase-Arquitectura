import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  PackageCheck,
  Flame,
  Check,
  Film,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { ConfectioneryVoucher } from '../types';

export const KdsView: React.FC = () => {
  const { vouchers, dispatchVoucher, showtimes } = useCinema();

  const [inputCode, setInputCode] = useState<string>('');
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    message: string;
    voucher?: ConfectioneryVoucher;
  } | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'dispatched'>('all');

  // Find showtime hour for each voucher to sort automatically by proximity (RF-12)
  const sortedVouchers = [...vouchers].sort((a, b) => {
    // If pending vs dispatched, pending comes first
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }

    const showtimeA = showtimes.find((st) => st.id === a.showtimeId);
    const showtimeB = showtimes.find((st) => st.id === b.showtimeId);

    const hourA = showtimeA ? showtimeA.hour24 : 12;
    const hourB = showtimeB ? showtimeB.hour24 : 12;

    return hourA - hourB;
  });

  const filteredVouchers = sortedVouchers.filter((v) => {
    if (filter === 'all') return true;
    return v.status === filter;
  });

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const result = dispatchVoucher(inputCode.trim());
    setDispatchResult(result);
  };

  const handleCardClick = (code: string) => {
    setInputCode(code);
    const result = dispatchVoucher(code);
    setDispatchResult(result);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-800">
              Barra Express Cinema Gourmet
            </span>
            <span className="text-xs font-mono text-slate-400">KDS (Kitchen Display System)</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Pantalla de Despacho de Confitería</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Cola de pedidos priorizados en tiempo real por cercanía horaria de la función. Validación de vouchers y
            prevención estricta de doble entrega.
          </p>
        </div>

        {/* Voucher Delivery Input */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shrink-0 w-full md:w-auto">
          <form onSubmit={handleDispatch} className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Ej. CONF-8492"
                className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/20"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Despachar</span>
            </button>
          </form>
        </div>
      </div>

      {/* Dispatch Response Alert Banner */}
      {dispatchResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-semibold ${
            dispatchResult.success
              ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
              : 'bg-red-950/80 border-red-500/80 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {dispatchResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div>
              <span>{dispatchResult.message}</span>
              {dispatchResult.voucher && (
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                  Voucher: {dispatchResult.voucher.code} • {dispatchResult.voucher.movieTitle}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setDispatchResult(null)}
            className="text-slate-400 hover:text-white px-2 py-1 rounded"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filter Tabs & Queue Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filtrar por:</span>
          {(['all', 'pending', 'dispatched'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === mode
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {mode === 'all' ? 'Todos los pedidos' : mode === 'pending' ? 'Pendientes (Cola KDS)' : 'Despachados'}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Priorización Automática por Proximidad de Función</span>
        </div>
      </div>

      {/* Vouchers Queue Grid */}
      {filteredVouchers.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-slate-300">No hay pedidos en la cola actual</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Los pedidos de confitería comprados por los usuarios en el Portal B2C aparecerán aquí ordenados por la
            hora de inicio de la película.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVouchers.map((v, index) => {
            const isPending = v.status === 'pending';

            return (
              <div
                key={v.code}
                className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xl ${
                  isPending
                    ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/50 hover:border-amber-400'
                    : 'bg-slate-950/80 border-slate-800 opacity-70'
                }`}
              >
                {/* Card Top */}
                <div
                  className={`p-4 border-b flex items-start justify-between ${
                    isPending
                      ? 'bg-amber-950/40 border-amber-900/50'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xl text-amber-400">{v.code}</span>
                      {isPending && index === 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                          <Flame className="w-3 h-3" />
                          <span>¡Siguiente!</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mt-1">
                      <Film className="w-3.5 h-3.5 text-slate-400" />
                      <span className="line-clamp-1">{v.movieTitle}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded">
                      {v.showtimeTime}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Función</span>
                  </div>
                </div>

                {/* Items in Voucher */}
                <div className="p-4 flex-1 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Artículos a Entregar:
                  </span>
                  <ul className="space-y-1.5">
                    {v.items.map((prod, pIdx) => (
                      <li
                        key={pIdx}
                        className="flex items-center justify-between text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800"
                      >
                        <div className="flex items-center gap-2 text-white font-medium">
                          <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center">
                            {prod.quantity}
                          </span>
                          <span>{prod.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        isPending
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {isPending ? 'Pendiente por Entregar' : 'Despachado'}
                    </span>
                  </div>

                  {isPending ? (
                    <button
                      onClick={() => handleCardClick(v.code)}
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Entregar Pedido</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">
                      Entregado a las {new Date(v.dispatchedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
