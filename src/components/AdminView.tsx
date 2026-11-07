import React, { useState } from 'react';
import {
  BarChart3,
  Film,
  Plus,
  Edit2,
  TrendingUp,
  Users,
  CheckCircle2,
  Ticket,
  Package,
  Layers,
  Sparkles,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { Showtime } from '../types';

export const AdminView: React.FC = () => {
  const {
    showtimes,
    createShowtime,
    updateShowtimeBasePrice,
    tickets,
    confectionery,
    updateConfectioneryStock,
  } = useCinema();

  const [isCreatingShowtime, setIsCreatingShowtime] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newRoom, setNewRoom] = useState<string>('Sala 1 IMAX Láser');
  const [newDate, setNewDate] = useState<string>('Hoy, 24 Octubre');
  const [newTime, setNewTime] = useState<string>('11:00 AM');
  const [newGenre, setNewGenre] = useState<string>('Acción / Aventura');
  const [newBasePrice, setNewBasePrice] = useState<number>(20000);
  const [newClassification, setNewClassification] = useState<string>('+12');
  const [newPosterUrl, setNewPosterUrl] = useState<string>(
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'
  );

  const handleCreateShowtime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Convert time string to hour24 roughly
    const isPM = newTime.toLowerCase().includes('pm');
    const timeMatch = newTime.match(/(\d+):?(\d*)/);
    let hour = timeMatch ? parseInt(timeMatch[1], 10) : 12;
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    createShowtime({
      movieId: 'MOV-' + Math.floor(100 + Math.random() * 900),
      movieTitle: newTitle.trim(),
      posterUrl: newPosterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
      roomName: newRoom,
      roomCapacity: 48,
      date: newDate,
      time: newTime,
      hour24: hour,
      genre: newGenre,
      duration: '135 min',
      classification: newClassification,
      basePrice: newBasePrice,
    });

    setIsCreatingShowtime(false);
    setNewTitle('');
  };

  // Metrics calculation per showtime (RF-20)
  const showtimeMetrics = showtimes.map((st) => {
    const totalSeats = Object.keys(st.seats).length;
    // Count seats with status 'sold'
    const soldSeatsCount = Object.values(st.seats).filter((s) => s.status === 'sold').length;

    // Count tickets for this showtime that have status 'used' (validated at gatekeeper)
    const showtimeTickets = tickets.filter((t) => t.showtimeId === st.id);
    const validatedIngresos = showtimeTickets.filter((t) => t.status === 'used').length;

    // Occupancy rate
    const occupancyRate = totalSeats > 0 ? Math.round((soldSeatsCount / totalSeats) * 100) : 0;
    const admissionRate = soldSeatsCount > 0 ? Math.round((validatedIngresos / soldSeatsCount) * 100) : 0;

    return {
      showtime: st,
      totalSeats,
      soldSeatsCount,
      validatedIngresos,
      occupancyRate,
      admissionRate,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded border border-purple-800">
              Dirección de Operaciones &amp; Salas
            </span>
            <span className="text-xs font-mono text-slate-400">Panel Ejecutivo CineMax</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Supervisión en Tiempo Real &amp; Catálogos</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Monitoreo de ocupación (Boletos Vendidos vs. Ingresos Validados en Portería), configuración de cartelera y
            control de inventario de confitería.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingShowtime(!isCreatingShowtime)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreatingShowtime ? 'Cerrar Formulario' : 'Crear Nueva Función'}</span>
        </button>
      </div>

      {/* NEW SHOWTIME MODAL / COLLAPSIBLE FORM (RF-18) */}
      {isCreatingShowtime && (
        <div className="bg-slate-900 border-2 border-purple-500/60 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-300 mb-1">
            <Film className="w-4 h-4 text-purple-400" />
            <span>Configuración de Nueva Función en Cartelera</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Al registrar la función, aparecerá inmediatamente en el portal B2C con su motor de tarifas desacoplado.
          </p>

          <form onSubmit={handleCreateShowtime} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Título de Película:</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Gladiator II"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sala Asignada:</label>
              <select
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Sala 1 IMAX Láser">Sala 1 IMAX Láser (48 Butacas)</option>
                <option value="Sala 2 MacroXE Dolby Atmos">Sala 2 MacroXE Dolby Atmos (48 Butacas)</option>
                <option value="Sala 3 RealD 3D">Sala 3 RealD 3D (48 Butacas)</option>
                <option value="Sala VIP Premier">Sala VIP Premier (48 Butacas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Horario (ej. 10:45 AM o 04:30 PM):
              </label>
              <input
                type="text"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="10:45 AM (aplica Matinal -20%)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tarifa Base ($ COP):</label>
              <input
                type="number"
                min="1000"
                step="500"
                value={newBasePrice}
                onChange={(e) => setNewBasePrice(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Género / Clasificación:</label>
              <input
                type="text"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                placeholder="Ciencia Ficción"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                Guardar Función
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingShowtime(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 1: SUPERVISOR OCUPACIÓN EN TIEMPO REAL (RF-20) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                Métrica Central de Ocupación &amp; Accesos
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Boletos Vendidos frente a Ingresos Validados en Portería
            </h3>
            <p className="text-xs text-slate-400">
              Contraste en tiempo real: ¿Cuántas butacas se han comercializado vs. cuántos espectadores han ingresado a
              la sala?
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
              Boletos Vendidos
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
              Ingresos Validados (Portería)
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showtimeMetrics.map(({ showtime, totalSeats, soldSeatsCount, validatedIngresos, occupancyRate, admissionRate }) => (
            <div
              key={showtime.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-white text-sm line-clamp-1">{showtime.movieTitle}</h4>
                    <p className="text-xs text-slate-400">
                      {showtime.roomName} • <strong className="text-white">{showtime.time}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded shrink-0">
                    Capacidad: {totalSeats}
                  </span>
                </div>

                {/* Key Numbers Comparison (RF-20 Requirement test: "Tras vender 4 y escanear 2, muestra 4 vendidos y 2 ingresos") */}
                <div className="grid grid-cols-2 gap-3 my-4 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                  <div className="text-center border-r border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block">Boletos Vendidos</span>
                    <span className="text-2xl font-black text-white font-mono">{soldSeatsCount}</span>
                    <span className="text-[10px] text-slate-500 block">de {totalSeats} butacas</span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Ingresos en Portería</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{validatedIngresos}</span>
                    <span className="text-[10px] text-slate-500 block">validados con QR</span>
                  </div>
                </div>

                {/* Comparative Progress Bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Ocupación Comercial:</span>
                      <span className="font-mono text-blue-400 font-bold">{occupancyRate}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${occupancyRate}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Tasa de Asistencia en Sala:</span>
                      <span className="font-mono text-emerald-400 font-bold">{admissionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${admissionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price adjustment quick tool */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Tarifa Base:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-white">${showtime.basePrice.toLocaleString('es-CO')}</span>
                  <button
                    onClick={() => {
                      const p = prompt('Ingresa nuevo precio base en COP:', showtime.basePrice.toString());
                      if (p && !isNaN(Number(p))) updateShowtimeBasePrice(showtime.id, Number(p));
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Editar tarifa base"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: GESTIÓN DE CATÁLOGO & INVENTARIO DE CONFITERÍA (RF-19) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-800">
              Control de Inventario &amp; Stock
            </span>
            <h3 className="text-lg font-bold text-white mt-1">Inventario de Combos y Materias Primas</h3>
            <p className="text-xs text-slate-400">
              Ajusta existencias disponibles en barra express. Los pedidos B2C descuentan este inventario al pagar.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Combo / Producto</th>
                <th className="p-3">Precio Venta</th>
                <th className="p-3">Stock Actual</th>
                <th className="p-3 text-right">Acciones de Reabastecimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {confectionery.map((item) => (
                <tr key={item.id} className="hover:bg-slate-950/50">
                  <td className="p-3 font-mono text-slate-400">{item.id}</td>
                  <td className="p-3">
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{item.description}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    ${item.price.toLocaleString('es-CO')} COP
                  </td>
                  <td className="p-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        item.stock > 10
                          ? 'bg-slate-800 text-slate-200'
                          : item.stock > 0
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {item.stock} unidades
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <button
                      onClick={() => updateConfectioneryStock(item.id, item.stock + 10)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs font-medium"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => updateConfectioneryStock(item.id, item.stock + 50)}
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-2.5 py-1 rounded text-xs font-bold"
                    >
                      +50 Reabastecer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
