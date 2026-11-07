import React, { useState } from 'react';
import {
  Film,
  Calendar,
  Clock,
  Accessibility,
  Check,
  AlertCircle,
  AlertTriangle,
  ShoppingCart,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Ticket,
  Copy,
  ArrowRight,
  RefreshCw,
  XCircle,
  Printer,
  ChevronRight,
  Mail,
  User,
  CreditCard,
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { pricingEngine } from '../services/pricingStrategy';
import { ActiveTab, Showtime } from '../types';

interface B2CViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const B2CView: React.FC<B2CViewProps> = ({ onNavigateTab }) => {
  const {
    showtimes,
    selectedShowtime,
    setSelectedShowtimeId,
    activeReservation,
    remainingSeconds,
    isExpiringSoon,
    toggleSeatSelection,
    cancelActiveReservation,
    accessibilityVerification,
    setIsAccessibilityModalOpen,
    confectionery,
    cartConfectionery,
    updateCartConfectionery,
    processCheckout,
    isProcessingPayment,
    idempotencyKey,
    regenerateIdempotencyKey,
    completedOrder,
    resetCheckoutFlow,
    tickets,
    vouchers,
    setIsEmailModalOpen,
    latestEmail,
    currentUser,
  } = useCinema();

  const [activeStep, setActiveStep] = useState<'seats' | 'confectionery' | 'checkout' | 'confirmation'>('seats');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Customer Contact Fields for Checkout & Transactional Email
  const [customerName, setCustomerName] = useState<string>('Carlos Alberto Ramírez');
  const [customerEmail, setCustomerEmail] = useState<string>('cliente@cinemax.com');

  const currentFlowStep = completedOrder ? 'confirmation' : activeStep;

  // Pricing calculation via Strategy Pattern
  const currentPricing = selectedShowtime ? pricingEngine.calculateTicketPrice(selectedShowtime) : null;
  const numTickets = activeReservation.selectedSeatIds.length;
  const ticketsSubtotal = currentPricing ? currentPricing.finalPrice * numTickets : 0;

  // Confectionery subtotal
  const confectionerySubtotal = Object.entries(cartConfectionery).reduce((acc, [itemId, qty]) => {
    const item = confectionery.find((c) => c.id === itemId);
    return acc + (item ? item.price * qty : 0);
  }, 0);

  const totalAmount = ticketsSubtotal + confectionerySubtotal;

  const handleSeatClick = (seatId: string) => {
    setErrorMessage(null);
    const result = toggleSeatSelection(seatId);
    if (!result.success && result.message) {
      setErrorMessage(result.message);
    }
  };

  const handleProceedToConfectionery = () => {
    if (activeReservation.selectedSeatIds.length === 0) {
      setErrorMessage('Selecciona al menos una butaca para continuar (mínimo 1, máximo 6).');
      return;
    }
    setErrorMessage(null);
    setActiveStep('confectionery');
  };

  const handleProceedToCheckout = () => {
    setErrorMessage(null);
    setActiveStep('checkout');
  };

  const handlePay = async (simulateFailure = false) => {
    setErrorMessage(null);
    if (!customerEmail.trim() || !customerName.trim()) {
      setErrorMessage('Ingresa el nombre del titular y el correo electrónico para el envío de los boletos.');
      return;
    }

    const result = await processCheckout(customerEmail.trim(), customerName.trim(), simulateFailure);
    if (!result.success) {
      setErrorMessage(result.error || 'Ocurrió un error en la autorización bancaria.');
    } else {
      setActiveStep('confirmation');
    }
  };

  const handleCopyPayload = (payloadString: string, ticketId: string) => {
    navigator.clipboard.writeText(payloadString);
    setCopiedTicketId(ticketId);
    setTimeout(() => setCopiedTicketId(null), 2500);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // STEP 4: CONFIRMATION & DIGITAL TICKETS (With Corporate Email dispatch)
  if (currentFlowStep === 'confirmation' && completedOrder) {
    const orderTickets = tickets.filter((t) => completedOrder.ticketIds.includes(t.id));
    const orderVoucher = vouchers.find((v) => v.code === completedOrder.voucherCode);

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 mb-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
            Transacción Aprobada • CineMax Entertainment
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-2 mb-1">¡Compra Exitosa! Boletos Confirmados</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Orden <span className="font-mono text-emerald-400 font-bold">{completedOrder.id}</span> procesada con éxito.
            Se han generado {orderTickets.length} boletos digitales individuales con código QR firmado con HMAC-SHA256.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {/* View Corporate Email Dispatch Button (Point 4) */}
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 transition-all text-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Ver Correo de Confirmación (Bandeja de Entrada)</span>
            </button>

            {currentUser.role !== 'customer' && (
              <button
                onClick={() => onNavigateTab('gate')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition-all text-sm"
              >
                <Ticket className="w-4 h-4 text-red-400" />
                <span>Ir al Terminal de Acceso (Portería)</span>
              </button>
            )}

            <button
              onClick={() => {
                resetCheckoutFlow();
                setActiveStep('seats');
              }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition-all text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Nueva Compra</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: Individual Digital Tickets with Unique QR */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-red-500" />
                <span>Boletos Digitales Individuales ({orderTickets.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Cada butaca cuenta con su propio código QR único generado dinámicamente con firma criptográfica HMAC-SHA256.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700">
              Seguridad Anti-Clonación HMAC-SHA256
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderTickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className="bg-[#101726] border border-slate-800 hover:border-red-500/40 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all"
              >
                {/* Ribbon */}
                <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-800">
                      Entrada #{index + 1} • {ticket.seatId}
                    </span>
                    <h4 className="font-bold text-white text-base mt-1 line-clamp-1">{ticket.movieTitle}</h4>
                    <p className="text-xs text-slate-400">{ticket.roomName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400">{ticket.showtimeTime}</span>
                    <p className="text-[11px] text-slate-400">{ticket.showtimeDate}</p>
                  </div>
                </div>

                {/* QR Code and Seat Display */}
                <div className="p-5 flex flex-col items-center text-center bg-gradient-to-b from-slate-900/50 to-slate-950/80">
                  <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 mb-3 relative group">
                    {ticket.qrDataUrl ? (
                      <img
                        src={ticket.qrDataUrl}
                        alt={`QR Boleto ${ticket.seatId}`}
                        className="w-40 h-40 object-contain rounded"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                        Generando código QR...
                      </div>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/80 mb-2">
                    <span className="text-xs text-slate-400">Ubicación / Butaca:</span>
                    <span className="text-base font-extrabold text-white font-mono">{ticket.seatId}</span>
                  </div>

                  <div className="w-full text-left bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 overflow-x-auto">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1">
                      <span>PAYLOAD CRIPTOGRÁFICO</span>
                      <button
                        onClick={() => handleCopyPayload(JSON.stringify(ticket.payload), ticket.id)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 font-sans text-[10px]"
                        title="Copiar JSON del código QR"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedTicketId === ticket.id ? '¡Copiado!' : 'Copiar Payload'}
                      </button>
                    </div>
                    <div className="text-slate-300 truncate">ID: {ticket.id}</div>
                    <div className="truncate text-slate-400">
                      HMAC: <span className="text-amber-400 font-mono">{ticket.payload.signature.slice(0, 22)}...</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Footer */}
                <div className="p-3 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                      ticket.status === 'valid'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {ticket.status === 'valid' ? 'Válido para Acceso' : 'Ya Redimido'}
                  </span>
                  <span className="text-[11px] text-slate-500">CineMax Access Pass</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: Independent Confectionery Voucher */}
        {orderVoucher && (
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-bold">
                      VOUCHER DE CONFITERÍA EXPRESS
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-0.5">Retiro Rápido en Mostrador</h3>
                </div>
              </div>

              <div className="bg-slate-950 px-6 py-3 rounded-2xl border border-amber-500/50 flex flex-col items-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Código de Reclamo
                </span>
                <span className="text-3xl font-black font-mono text-amber-400 tracking-wider">
                  {orderVoucher.code}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Productos Adquiridos:
                </h5>
                <ul className="space-y-2">
                  {orderVoucher.items.map((prod, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-sm"
                    >
                      <div className="flex items-center gap-2 text-white">
                        <span className="w-6 h-6 rounded-full bg-amber-900/60 text-amber-300 text-xs font-bold flex items-center justify-center">
                          {prod.quantity}x
                        </span>
                        <span>{prod.name}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        ${(prod.unitPrice * prod.quantity).toLocaleString('es-CO')} COP
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Prioridad Automática KDS por Horario</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Tu pedido se encuentra sincronizado con la Barra Express para la función de las{' '}
                    <strong className="text-white">{orderVoucher.showtimeTime}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Presenta el código <strong className="text-amber-300 font-mono">{orderVoucher.code}</strong> en el
                    mostrador de confitería express para entrega inmediata.
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Estado de preparación:</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase font-mono ${
                      orderVoucher.status === 'dispatched'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                    }`}
                  >
                    {orderVoucher.status === 'dispatched' ? 'Despachado / Entregado' : 'Listo para Reclamar'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // STANDARD PURCHASE STEPS (1: Seats, 2: Confectionery, 3: Checkout)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Steps Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-[#0f172a] p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveStep('seats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeStep === 'seats'
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px]">1</span>
            <span>1. Selección de Butacas</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-600" />

          <button
            onClick={() => activeReservation.selectedSeatIds.length > 0 && setActiveStep('confectionery')}
            disabled={activeReservation.selectedSeatIds.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeStep === 'confectionery'
                ? 'bg-red-600 text-white'
                : activeReservation.selectedSeatIds.length > 0
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px]">2</span>
            <span>2. Confitería Gourmet</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-600" />

          <button
            onClick={() => activeReservation.selectedSeatIds.length > 0 && setActiveStep('checkout')}
            disabled={activeReservation.selectedSeatIds.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeStep === 'checkout'
                ? 'bg-red-600 text-white'
                : activeReservation.selectedSeatIds.length > 0
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px]">3</span>
            <span>3. Pago &amp; Confirmación</span>
          </button>
        </div>

        {/* Active Reservation Timer Banner */}
        {activeReservation.selectedSeatIds.length > 0 && (
          <div
            className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              isExpiringSoon
                ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse'
                : 'bg-amber-950/60 border-amber-500/60 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Tiempo de retención:</span>
              <span className="font-bold text-sm tracking-wider">{formatTimer(remainingSeconds)}</span>
            </div>
            <button
              onClick={cancelActiveReservation}
              className="text-xs bg-red-950/90 hover:bg-red-900 text-red-300 hover:text-white px-2 py-0.5 rounded border border-red-800 flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Liberar Butacas</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-4 bg-red-950/80 border border-red-500/60 text-red-200 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: BILLBOARD & SEAT SELECTION */}
      {activeStep === 'seats' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Billboard / Movie Selection (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                <Film className="w-5 h-5 text-red-500" />
                <span>Cartelera Oficial CineMax</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Elige la función de tu preferencia. Las funciones antes del mediodía aplican automáticamente la{' '}
                <strong className="text-amber-400">Tarifa Matinal (-20% de descuento)</strong>.
              </p>

              <div className="space-y-3">
                {showtimes.map((st) => {
                  const isSelected = selectedShowtime?.id === st.id;
                  const isMatinal = st.hour24 < 12;

                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedShowtimeId(st.id)}
                      className={`cursor-pointer rounded-2xl p-3 border transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-red-950/60 to-slate-900 border-red-500 shadow-md ring-1 ring-red-500/40'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={st.posterUrl}
                          alt={st.movieTitle}
                          className="w-14 h-20 object-cover rounded-xl shrink-0 shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                              {st.classification}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{st.genre}</span>
                          </div>

                          <h4 className="font-bold text-white text-sm mt-1 truncate">{st.movieTitle}</h4>
                          <p className="text-xs text-slate-400">{st.roomName}</p>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded">
                                {st.time}
                              </span>
                              {isMatinal ? (
                                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.5 rounded">
                                  Matinal -20%
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                                  Estándar
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold font-mono text-emerald-400">
                              ${isMatinal ? (st.basePrice * 0.8).toLocaleString('es-CO') : st.basePrice.toLocaleString('es-CO')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategy Pattern Technical Badge */}
            {currentPricing && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Tarificación Dinámica Aplicada</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 py-1 border-b border-slate-800">
                  <span>Modalidad de tarifa:</span>
                  <span className="font-mono font-bold text-white">{currentPricing.strategyName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 py-1 border-b border-slate-800">
                  <span>Precio base regular:</span>
                  <span className="font-mono">${currentPricing.basePrice.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 py-1">
                  <span>Beneficio horario:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    -{currentPricing.discountPercentage}% (${currentPricing.discount.toLocaleString('es-CO')} COP)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Seat Matrix Grid (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {selectedShowtime ? (
              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                {/* Screen Visual */}
                <div className="mb-8 text-center">
                  <div className="relative mx-auto w-3/4 max-w-md h-3 bg-gradient-to-r from-red-600/40 via-red-500 to-red-600/40 rounded-full shadow-lg shadow-red-500/20 mb-1"></div>
                  <span className="text-[11px] uppercase tracking-widest font-mono text-slate-400">
                    PANTALLA CINEMAX CURVED EXPERIENCE
                  </span>
                </div>

                {/* ACCESSIBILITY VERIFICATION STATUS PILL (Point 3) */}
                <div className="mb-6 bg-slate-950/80 border border-blue-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Accessibility className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Espacios Preferenciales de Movilidad Reducida</span>
                        {accessibilityVerification?.isVerified && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.2 rounded font-mono border border-emerald-800">
                            RUD Aprobado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {accessibilityVerification?.isVerified
                          ? `Certificación validada para ${accessibilityVerification.holderName} (${accessibilityVerification.rudNumber})`
                          : 'Las butacas azules requieren verificación oficial mediante Registro Único de Discapacidad (RUD) o carné médico.'}
                      </p>
                    </div>
                  </div>

                  {!accessibilityVerification?.isVerified && (
                    <button
                      type="button"
                      onClick={() => setIsAccessibilityModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors shadow shrink-0"
                    >
                      Verificar Accesibilidad
                    </button>
                  )}
                </div>

                {/* Seat Matrix Grid */}
                <div className="flex flex-col items-center gap-2 mb-6 overflow-x-auto py-2">
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((rowLetter) => (
                    <div key={rowLetter} className="flex items-center gap-2">
                      <span className="w-6 text-center font-mono text-xs font-bold text-slate-500">{rowLetter}</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((colNum) => {
                          const seatId = `${rowLetter}${colNum}`;
                          const seat = selectedShowtime.seats[seatId];
                          if (!seat) return null;

                          const isSelectedByMe = activeReservation.selectedSeatIds.includes(seatId);
                          const isSold = seat.status === 'sold';
                          const isLockedByOther = seat.status === 'reserved' && !isSelectedByMe;
                          const isAccessible = seat.isAccessible;

                          let seatClasses =
                            'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center font-mono text-[10px] font-bold transition-all duration-150 border ';

                          if (isSelectedByMe) {
                            seatClasses +=
                              'bg-red-600 text-white border-red-400 ring-2 ring-red-400/50 shadow-lg shadow-red-600/30 scale-105';
                          } else if (isSold) {
                            seatClasses +=
                              'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50';
                          } else if (isLockedByOther) {
                            seatClasses +=
                              'bg-amber-950/70 text-amber-300 border-amber-800/80 cursor-not-allowed animate-pulse';
                          } else if (isAccessible) {
                            seatClasses +=
                              'bg-blue-950/50 text-blue-300 border-blue-700 hover:bg-blue-900/60 hover:border-blue-400 cursor-pointer';
                          } else {
                            seatClasses +=
                              'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-500 cursor-pointer';
                          }

                          return (
                            <button
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              disabled={isSold || isLockedByOther}
                              className={seatClasses}
                              title={`Butaca ${seatId} - ${
                                isSold
                                  ? 'Vendida'
                                  : isLockedByOther
                                  ? 'En proceso de compra'
                                  : isSelectedByMe
                                  ? 'Tu Selección'
                                  : isAccessible
                                  ? 'Accesible (Requiere Verificación RUD)'
                                  : 'Disponible'
                              }`}
                            >
                              {isAccessible ? (
                                <Accessibility className="w-3.5 h-3.5 mb-0.5" />
                              ) : (
                                <span>{seatId}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-6 text-center font-mono text-xs font-bold text-slate-500">{rowLetter}</span>
                    </div>
                  ))}
                </div>

                {/* Seat Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-lg bg-slate-800 border border-slate-700"></div>
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-lg bg-red-600 border border-red-400"></div>
                    <span>Tu Selección</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-lg bg-blue-950 border border-blue-700 flex items-center justify-center">
                      <Accessibility className="w-2.5 h-2.5 text-blue-300" />
                    </div>
                    <span>Accesibilidad (RUD)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-lg bg-amber-950 border border-amber-800"></div>
                    <span>Retenida</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-lg bg-slate-800/40 border border-slate-800 opacity-50"></div>
                    <span>Ocupada</span>
                  </div>
                </div>

                {/* Selection Bar & Action */}
                <div className="mt-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Butacas seleccionadas:</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {activeReservation.selectedSeatIds.length > 0
                          ? activeReservation.selectedSeatIds.join(', ')
                          : 'Ninguna'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        ({activeReservation.selectedSeatIds.length}/6 boletos máx)
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Subtotal entradas:{' '}
                      <span className="text-emerald-400 font-mono font-bold text-sm">
                        ${ticketsSubtotal.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToConfectionery}
                    disabled={activeReservation.selectedSeatIds.length === 0}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      activeReservation.selectedSeatIds.length > 0
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Continuar a Confitería</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Selecciona una película en cartelera para visualizar el mapa de la sala.
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: CONFECTIONERY CATALOG */}
      {activeStep === 'confectionery' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-500" />
                  <span>Confitería &amp; Combos Cinema Gourmet</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Agrega alimentos a tu orden. Se generará un voucher independiente para retiro express en barra.
                </p>
              </div>

              <div className="bg-amber-950/60 border border-amber-800/80 px-3 py-1.5 rounded-xl text-[11px] text-amber-300 font-medium">
                Retiro Express con Código Alfanumérico
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {confectionery.map((item) => {
                const count = cartConfectionery[item.id] || 0;
                const isOutOfStock = item.stock <= 0;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center hover:border-slate-700 transition-all"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover shadow-md shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm line-clamp-1">{item.name}</h4>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          ${item.price.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Stock disp: <strong className="text-slate-300">{item.stock}</strong>
                        </span>

                        {isOutOfStock ? (
                          <span className="text-[11px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded">
                            Agotado
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                            <button
                              onClick={() => updateCartConfectionery(item.id, -1)}
                              disabled={count === 0}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-mono font-bold text-white">{count}</span>
                            <button
                              onClick={() => updateCartConfectionery(item.id, 1)}
                              disabled={count >= item.stock}
                              className="w-6 h-6 rounded bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setActiveStep('seats')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ← Volver a Butacas
              </button>

              <button
                onClick={handleProceedToCheckout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-red-600/30 transition-all"
              >
                <span>Ir al Checkout y Pago</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CONSOLIDATED CHECKOUT */}
      {activeStep === 'checkout' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-red-500" />
              <span>Resumen de Compra &amp; Pago Seguro</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Verifica los datos de la orden y especifica el correo donde recibirás las boletas electrónicas.
            </p>

            {/* Customer Contact Information (For Transactional Email Dispatch) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 space-y-3">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Datos para Despacho de Boletos Electrónicos (Correo Transaccional):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Carlos Alberto Ramírez"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="cliente@cinemax.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Showtime Summary */}
            {selectedShowtime && currentPricing && (
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 mb-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-base">{selectedShowtime.movieTitle}</h4>
                    <p className="text-xs text-slate-400">
                      {selectedShowtime.roomName} • {selectedShowtime.date} - {selectedShowtime.time}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800">
                    {currentPricing.tag}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-300">
                  <span>Butacas ({activeReservation.selectedSeatIds.join(', ')}):</span>
                  <span className="font-mono font-semibold">
                    {numTickets} × ${currentPricing.finalPrice.toLocaleString('es-CO')} ={' '}
                    <strong className="text-white">${ticketsSubtotal.toLocaleString('es-CO')} COP</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Confectionery Summary */}
            {Object.keys(cartConfectionery).length > 0 && (
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 mb-4">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Confitería Seleccionada:
                </h5>
                <ul className="space-y-1.5 text-xs">
                  {Object.entries(cartConfectionery).map(([itemId, qty]) => {
                    const item = confectionery.find((c) => c.id === itemId);
                    if (!item || qty === 0) return null;
                    return (
                      <li key={itemId} className="flex justify-between text-slate-300">
                        <span>
                          {qty}x {item.name}
                        </span>
                        <span className="font-mono">${(item.price * qty).toLocaleString('es-CO')} COP</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between text-xs text-slate-300">
                  <span>Subtotal Confitería:</span>
                  <span className="font-mono font-bold text-white">
                    ${confectionerySubtotal.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-4 rounded-2xl border border-red-500/30 flex justify-between items-center mb-6">
              <div>
                <span className="text-xs text-slate-400">Total a Autorizar (COP):</span>
                <h2 className="text-2xl font-extrabold text-white font-mono">
                  ${totalAmount.toLocaleString('es-CO')} COP
                </h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800">
                0% Comisión Adicional
              </span>
            </div>

            {/* Payment Execution */}
            <div className="space-y-3">
              <button
                onClick={() => handlePay(false)}
                disabled={isProcessingPayment}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-600/30 transition-all text-sm disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Conectando con pasarela segura...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pagar ${totalAmount.toLocaleString('es-CO')} COP y Emitir Boletos</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handlePay(true)}
                disabled={isProcessingPayment}
                className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-semibold py-2.5 rounded-2xl border border-red-900/40 transition-all text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Simular Pago Rechazado (Verificar Inventario Intacto)</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between">
              <button
                onClick={() => setActiveStep('confectionery')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Volver a Confitería
              </button>
              <button onClick={cancelActiveReservation} className="text-xs text-red-400 hover:text-red-300">
                Cancelar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
