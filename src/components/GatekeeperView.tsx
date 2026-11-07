import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Scan,
  RefreshCw,
  Film,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRight,
  Camera,
  CameraOff,
  History,
  Maximize2,
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';

export const GatekeeperView: React.FC = () => {
  const {
    tickets,
    offlineMode,
    setOfflineMode,
    validationResult,
    validateTicketByCodeOrPayload,
    resetValidationResult,
    testScanSuccess,
    testScanDuplicate,
    testScanTampered,
    currentUser,
  } = useCinema();

  const [inputVal, setInputVal] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Camera Stream State (Point 5)
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La API de cámara no es soportada en este navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);

        // BarcodeDetector API check for hardware QR scanning
        if ('BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            scanIntervalRef.current = setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                  const codes = await barcodeDetector.detect(videoRef.current);
                  if (codes && codes.length > 0) {
                    const raw = codes[0].rawValue;
                    if (raw) {
                      validateTicketByCodeOrPayload(raw);
                    }
                  }
                } catch (e) {
                  // ignore frame error
                }
              }
            }, 500);
          } catch (err) {
            console.log('BarcodeDetector not available', err);
          }
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.message || 'No se pudo acceder a la cámara trasera. Asegúrate de otorgar permisos de cámara.'
      );
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setIsValidating(true);
    await validateTicketByCodeOrPayload(inputVal.trim());
    setIsValidating(false);
  };

  const handleSelectRecentTicket = async (ticket: (typeof tickets)[0]) => {
    setIsValidating(true);
    setInputVal(JSON.stringify(ticket.payload));
    await validateTicketByCodeOrPayload(JSON.stringify(ticket.payload));
    setIsValidating(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded border border-red-800">
              Terminal de Control de Accesos • CineMax Staff
            </span>
            <span className="text-xs font-mono text-slate-400">Operador: {currentUser.fullName}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Escáner Óptico &amp; Validación de Boletos</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Inspección criptográfica HMAC-SHA256 con verificación en menos de 500 ms, soporte de cámara móvil en vivo
            y modo de contingencia offline.
          </p>
        </div>

        {/* Offline Mode Switch */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            {offlineMode ? (
              <WifiOff className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : (
              <Wifi className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <span className="text-xs font-bold text-white block">
                {offlineMode ? 'Modo Offline (Caché Local)' : 'Modo En Línea (CineMax Cloud)'}
              </span>
              <span className="text-[10px] text-slate-400">Tolerancia a microcortes de red</span>
            </div>
          </div>

          <button
            onClick={() => setOfflineMode(!offlineMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              offlineMode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {offlineMode ? 'Reconectar Cloud' : 'Simular Corte de Red'}
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Visual Feedback Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera + Quick Tests + Manual Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* CAMERA QR SCANNER (POINT 5) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Camera className="w-4 h-4 text-red-500" />
                <span>Cámara del Dispositivo (Escaneo en Vivo)</span>
              </div>
              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isCameraActive
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Detener Cámara</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Activar Cámara Trasera</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Viewport Container */}
            <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Graphic */}
              {isCameraActive ? (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-red-500/80 rounded-2xl relative animate-pulse shadow-lg shadow-red-500/20">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-red-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-red-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-red-400"></div>
                    <div className="absolute inset-x-2 top-1/2 h-0.5 bg-red-500 shadow-sm shadow-red-400 animate-bounce"></div>
                  </div>
                  <div className="absolute bottom-2 bg-black/70 px-3 py-1 rounded-full text-[10px] text-white font-mono">
                    Apunta la cámara al código QR del cliente
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <Camera className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">Cámara inactiva.</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Presiona "Activar Cámara Trasera" para escanear boletos físicos o desde la pantalla de un celular.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-2 p-2.5 bg-red-950/60 border border-red-800 rounded-lg text-[11px] text-red-300">
                {cameraError}
              </div>
            )}
          </div>

          {/* Quick Test Validation Buttons */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
              <Zap className="w-4 h-4" />
              <span>Pruebas Operativas de Validación Rápida</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Permite simular de inmediato los tres estados de escaneo estipulados:
            </p>

            <div className="space-y-2">
              <button
                onClick={testScanSuccess}
                disabled={isValidating}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800 text-emerald-200 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>1. Probar Escaneo Exitoso</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-300">
                  Estado Verde
                </span>
              </button>

              <button
                onClick={testScanDuplicate}
                disabled={isValidating}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800 text-red-200 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                  <span>2. Probar Reingreso con Mismo Boleto (Duplicado)</span>
                </div>
                <span className="text-[10px] font-mono bg-red-900/80 px-2 py-0.5 rounded text-red-300">
                  Estado Rojo
                </span>
              </button>

              <button
                onClick={testScanTampered}
                disabled={isValidating}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800 text-amber-200 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>3. Probar Boleto con Firma Falsificada</span>
                </div>
                <span className="text-[10px] font-mono bg-amber-900/80 px-2 py-0.5 rounded text-amber-300">
                  Estado Naranja
                </span>
              </button>
            </div>
          </div>

          {/* Manual Input Form */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
              <Scan className="w-4 h-4 text-red-500" />
              <span>Ingreso Manual de Código / Payload</span>
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <textarea
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder='Pega aquí el JSON del QR o el ID de Boleto (ej. TKT-123456-C4)'
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isValidating || !inputVal.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Scan className="w-4 h-4" />
                  <span>Validar Entrada</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputVal('');
                    resetValidationResult();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs"
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: IMMEDIATE VISUAL FEEDBACK PANEL (< 500 ms) (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex-1 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-center min-h-[460px] relative overflow-hidden">
            {/* Ambient Backlight based on status */}
            {validationResult?.status === 'success' && (
              <div className="absolute inset-0 bg-emerald-600/10 pointer-events-none animate-pulse"></div>
            )}
            {validationResult?.status === 'already_used' && (
              <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse"></div>
            )}
            {validationResult?.status === 'invalid' && (
              <div className="absolute inset-0 bg-amber-600/10 pointer-events-none animate-pulse"></div>
            )}

            {/* Top feedback status pill */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Panel Visual de Control de Acceso
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Latencia de Inspección: &lt; 500 ms
              </span>
            </div>

            {/* IDLE STATE */}
            {(!validationResult || validationResult.status === 'idle') && (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 bg-slate-800/60 border border-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Scan className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Esperando Escaneo de Boleto</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Apunta la cámara del dispositivo al código QR, utiliza los botones de prueba rápida a la izquierda o
                  ingresa el identificador para validar el acceso a la sala.
                </p>
              </div>
            )}

            {/* 1. GREEN STATE: ACCESS GRANTED */}
            {validationResult?.status === 'success' && (
              <div className="bg-gradient-to-b from-emerald-950/80 to-slate-950 border-2 border-emerald-500 rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
                <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-700">
                  ESTADO VERDE • ACCESO CONCEDIDO
                </span>

                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-2">¡Pase Autorizado a Sala!</h3>
                <p className="text-xs text-emerald-300/80 max-w-sm mx-auto mb-6">
                  {validationResult.message}
                </p>

                {validationResult.ticket && (
                  <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-4 text-left space-y-2.5 max-w-md mx-auto shadow-inner">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Película:</span>
                      <span className="text-sm font-bold text-white">{validationResult.ticket.movieTitle}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Sala Asignada:</span>
                      <span className="text-sm font-bold text-amber-400">{validationResult.ticket.roomName}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Ubicación / Butaca:</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {validationResult.ticket.seatId}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                      <span>Horario Función:</span>
                      <span className="font-mono text-slate-200">
                        {validationResult.ticket.showtimeDate} - {validationResult.ticket.showtimeTime}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-900 font-mono">
                      <span>Boleto ID:</span>
                      <span>{validationResult.ticket.id}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. RED STATE: RE-ENTRY REJECTION */}
            {validationResult?.status === 'already_used' && (
              <div className="bg-gradient-to-b from-red-950/90 to-slate-950 border-2 border-red-500 rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
                <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400 shadow-lg shadow-red-500/30">
                  <XCircle className="w-12 h-12" />
                </div>

                <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-red-300 bg-red-950 px-3 py-1 rounded-full border border-red-700">
                  ESTADO ROJO • RECHAZO DE REINGRESO
                </span>

                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-2">¡ACCESO DENEGADO!</h3>
                <p className="text-sm font-bold text-red-400 max-w-md mx-auto mb-6 bg-red-950/60 p-3 rounded-xl border border-red-800">
                  {validationResult.message}
                </p>

                {validationResult.ticket && (
                  <div className="bg-slate-950/90 border border-red-500/40 rounded-xl p-4 text-left space-y-2 max-w-md mx-auto">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-1">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Alerta de Reutilización de Entrada</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Película: <strong className="text-white">{validationResult.ticket.movieTitle}</strong>
                    </div>
                    <div className="text-xs text-slate-300">
                      Butaca: <strong className="text-amber-400">{validationResult.ticket.seatId}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      Primer escaneo registrado el:{' '}
                      <span className="text-red-300 font-mono">
                        {validationResult.ticket.usedAt
                          ? new Date(validationResult.ticket.usedAt).toLocaleString('es-CO')
                          : 'Previamente redimido'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. ORANGE STATE: INVALID OR TAMPERED TICKET */}
            {validationResult?.status === 'invalid' && (
              <div className="bg-gradient-to-b from-amber-950/90 to-slate-950 border-2 border-amber-500 rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
                <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-lg shadow-amber-500/30">
                  <AlertTriangle className="w-12 h-12" />
                </div>

                <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-amber-300 bg-amber-950 px-3 py-1 rounded-full border border-amber-700">
                  ESTADO NARANJA • BOLETO INVÁLIDO
                </span>

                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-2">¡BOLETO INVÁLIDO!</h3>
                <p className="text-sm font-bold text-amber-300 max-w-md mx-auto mb-6 bg-amber-950/60 p-3 rounded-xl border border-amber-800">
                  {validationResult.message}
                </p>

                <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-4 text-left max-w-md mx-auto text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Verificación Criptográfica HMAC-SHA256</span>
                  </div>
                  <p className="text-slate-300">
                    La firma digital del código QR no pudo ser validada con la clave criptográfica oficial de CineMax, o
                    el número de boleto no existe.
                  </p>
                  {validationResult.reason && (
                    <div className="text-[11px] font-mono text-amber-400/90 pt-1">
                      Detalle técnico: {validationResult.reason}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
