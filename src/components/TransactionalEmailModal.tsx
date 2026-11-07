import React, { useState } from 'react';
import {
  Mail,
  X,
  CheckCircle2,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  Ticket,
  ShoppingCart,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { TransactionalEmail } from '../types';

interface TransactionalEmailModalProps {
  email: TransactionalEmail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionalEmailModal: React.FC<TransactionalEmailModalProps> = ({
  email,
  isOpen,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen || !email) return null;

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        {/* Email Client Header (Simulation of Mail App) */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Bandeja de Entrada del Cliente</span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  Transaccional Entregado
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Para: <strong className="text-slate-200">{email.recipientEmail}</strong> • Asunto:{' '}
                <span className="text-white font-medium">{email.subject}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Imprimir correo"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Email Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/60">
          {/* Corporate Cinema Email Template Container */}
          <div className="max-w-2xl mx-auto bg-[#101726] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Email Banner */}
            <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950/60 p-6 border-b border-slate-800 text-center relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm">
                  CM
                </div>
                <span className="text-2xl font-black text-white tracking-tight">
                  Cine<span className="text-red-500">Max</span>
                </span>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                ENTERTAINMENT GROUP • COMPROBANTE OFICIAL
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2">¡Tu Reserva y Boletos Están Confirmados!</h2>
              <p className="text-xs text-slate-300 mt-1">
                Orden <strong className="text-white font-mono">{email.order.id}</strong> • Emitida el{' '}
                {new Date(email.sentAt).toLocaleString('es-CO')}
              </p>
            </div>

            {/* Email Greeting & Showtime Details */}
            <div className="p-6 space-y-6">
              <div className="text-sm text-slate-300">
                Estimado/a <strong className="text-white">{email.recipientName}</strong>, gracias por elegir CineMax.
                A continuación encontrarás tus entradas individuales con código QR de acceso prioritario y el comprobante
                de confitería.
              </div>

              {/* Movie info card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    Función Confirmada
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{email.order.movieTitle}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{email.tickets[0]?.showtimeDate} - {email.tickets[0]?.showtimeTime}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{email.tickets[0]?.roomName}</span>
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800 text-center shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Butacas Reservadas</span>
                  <span className="text-base font-extrabold text-amber-400 font-mono">
                    {email.order.seatIds.join(', ')}
                  </span>
                </div>
              </div>

              {/* INDEPENDENT CONFECTIONERY VOUCHER BANNER (IF IN ORDER) */}
              {email.voucher && (
                <div className="bg-gradient-to-r from-amber-950/60 to-slate-900 border-2 border-amber-500/50 rounded-xl p-5 shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-amber-800/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-800">
                          BARRA EXPRESS • VOUCHER DE ENTREGA
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">Retiro de Confitería en Mostrador</h4>
                      </div>
                    </div>

                    <div className="bg-slate-950 px-4 py-2 rounded-xl border border-amber-500 flex items-center gap-2">
                      <span className="text-2xl font-black font-mono text-amber-400">{email.voucher.code}</span>
                      <button
                        onClick={() => handleCopyVoucher(email.voucher!.code)}
                        className="text-slate-400 hover:text-white p-1 rounded"
                        title="Copiar código de voucher"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs">
                    <span className="text-slate-400 block mb-1 font-semibold">Productos incluidos:</span>
                    <ul className="space-y-1">
                      {email.voucher.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between text-slate-300">
                          <span>
                            {it.quantity}x {it.name}
                          </span>
                          <span className="font-mono text-slate-400">
                            ${(it.unitPrice * it.quantity).toLocaleString('es-CO')} COP
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* INDIVIDUAL DIGITAL TICKETS WITH UNIQUE QR CODES */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-red-500" />
                    <span>Boletos Individuales ({email.tickets.length})</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Firma Criptográfica HMAC-SHA256
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {email.tickets.map((t, idx) => (
                    <div
                      key={t.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center shadow-md relative overflow-hidden"
                    >
                      <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-400 mb-2 pb-1.5 border-b border-slate-800">
                        <span className="font-bold text-amber-400">Boleto #{idx + 1}</span>
                        <span>Asiento {t.seatId}</span>
                      </div>

                      {t.qrDataUrl && (
                        <div className="bg-white p-2 rounded-lg shadow mb-2">
                          <img src={t.qrDataUrl} alt={`QR ${t.seatId}`} className="w-28 h-28 object-contain" />
                        </div>
                      )}

                      <div className="text-xs font-bold text-white">{t.movieTitle}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{t.roomName}</div>

                      <div className="w-full mt-2 pt-2 border-t border-slate-800/80 text-[9px] font-mono text-slate-500 truncate">
                        ID: {t.id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal Boletos ({email.order.seatIds.length} entradas):</span>
                  <span className="font-mono">
                    ${email.order.pricingDetails.subtotalTickets.toLocaleString('es-CO')} COP
                  </span>
                </div>
                {email.order.subtotalConfectionery > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal Confitería:</span>
                    <span className="font-mono">
                      ${email.order.subtotalConfectionery.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-white text-sm">
                  <span>Total Pagado:</span>
                  <span className="font-mono text-emerald-400 text-base">
                    ${email.order.totalAmount.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              {/* Corporate Footer Note */}
              <div className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-800 space-y-1">
                <p>CineMax Entertainment Group S.A.S. • NIT 900.824.110-1</p>
                <p>Presenta este correo o los códigos QR directamente desde tu dispositivo en la portería del cine.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400">¿Deseas guardar una copia física?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
