import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Lock,
  Layers,
  Key,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Terminal,
  Activity,
  Trash2,
  Zap,
  Server,
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { generateHmacSha256 } from '../services/crypto';

export const ArchitectureView: React.FC = () => {
  const { auditLogs, clearAuditLogs, simulateRaceCondition } = useCinema();

  const [raceResult, setRaceResult] = useState<{ winner: string; loser: string; seatId: string } | null>(null);

  // Live HMAC-SHA256 visualizer
  const [testPayloadText, setTestPayloadText] = useState<string>(
    'TKT-104928|SH-01|Interstellar|Sala 1|C4|1730000000'
  );
  const computedHash = generateHmacSha256(testPayloadText);

  const handleSimulateRace = () => {
    const res = simulateRaceCondition();
    setRaceResult(res);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
            CineMax Cloud &amp; Core Engine
          </span>
          <span className="text-xs font-mono text-slate-400">Consola de Infraestructura &amp; Auditoría</span>
        </div>
        <h2 className="text-2xl font-black text-white mt-1">
          Métricas de Integridad, Patrones de Arquitectura &amp; Trazabilidad
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl mt-0.5">
          Monitoreo técnico de los componentes del sistema: Aislamiento transaccional atómico (0.00% Double-Booking),
          motor de tarifas dinámicas polimórfico, criptografía HMAC-SHA256 y registro inmutable de eventos.
        </p>
      </div>

      {/* TOP 3 ARCHITECTURAL PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PILLAR 1: CONCURRENCY & TRANSACTIONAL ISOLATION */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Concurrencia Atómica</h3>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                0.00% Double-Booking
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Cerrojos a nivel de fila y bloqueo transaccional distribuido en milisegundos. Garantiza que dos solicitudes
              concurrentes no puedan reservar la misma butaca.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={handleSimulateRace}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/20"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simular Colisión de Concurrencia</span>
            </button>

            {raceResult && (
              <div className="mt-3 bg-slate-950 p-2.5 rounded-lg border border-blue-500/40 text-[11px] font-mono space-y-1">
                <div className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{raceResult.winner} (Butaca {raceResult.seatId})</span>
                </div>
                <div className="text-red-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{raceResult.loser}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PILLAR 2: DECOUPLED STRATEGY PATTERN */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Tarificación Strategy</h3>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-900">
                Polimorfismo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Arquitectura de cálculo desacoplada del checkout. Permite inyectar estrategias tarifarias:{' '}
              <strong className="text-amber-300">MatinalPricingStrategy (-20%)</strong> para funciones matutinas y{' '}
              <strong className="text-white">StandardPricingStrategy</strong>.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 bg-slate-950 p-2.5 rounded-lg text-[10px] font-mono text-slate-400">
            <span className="text-purple-400">interface</span> PricingStrategy &#123;<br />
            &nbsp;&nbsp;calculate(basePrice, showtime): Result;<br />
            &#125;
          </div>
        </div>

        {/* PILLAR 3: CRYPTOGRAPHIC QR HMAC-SHA256 */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3">
              <Key className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Seguridad HMAC-SHA256</h3>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-900">
                Anti-Falsificación
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Cada código QR emitido incorpora una firma criptográfica con secreto de servidor. Cualquier edición de un
              byte en el número de asiento corrompe el hash e invalida el boleto.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono truncate">
              Firma Hash: <span className="text-emerald-400">{computedHash.slice(0, 20)}...</span>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE HMAC-SHA256 CRYPTO LAB */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-white">Laboratorio Criptográfico de Boletos</h3>
        </div>
        <p className="text-xs text-slate-400">
          Modifica cualquier carácter del payload canónico para observar cómo cambia instantáneamente la firma
          HMAC-SHA256:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">
              Payload Canónico (TicketId | ShowtimeId | Movie | Room | Seat | IssuedAt):
            </label>
            <input
              type="text"
              value={testPayloadText}
              onChange={(e) => setTestPayloadText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">
              Firma Criptográfica HMAC-SHA256 Resultante:
            </label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-300 break-all select-all shadow-inner">
              {computedHash}
            </div>
          </div>
        </div>
      </div>

      {/* IMMUTABLE AUDIT LOG TABLE */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                Auditoría Inmutable del Sistema
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Registro de Transiciones de Estado en Milisegundos</h3>
            <p className="text-xs text-slate-400">
              Traza de eventos operativos (bloqueos, liberaciones, pagos, accesos en portería, KDS y logins).
            </p>
          </div>

          <button
            onClick={clearAuditLogs}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Logs</span>
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 italic">No hay registros de auditoría aún.</div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="p-3">Timestamp (ms)</th>
                  <th className="p-3">Evento</th>
                  <th className="p-3">Usuario / Hilo</th>
                  <th className="p-3">IP Origen</th>
                  <th className="p-3">Función / Silla</th>
                  <th className="p-3">Detalle Operativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {auditLogs.map((log) => {
                  let badgeClasses = 'px-1.5 py-0.5 rounded text-[10px] font-bold ';
                  if (log.eventType === 'TICKET_VALIDATED') {
                    badgeClasses += 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                  } else if (log.eventType === 'TICKET_LOCKED') {
                    badgeClasses += 'bg-amber-950 text-amber-300 border border-amber-800';
                  } else if (log.eventType === 'TICKET_PURCHASED') {
                    badgeClasses += 'bg-blue-950 text-blue-300 border border-blue-800';
                  } else if (log.eventType === 'TICKET_RELEASED') {
                    badgeClasses += 'bg-slate-800 text-slate-300';
                  } else if (log.eventType === 'TICKET_REJECTED') {
                    badgeClasses += 'bg-red-950 text-red-300 border border-red-800';
                  } else {
                    badgeClasses += 'bg-purple-950 text-purple-300 border border-purple-800';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-950/40">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                        .{log.timestamp % 1000}
                      </td>
                      <td className="p-3">
                        <span className={badgeClasses}>{log.eventType}</span>
                      </td>
                      <td className="p-3 text-slate-300 font-bold">{log.userId}</td>
                      <td className="p-3 text-slate-400">{log.ipAddress}</td>
                      <td className="p-3 text-amber-400">
                        {log.showtimeId || '-'} {log.seatId ? `• Butaca ${log.seatId}` : ''}
                      </td>
                      <td className="p-3 text-slate-300 font-sans text-xs max-w-md">{log.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
