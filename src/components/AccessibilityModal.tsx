import React, { useState } from 'react';
import { Accessibility, ShieldCheck, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { AccessibilityVerification } from '../types';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (data: AccessibilityVerification) => void;
  pendingSeatId: string | null;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  pendingSeatId,
}) => {
  const [docType, setDocType] = useState<'CC' | 'CE' | 'PASSPORT'>('CC');
  const [docNumber, setDocNumber] = useState<string>('');
  const [rudNumber, setRudNumber] = useState<string>('');
  const [holderName, setHolderName] = useState<string>('');
  const [termsAgreed, setTermsAgreed] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim() || !rudNumber.trim() || !holderName.trim()) {
      setError('Por favor completa todos los campos del registro oficial.');
      return;
    }

    if (!termsAgreed) {
      setError('Debes certificar la veracidad de la información para continuar.');
      return;
    }

    setError(null);
    onVerify({
      isVerified: true,
      documentType: docType,
      documentNumber: docNumber.trim(),
      rudNumber: rudNumber.trim().toUpperCase(),
      holderName: holderName.trim(),
      verifiedAt: Date.now(),
    });
  };

  const handlePreloadDemo = () => {
    setDocType('CC');
    setDocNumber('1029384756');
    setRudNumber('RUD-892401-COL');
    setHolderName('Carlos Alberto Ramírez');
    setTermsAgreed(true);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-blue-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
              <Accessibility className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-bold">
                  CineMax Access • Verificación Oficial
                </span>
                {pendingSeatId && (
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Butaca {pendingSeatId}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Ubicación para Personas con Movilidad Reducida
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-950/40 border border-blue-900/60 p-3.5 rounded-xl text-xs text-blue-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Conforme a la normativa nacional de accesibilidad y las políticas de CineMax Entertainment Group, estos
              espacios están reservados exclusivamente para usuarios con movilidad reducida o discapacidad certificada.
            </span>
          </div>

          {error && (
            <div className="bg-red-950/80 border border-red-500/60 text-red-200 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre Completo del Titular o Beneficiario:
            </label>
            <input
              type="text"
              required
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Ej. Carlos Alberto Ramírez"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Documento:</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CC">Cédula de Ciudadanía (C.C.)</option>
                <option value="CE">Cédula de Extranjería (C.E.)</option>
                <option value="PASSPORT">Pasaporte Oficial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Identificación:</label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Ej. 1029384756"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Registro Único de Discapacidad (RUD) / Carné Médico:</span>
              <button
                type="button"
                onClick={handlePreloadDemo}
                className="text-blue-400 hover:text-blue-300 text-[11px] underline"
              >
                Autocompletar Datos de Prueba
              </button>
            </label>
            <input
              type="text"
              required
              value={rudNumber}
              onChange={(e) => setRudNumber(e.target.value)}
              placeholder="Ej. RUD-892401-COL o Certificado EPS"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
            />
          </div>

          <div className="pt-2 flex items-start gap-2">
            <input
              type="checkbox"
              id="modalAgree"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
            <label htmlFor="modalAgree" className="text-[11px] text-slate-400 cursor-pointer select-none">
              Certifico bajo gravedad de juramento que la información suministrada es verídica y que la butaca será
              destinada a una persona con movilidad reducida o discapacidad certificada.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Validar y Autorizar Ubicación</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
