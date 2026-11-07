// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import {
  Film,
  Ticket,
  Clock,
  Accessibility,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShoppingCart,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  PackageCheck,
  Camera,
  CameraOff,
  User,
  LogOut,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  Key,
  FileText,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

// ============================================================================
// 1. MODELOS DE DATOS
// ============================================================================
export type SeatStatus = 'available' | 'reserved' | 'sold';
export type UserRole = 'customer' | 'admin' | 'gatekeeper' | 'confectionery';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  documentNumber: string;
  hasMobilityImpairment: boolean;
  rudNumber?: string;
  isRudVerified: boolean;
  role: UserRole;
}

export interface Seat {
  id: string;
  row: string;
  col: number;
  status: SeatStatus;
  isAccessible: boolean;
  lockedBySessionId?: string;
  lockedAt?: number;
}

export interface ShowtimeSlot {
  id: string;
  time: string;
  hour24: number;
  roomName: string;
  seats: Record<string, Seat>;
}

export interface Showtime {
  id: string;
  movieTitle: string;
  synopsis: string;
  posterUrl: string;
  genre: string;
  duration: string;
  classification: string;
  basePrice: number;
  availableSlots: ShowtimeSlot[];
}

export interface ConfectioneryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export interface TicketPayload {
  ticketId: string;
  showtimeId: string;
  slotId: string;
  movie: string;
  room: string;
  seat: string;
  showtimeDate: string;
  showtimeTime: string;
  issuedAt: number;
  signature: string;
}

export interface TicketRecord {
  id: string;
  orderId: string;
  showtimeId: string;
  slotId: string;
  movieTitle: string;
  roomName: string;
  seatId: string;
  showtimeDate: string;
  showtimeTime: string;
  payload: TicketPayload;
  qrDataUrl: string;
  status: 'valid' | 'used';
  usedAt?: number;
  validatedBy?: string;
}

export interface ConfectioneryVoucher {
  code: string;
  orderId: string;
  showtimeId: string;
  movieTitle: string;
  showtimeTime: string;
  items: { itemId: string; name: string; quantity: number; unitPrice: number }[];
  status: 'pending' | 'dispatched';
  dispatchedAt?: number;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  showtimeId: string;
  slotId: string;
  movieTitle: string;
  roomName: string;
  showtimeTime: string;
  seatIds: string[];
  subtotalTickets: number;
  confectioneryItems: { itemId: string; name: string; quantity: number; unitPrice: number }[];
  subtotalConfectionery: number;
  totalAmount: number;
  createdAt: number;
  ticketIds: string[];
  voucherCode?: string;
}

// ============================================================================
// 2. CRIPTOGRAFÍA Y UTILIDADES
// ============================================================================
const HMAC_SECRET = 'CINEMAX_ENTERPRISE_HMAC_SECRET_KEY_PROD_2026';

function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  for (let i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << (24 - (i % 4) * 8);
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;
  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);
    for (let j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = (w[j - 15] >>> 7 | w[j - 15] << 25) ^ (w[j - 15] >>> 18 | w[j - 15] << 14) ^ (w[j - 15] >>> 3);
        const s1 = (w[j - 2] >>> 17 | w[j - 2] << 15) ^ (w[j - 2] >>> 19 | w[j - 2] << 13) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      const s1 = (hash[4] >>> 6 | hash[4] << 26) ^ (hash[4] >>> 11 | hash[4] << 21) ^ (hash[4] >>> 25 | hash[4] << 7);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[j] + (w[j] || 0)) | 0;
      const s0 = (hash[0] >>> 2 | hash[0] << 30) ^ (hash[0] >>> 13 | hash[0] << 19) ^ (hash[0] >>> 22 | hash[0] << 10);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (let j = 0; j < 8; j++) hash[j] = (hash[j] + oldHash[j]) | 0;
  }
  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function generateHmacSha256(canonical: string, key = HMAC_SECRET): string {
  return sha256(`KEY:${key}#DATA:${canonical}#LEN:${canonical.length}`);
}

function signTicketPayload(data: Omit<TicketPayload, 'signature'>): TicketPayload {
  const canonical = `${data.ticketId}|${data.showtimeId}|${data.slotId}|${data.movie}|${data.seat}|${data.issuedAt}`;
  const signature = generateHmacSha256(canonical);
  return { ...data, signature };
}

function verifyTicketSignature(payload: TicketPayload): boolean {
  if (!payload || !payload.ticketId || !payload.signature) return false;
  const canonical = `${payload.ticketId}|${payload.showtimeId}|${payload.slotId}|${payload.movie}|${payload.seat}|${payload.issuedAt}`;
  const expected = generateHmacSha256(canonical);
  return payload.signature === expected;
}

export function getQrCodeUrl(payload: any, size = 260): string {
  try {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(raw)}`;
  } catch {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=CMX-TICKET`;
  }
}

function calculateTicketPricing(basePrice: number, hour24: number) {
  const isMatinal = hour24 < 12;
  const discountAmount = isMatinal ? Math.round(basePrice * 0.20) : 0;
  return {
    basePrice,
    finalPrice: basePrice - discountAmount,
    hasDiscount: isMatinal,
    discountAmount,
  };
}

function generateInitialSeats(): Record<string, Seat> {
  const seats: Record<string, Seat> = {};
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((row) => {
    for (let col = 1; col <= 8; col++) {
      const id = `${row}${col}`;
      const isAccessible = row === 'A' && (col <= 2 || col >= 7);
      seats[id] = { id, row, col, status: 'available', isAccessible };
    }
  });
  return seats;
}

const INITIAL_MOVIES: Showtime[] = [
  {
    id: 'SH-01',
    movieTitle: 'Interstellar (10º Aniversario)',
    synopsis: 'Un equipo de exploradores viaja a través de un agujero de gusano para salvar a la humanidad.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    genre: 'Ciencia Ficción / Drama',
    duration: '169 min',
    classification: '+12',
    basePrice: 20000,
    availableSlots: [
      { id: 'SL-01-A', time: '10:30 AM', hour24: 10.5, roomName: 'Sala 1 IMAX Láser', seats: generateInitialSeats() },
      { id: 'SL-01-B', time: '02:15 PM', hour24: 14.25, roomName: 'Sala 1 IMAX Láser', seats: generateInitialSeats() },
      { id: 'SL-01-C', time: '06:45 PM', hour24: 18.75, roomName: 'Sala 1 IMAX Láser', seats: generateInitialSeats() },
    ],
  },
  {
    id: 'SH-02',
    movieTitle: 'Duna: Parte Dos',
    synopsis: 'Paul Atreides se une a los Fremen para vengar la traición que destruyó a su familia.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    genre: 'Aventura / Épica',
    duration: '166 min',
    classification: '+14',
    basePrice: 22000,
    availableSlots: [
      { id: 'SL-02-A', time: '11:00 AM', hour24: 11.0, roomName: 'Sala 2 MacroXE', seats: generateInitialSeats() },
      { id: 'SL-02-B', time: '04:30 PM', hour24: 16.5, roomName: 'Sala 2 MacroXE', seats: generateInitialSeats() },
    ],
  },
];

const INITIAL_CONFECTIONERY: ConfectioneryItem[] = [
  {
    id: 'CONF-01',
    name: 'Combo Personal Clásico',
    description: 'Crispetas medianas + Gaseosa 640ml',
    price: 18000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'CONF-02',
    name: 'Combo Dúo CineMax',
    description: '2 Crispetas Medianas + 2 Gaseosas + Chocolatina',
    price: 32000,
    stock: 28,
    imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=400&q=80',
  },
];

const DEMO_ACCOUNTS: UserProfile[] = [
  {
    id: 'USR-ADMIN',
    fullName: 'Director de Operaciones',
    email: 'admin@cinemax.com',
    password: 'admin',
    phone: '3001234567',
    documentNumber: '80999111',
    hasMobilityImpairment: false,
    isRudVerified: false,
    role: 'admin',
  },
  {
    id: 'USR-GATE',
    fullName: 'Jefe de Accesos & Portería',
    email: 'porteria@cinemax.com',
    password: 'gate',
    phone: '3009876543',
    documentNumber: '79888222',
    hasMobilityImpairment: false,
    isRudVerified: false,
    role: 'gatekeeper',
  },
  {
    id: 'USR-BAR',
    fullName: 'Supervisor Barra Express',
    email: 'confiteria@cinemax.com',
    password: 'bar',
    phone: '3005551212',
    documentNumber: '52333444',
    hasMobilityImpairment: false,
    isRudVerified: false,
    role: 'confectionery',
  },
  {
    id: 'USR-CLIENT-RUD',
    fullName: 'Carlos Alberto Ramírez',
    email: 'cliente@cinemax.com',
    password: '123',
    phone: '3104509821',
    documentNumber: '1029384756',
    hasMobilityImpairment: true,
    rudNumber: 'RUD-892401-COL',
    isRudVerified: true,
    role: 'customer',
  },
];

function sanitizeShowtimes(list: any[]): Showtime[] {
  if (!Array.isArray(list) || list.length === 0) return INITIAL_MOVIES;
  return list.map((m, idx) => ({
    id: m.id || `SH-0${idx + 1}`,
    movieTitle: m.movieTitle || 'Película',
    synopsis: m.synopsis || '',
    posterUrl: m.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    genre: m.genre || 'General',
    duration: m.duration || '120 min',
    classification: m.classification || '+12',
    basePrice: Number(m.basePrice) || 20000,
    availableSlots: Array.isArray(m.availableSlots) && m.availableSlots.length > 0
      ? m.availableSlots.map((slot: any, sIdx: number) => ({
          id: slot.id || `SL-${m.id || idx}-${sIdx}`,
          time: slot.time || '10:30 AM',
          hour24: Number(slot.hour24) || 12,
          roomName: slot.roomName || 'Sala 1',
          seats: slot.seats && typeof slot.seats === 'object' && Object.keys(slot.seats).length > 0
            ? slot.seats
            : generateInitialSeats(),
        }))
      : [
          {
            id: `SL-${m.id || idx}-A`,
            time: '10:30 AM',
            hour24: 10.5,
            roomName: 'Sala 1 IMAX Láser',
            seats: generateInitialSeats(),
          },
        ],
  }));
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CineMax Error:', error, errorInfo);
  }
  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800 flex items-center justify-center text-red-500 mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold">CineMax Entertainment Group</h1>
          <p className="text-xs text-zinc-400 mt-2 max-w-md">
            Se restauró la sesión con datos seguros para evitar interrupciones.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-6 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Limpiar Memoria y Reiniciar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 3. APLICACIÓN PRINCIPAL CINEMAX
// ============================================================================
export function CineMaxApp() {
  const [showtimes, setShowtimes] = useState<Showtime[]>(() => {
    try {
      const s = localStorage.getItem('cmx_movies_v7');
      return s ? sanitizeShowtimes(JSON.parse(s)) : INITIAL_MOVIES;
    } catch {
      return INITIAL_MOVIES;
    }
  });

  const [confectionery, setConfectionery] = useState<ConfectioneryItem[]>(() => {
    try {
      const s = localStorage.getItem('cmx_conf_v7');
      return s ? JSON.parse(s) : INITIAL_CONFECTIONERY;
    } catch {
      return INITIAL_CONFECTIONERY;
    }
  });

  const [tickets, setTickets] = useState<TicketRecord[]>(() => {
    try {
      const s = localStorage.getItem('cmx_tickets_v7');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [vouchers, setVouchers] = useState<ConfectioneryVoucher[]>(() => {
    try {
      const s = localStorage.getItem('cmx_vouchers_v7');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const s = localStorage.getItem('cmx_orders_v7');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const s = localStorage.getItem('cmx_users_v7');
      return s ? JSON.parse(s) : DEMO_ACCOUNTS;
    } catch {
      return DEMO_ACCOUNTS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const s = localStorage.getItem('cmx_user_v7');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => { localStorage.setItem('cmx_movies_v7', JSON.stringify(showtimes)); }, [showtimes]);
  useEffect(() => { localStorage.setItem('cmx_conf_v7', JSON.stringify(confectionery)); }, [confectionery]);
  useEffect(() => { localStorage.setItem('cmx_tickets_v7', JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { localStorage.setItem('cmx_vouchers_v7', JSON.stringify(vouchers)); }, [vouchers]);
  useEffect(() => { localStorage.setItem('cmx_orders_v7', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('cmx_users_v7', JSON.stringify(users)); }, [users]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('cmx_user_v7', JSON.stringify(currentUser));
    else localStorage.removeItem('cmx_user_v7');
  }, [currentUser]);

  // Sincronización multi-dispositivo
  const syncPayloadRef = useRef({ showtimes, tickets, vouchers, confectionery, orders });
  syncPayloadRef.current = { showtimes, tickets, vouchers, confectionery, orders };

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const remoteData = await res.json();
          if (remoteData && remoteData.showtimes && Array.isArray(remoteData.showtimes)) {
            setShowtimes(sanitizeShowtimes(remoteData.showtimes));
            if (remoteData.tickets) setTickets(remoteData.tickets);
            if (remoteData.vouchers) setVouchers(remoteData.vouchers);
            if (remoteData.confectionery) setConfectionery(remoteData.confectionery);
            if (remoteData.orders) setOrders(remoteData.orders);
          }
        }
      } catch {}
    }, 1500);
    return () => clearInterval(syncInterval);
  }, []);

  const broadcastChanges = async (overrideData?: any) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideData || syncPayloadRef.current),
      });
    } catch {}
  };

  // Navegación
  const [activeTab, setActiveTab] = useState<'client' | 'tickets' | 'admin' | 'gatekeeper' | 'kds'>('client');
  const [purchaseStep, setPurchaseStep] = useState<'billboard' | 'seats' | 'confectionery' | 'checkout' | 'confirmation'>('billboard');

  // Selección
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const selectedMovie = useMemo(() => showtimes.find((m) => m.id === selectedMovieId) || null, [showtimes, selectedMovieId]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const selectedSlot = useMemo(() => selectedMovie?.availableSlots.find((s) => s.id === selectedSlotId) || null, [selectedMovie, selectedSlotId]);

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [cartConfectionery, setCartConfectionery] = useState<Record<string, number>>({});
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));

  // ============================================================================
  // TEMPORIZADOR VISIBLE DE 10 MINUTOS (600s)
  // ============================================================================
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          handleReleaseSeats();
          alert('Tu tiempo de reserva de 10 minutos ha expirado. Las butacas se han liberado.');
          setPurchaseStep('billboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds, selectedMovieId, selectedSlotId, selectedSeats]);

  const handleReleaseSeats = () => {
    if (selectedMovieId && selectedSlotId && selectedSeats.length > 0) {
      const updated = showtimes.map((m) => {
        if (m.id !== selectedMovieId) return m;
        return {
          ...m,
          availableSlots: m.availableSlots.map((s) => {
            if (s.id !== selectedSlotId) return s;
            const updatedSeats = { ...s.seats };
            selectedSeats.forEach((sid) => {
              if (updatedSeats[sid] && updatedSeats[sid].status === 'reserved') {
                updatedSeats[sid] = { ...updatedSeats[sid], status: 'available' as const, lockedBySessionId: undefined, lockedAt: undefined };
              }
            });
            return { ...s, seats: updatedSeats };
          }),
        };
      });
      setShowtimes(updated);
      broadcastChanges({ ...syncPayloadRef.current, showtimes: updated });
    }
    setSelectedSeats([]);
  };

  const handleSelectSlot = (movie: Showtime, slot: ShowtimeSlot) => {
    setSelectedMovieId(movie.id);
    setSelectedSlotId(slot.id);
    setSelectedSeats([]);
    setCartConfectionery({});
    setTimerSeconds(600);
    setPurchaseStep('seats');
  };

  const handleBackToBillboard = () => {
    handleReleaseSeats();
    setTimerSeconds(0);
    setPurchaseStep('billboard');
  };

  const handleSeatClick = (seatId: string) => {
    if (!selectedMovie || !selectedSlot) return;
    const seat = selectedSlot.seats[seatId];
    if (!seat) return;

    if (selectedSeats.includes(seatId)) {
      const nextSeats = selectedSeats.filter((id) => id !== seatId);
      setSelectedSeats(nextSeats);
      const updated = showtimes.map((m) => {
        if (m.id !== selectedMovie.id) return m;
        return {
          ...m,
          availableSlots: m.availableSlots.map((s) => {
            if (s.id !== selectedSlot.id) return s;
            return {
              ...s,
              seats: {
                ...s.seats,
                [seatId]: { ...s.seats[seatId], status: 'available' as const, lockedBySessionId: undefined, lockedAt: undefined },
              },
            };
          }),
        };
      });
      setShowtimes(updated);
      broadcastChanges({ ...syncPayloadRef.current, showtimes: updated });
      return;
    }

    if (selectedSeats.length >= 6) {
      alert('Límite alcanzado: Máximo 6 boletos por función.');
      return;
    }

    if (seat.isAccessible) {
      if (!currentUser) {
        setAuthMode('login');
        setIsAuthModalOpen(true);
        return;
      }
      if (!currentUser.isRudVerified) {
        alert('Este asiento preferencial requiere validación del Registro Único de Discapacidad (RUD).');
        return;
      }
    }

    if (seat.status === 'sold' || (seat.status === 'reserved' && seat.lockedBySessionId !== sessionId)) {
      return;
    }

    const nextSeats = [...selectedSeats, seatId];
    setSelectedSeats(nextSeats);
    const updated = showtimes.map((m) => {
      if (m.id !== selectedMovie.id) return m;
      return {
        ...m,
        availableSlots: m.availableSlots.map((s) => {
          if (s.id !== selectedSlot.id) return s;
          return {
            ...s,
            seats: {
              ...s.seats,
              [seatId]: {
                ...s.seats[seatId],
                status: 'reserved' as const,
                lockedBySessionId: sessionId,
                lockedAt: Date.now(),
              },
            },
          };
        }),
      };
    });
    setShowtimes(updated);
    broadcastChanges({ ...syncPayloadRef.current, showtimes: updated });
  };

  const pricing = useMemo(() => {
    if (!selectedMovie || !selectedSlot) return null;
    return calculateTicketPricing(selectedMovie.basePrice, selectedSlot.hour24);
  }, [selectedMovie, selectedSlot]);

  const ticketsSubtotal = (pricing?.finalPrice || 0) * selectedSeats.length;
  const confectionerySubtotal = useMemo(() => {
    return Object.entries(cartConfectionery).reduce((acc, [id, qty]) => {
      const item = confectionery.find((c) => c.id === id);
      return acc + (item ? item.price * qty : 0);
    }, 0);
  }, [cartConfectionery, confectionery]);
  const grandTotal = ticketsSubtotal + confectionerySubtotal;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  const handleProceedToPayment = () => {
    if (!currentUser) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setPurchaseStep('checkout');
  };

  const handleProcessPayment = async () => {
    if (!selectedMovie || !selectedSlot || selectedSeats.length === 0 || !currentUser) {
      alert('Selección incompleta o sesión no iniciada.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      await new Promise((r) => setTimeout(r, 500));

      const orderId = 'CMX-' + Math.floor(100000 + Math.random() * 900000);
      const newTickets: TicketRecord[] = [];
      const ticketIds: string[] = [];

      for (const seatId of selectedSeats) {
        const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}-${seatId}`;
        ticketIds.push(ticketId);
        const payloadRaw = {
          ticketId,
          showtimeId: selectedMovie.id,
          slotId: selectedSlot.id,
          movie: selectedMovie.movieTitle,
          room: selectedSlot.roomName,
          seat: seatId,
          showtimeDate: 'Hoy, Función Oficial',
          showtimeTime: selectedSlot.time,
          issuedAt: Math.floor(Date.now() / 1000),
        };
        const signed = signTicketPayload(payloadRaw);
        newTickets.push({
          id: ticketId,
          orderId,
          showtimeId: selectedMovie.id,
          slotId: selectedSlot.id,
          movieTitle: selectedMovie.movieTitle,
          roomName: selectedSlot.roomName,
          seatId,
          showtimeDate: 'Hoy, Función Oficial',
          showtimeTime: selectedSlot.time,
          payload: signed,
          qrDataUrl: getQrCodeUrl(signed, 260),
          status: 'valid',
        });
      }

      const confItems = Object.entries(cartConfectionery)
        .map(([id, qty]) => {
          const item = confectionery.find((c) => c.id === id);
          return item && qty > 0 ? { itemId: item.id, name: item.name, quantity: qty, unitPrice: item.price } : null;
        })
        .filter(Boolean) as { itemId: string; name: string; quantity: number; unitPrice: number }[];

      let voucherCode: string | undefined = undefined;
      let nextVouchers = [...vouchers];
      let nextConf = [...confectionery];

      if (confItems.length > 0) {
        voucherCode = 'CONF-' + Math.floor(1000 + Math.random() * 9000);
        const newVoucher: ConfectioneryVoucher = {
          code: voucherCode,
          orderId,
          showtimeId: selectedMovie.id,
          movieTitle: selectedMovie.movieTitle,
          showtimeTime: selectedSlot.time,
          items: confItems,
          status: 'pending',
        };
        nextVouchers = [newVoucher, ...nextVouchers];
        setVouchers(nextVouchers);

        nextConf = confectionery.map((c) => {
          const match = confItems.find((ci) => ci.itemId === c.id);
          return match ? { ...c, stock: Math.max(0, c.stock - match.quantity) } : c;
        });
        setConfectionery(nextConf);
      }

      // Descontar sillas en este horario
      const updatedShowtimes = showtimes.map((m) => {
        if (m.id !== selectedMovie.id) return m;
        return {
          ...m,
          availableSlots: m.availableSlots.map((s) => {
            if (s.id !== selectedSlot.id) return s;
            const updatedSeats = { ...s.seats };
            selectedSeats.forEach((sid) => {
              if (updatedSeats[sid]) updatedSeats[sid] = { ...updatedSeats[sid], status: 'sold' as const, lockedBySessionId: undefined };
            });
            return { ...s, seats: updatedSeats };
          }),
        };
      });
      setShowtimes(updatedShowtimes);

      const completedOrder: Order = {
        id: orderId,
        customerEmail: currentUser.email,
        customerName: currentUser.fullName,
        showtimeId: selectedMovie.id,
        slotId: selectedSlot.id,
        movieTitle: selectedMovie.movieTitle,
        roomName: selectedSlot.roomName,
        showtimeTime: selectedSlot.time,
        seatIds: [...selectedSeats],
        subtotalTickets: ticketsSubtotal,
        confectioneryItems: confItems,
        subtotalConfectionery: confectionerySubtotal,
        totalAmount: grandTotal,
        createdAt: Date.now(),
        ticketIds,
        voucherCode,
      };

      const nextTickets = [...newTickets, ...tickets];
      const nextOrders = [completedOrder, ...orders];

      setTickets(nextTickets);
      setOrders(nextOrders);
      setLastCompletedOrder(completedOrder);

      broadcastChanges({
        showtimes: updatedShowtimes,
        tickets: nextTickets,
        vouchers: nextVouchers,
        confectionery: nextConf,
        orders: nextOrders,
      });

      setTimerSeconds(0);
      setSelectedSeats([]);
      setCartConfectionery({});
      setPurchaseStep('confirmation');
    } catch (err) {
      console.error(err);
      alert('Error en el pago. Intenta nuevamente.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ============================================================================
  // ADMIN: CRUD COMPLETO CON SALAS Y HORARIOS INDEPENDIENTES
  // ============================================================================
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminSynopsis, setAdminSynopsis] = useState('');
  const [adminGenre, setAdminGenre] = useState('');
  const [adminDuration, setAdminDuration] = useState('130 min');
  const [adminClass, setAdminClass] = useState('+12');
  const [adminPrice, setAdminPrice] = useState(20000);
  const [adminPoster, setAdminPoster] = useState('');
  const [adminRoom, setAdminRoom] = useState('Sala 1 IMAX Láser');
  const [adminTimes, setAdminTimes] = useState('10:30 AM, 02:45 PM, 07:00 PM');

  const openCreateMovieModal = () => {
    setEditingMovieId(null);
    setAdminTitle('');
    setAdminSynopsis('');
    setAdminGenre('Acción / Aventura');
    setAdminDuration('135 min');
    setAdminClass('+12');
    setAdminPrice(20000);
    setAdminPoster('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80');
    setAdminRoom('Sala 1 IMAX Láser');
    setAdminTimes('10:30 AM, 03:00 PM, 07:30 PM');
    setIsMovieModalOpen(true);
  };

  const openEditMovieModal = (m: Showtime) => {
    setEditingMovieId(m.id);
    setAdminTitle(m.movieTitle);
    setAdminSynopsis(m.synopsis);
    setAdminGenre(m.genre);
    setAdminDuration(m.duration);
    setAdminClass(m.classification);
    setAdminPrice(m.basePrice);
    setAdminPoster(m.posterUrl);
    setAdminRoom(m.availableSlots[0]?.roomName || 'Sala 1');
    setAdminTimes(m.availableSlots.map((s) => s.time).join(', '));
    setIsMovieModalOpen(true);
  };

  const handleSaveMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTitle.trim()) return;

    const slots: ShowtimeSlot[] = adminTimes.split(',').map((tStr, sIdx) => {
      const clean = tStr.trim();
      const isPM = clean.toLowerCase().includes('pm');
      const numMatch = clean.match(/(\d+):?(\d*)/);
      let h = numMatch ? parseInt(numMatch[1], 10) : 12;
      if (isPM && h < 12) h += 12;
      if (!isPM && h === 12) h = 0;
      return {
        id: `SL-${editingMovieId || 'NEW'}-${sIdx}-${clean.replace(/[^a-zA-Z0-9]/g, '')}`,
        time: clean,
        hour24: h,
        roomName: adminRoom,
        seats: generateInitialSeats(),
      };
    });

    let updatedList: Showtime[];
    if (editingMovieId) {
      updatedList = showtimes.map((m) =>
        m.id === editingMovieId
          ? {
              ...m,
              movieTitle: adminTitle,
              synopsis: adminSynopsis,
              genre: adminGenre,
              duration: adminDuration,
              classification: adminClass,
              basePrice: adminPrice,
              posterUrl: adminPoster,
              availableSlots: slots,
            }
          : m
      );
    } else {
      const newM: Showtime = {
        id: 'SH-' + Math.floor(100 + Math.random() * 900),
        movieTitle: adminTitle,
        synopsis: adminSynopsis,
        genre: adminGenre,
        duration: adminDuration,
        classification: adminClass,
        basePrice: adminPrice,
        posterUrl: adminPoster,
        availableSlots: slots,
      };
      updatedList = [newM, ...showtimes];
    }

    setShowtimes(updatedList);
    broadcastChanges({ ...syncPayloadRef.current, showtimes: updatedList });
    setIsMovieModalOpen(false);
  };

  const handleDeleteMovie = (id: string) => {
    if (window.confirm('¿Confirmas que deseas eliminar esta película de cartelera?')) {
      const updatedList = showtimes.filter((m) => m.id !== id);
      setShowtimes(updatedList);
      broadcastChanges({ ...syncPayloadRef.current, showtimes: updatedList });
      if (selectedMovieId === id) {
        setSelectedMovieId(null);
        setPurchaseStep('billboard');
      }
    }
  };

  const kpiData = useMemo(() => {
    const totalBoxOffice = (orders || []).reduce((acc, o) => acc + (Number(o?.subtotalTickets) || 0), 0);
    const totalConf = (orders || []).reduce((acc, o) => acc + (Number(o?.subtotalConfectionery) || 0), 0);
    let totalSeats = 0;
    let soldSeats = 0;
    (showtimes || []).forEach((st) => {
      (st?.availableSlots || []).forEach((slot) => {
        if (slot?.seats) {
          totalSeats += Object.keys(slot.seats).length;
          soldSeats += Object.values(slot.seats).filter((s) => s?.status === 'sold').length;
        }
      });
    });
    const validatedIngresos = (tickets || []).filter((t) => t?.status === 'used').length;
    return { totalBoxOffice, totalConf, totalSeats, soldSeats, validatedIngresos };
  }, [orders, showtimes, tickets]);

  // ============================================================================
  // PORTERÍA: ESCÁNER ACTIVO CON HTML5-QRCODE
  // ============================================================================
  const [gateResult, setGateResult] = useState<{ status: 'idle' | 'success' | 'already_used' | 'invalid'; message: string; ticket?: TicketRecord }>({
    status: 'idle',
    message: '',
  });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const html5QrCodeScannerRef = useRef<any>(null);

  const startCamera = async () => {
    setGateResult({ status: 'idle', message: '' });
    try {
      const Html5Qrcode = (window as any).Html5Qrcode;
      if (!Html5Qrcode) {
        alert('Cargando librería del escáner... Asegúrate de tener conexión y recarga.');
        return;
      }

      if (html5QrCodeScannerRef.current) {
        try { await html5QrCodeScannerRef.current.stop(); } catch {}
      }

      const qrScanner = new Html5Qrcode('qr-reader-container');
      html5QrCodeScannerRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          if (navigator.vibrate) navigator.vibrate(100);
          handleValidateTicket(decodedText);
          qrScanner.pause();
          setTimeout(() => {
            try { qrScanner.resume(); } catch {}
          }, 2000);
        },
        () => {}
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error(err);
      alert('No se pudo iniciar la cámara. Concede los permisos de cámara en tu navegador.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeScannerRef.current) {
      try {
        await html5QrCodeScannerRef.current.stop();
        html5QrCodeScannerRef.current.clear();
      } catch {}
      html5QrCodeScannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeScannerRef.current) {
        try { html5QrCodeScannerRef.current.stop(); } catch {}
      }
    };
  }, []);

  const handleValidateTicket = (rawInput: string) => {
    let found = tickets.find((t) => t.id === rawInput.trim());
    try {
      const parsed = JSON.parse(rawInput);
      if (parsed.ticketId) found = tickets.find((t) => t.id === parsed.ticketId);
    } catch {}

    if (!found) {
      setGateResult({ status: 'invalid', message: 'Boleto Inválido o No Registrado' });
      return;
    }
    if (!verifyTicketSignature(found.payload)) {
      setGateResult({ status: 'invalid', message: 'Firma Criptográfica Inválida (Corrupto)', ticket: found });
      return;
    }
    if (found.status === 'used') {
      const time = found.usedAt ? new Date(found.usedAt).toLocaleTimeString() : 'previamente';
      setGateResult({ status: 'already_used', message: `Boleto ya utilizado a las ${time}`, ticket: found });
      return;
    }

    const updated: TicketRecord = {
      ...found,
      status: 'used',
      usedAt: Date.now(),
      validatedBy: currentUser?.fullName || 'Portería Principal',
    };
    const nextTickets = tickets.map((t) => (t.id === found!.id ? updated : t));
    setTickets(nextTickets);
    broadcastChanges({ ...syncPayloadRef.current, tickets: nextTickets });

    setGateResult({ status: 'success', message: 'Acceso Permitido a Sala', ticket: updated });
  };

  // KDS
  const [kdsCode, setKdsCode] = useState('');
  const handleDispatchVoucher = (code: string) => {
    const clean = code.trim().toUpperCase();
    const v = vouchers.find((item) => item.code === clean);
    if (!v) {
      alert('Voucher no encontrado.');
      return;
    }
    if (v.status === 'dispatched') {
      alert('Este voucher ya fue despachado previamente.');
      return;
    }
    const nextV = vouchers.map((item) =>
      item.code === clean ? { ...item, status: 'dispatched' as const, dispatchedAt: Date.now() } : item
    );
    setVouchers(nextV);
    broadcastChanges({ ...syncPayloadRef.current, vouchers: nextV });
    alert(`Voucher ${clean} entregado exitosamente.`);
    setKdsCode('');
  };

  // MIS ENTRADAS: FILTRADO ESTRICTO POR USUARIO LOGUEADO
  const myTickets = useMemo(() => {
    if (!currentUser?.email) return [];
    const safeOrders = orders || [];
    const userOrders = safeOrders.filter(
      (o) => o?.customerEmail && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
    const userTicketIds = new Set(userOrders.flatMap((o) => o?.ticketIds || []));
    return (tickets || []).filter((t) => t?.id && userTicketIds.has(t.id));
  }, [currentUser, orders, tickets]);

  const myVouchers = useMemo(() => {
    if (!currentUser?.email) return [];
    const safeOrders = orders || [];
    const userOrders = safeOrders.filter(
      (o) => o?.customerEmail && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
    const userVoucherCodes = new Set(userOrders.map((o) => o?.voucherCode).filter(Boolean));
    return (vouchers || []).filter((v) => v?.code && userVoucherCodes.has(v.code));
  }, [currentUser, orders, vouchers]);

  // Modales
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isDemoWidgetOpen, setIsDemoWidgetOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Registro Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDoc, setRegDoc] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regHasMobility, setRegHasMobility] = useState(false);
  const [regRud, setRegRud] = useState('');
  const [regAcceptTerms, setRegAcceptTerms] = useState(false);

  // ============================================================================
  // RENDERIZADO VISUAL
  // ============================================================================
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div
            onClick={() => {
              setActiveTab('client');
              setPurchaseStep('billboard');
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
              <Film className="w-4 h-4" />
            </div>
            <span className="text-xl font-black text-white">
              Cine<span className="text-red-500">Max</span>
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => {
                setActiveTab('client');
                setPurchaseStep('billboard');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeTab === 'client' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cartelera
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'tickets' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Mis Entradas</span>
              {myTickets.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {myTickets.length}
                </span>
              )}
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeTab === 'admin' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Administración
              </button>
            )}
            {(currentUser?.role === 'admin' || currentUser?.role === 'gatekeeper') && (
              <button
                onClick={() => setActiveTab('gatekeeper')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeTab === 'gatekeeper' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Portería
              </button>
            )}
            {(currentUser?.role === 'admin' || currentUser?.role === 'confectionery') && (
              <button
                onClick={() => setActiveTab('kds')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeTab === 'kds' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Confitería KDS
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {purchaseStep !== 'billboard' && purchaseStep !== 'confirmation' && timerSeconds > 0 && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${
                  timerSeconds <= 60 ? 'bg-red-950/60 border-red-500 text-red-300 animate-pulse' : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
                <button onClick={handleBackToBillboard} className="ml-1 text-zinc-400 hover:text-red-400" title="Cancelar selección">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white hidden sm:inline">
                  {(currentUser.fullName || 'Usuario').split(' ')[0]}
                </span>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    setActiveTab('client');
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-700"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'client' && (
          <div>
            {purchaseStep === 'billboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Cartelera en Salas</h2>
                  <p className="text-xs text-zinc-400">Selecciona el horario de tu preferencia.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {showtimes.map((movie) => (
                    <div key={movie.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
                      <div>
                        <div className="relative aspect-[16/10] bg-zinc-950">
                          <img src={movie.posterUrl} alt={movie.movieTitle} className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="bg-zinc-950/80 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-700">
                              {movie.classification}
                            </span>
                            <span className="bg-zinc-950/80 text-zinc-300 text-[10px] px-2 py-0.5 rounded border border-zinc-700">
                              {movie.duration}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 space-y-2">
                          <span className="text-[11px] font-mono text-zinc-400">{movie.genre}</span>
                          <h3 className="text-base font-bold text-white">{movie.movieTitle}</h3>
                          <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">{movie.synopsis}</p>
                        </div>
                      </div>
                      <div className="p-5 pt-0">
                        <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block mb-2">Horarios:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {(movie.availableSlots || []).map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => handleSelectSlot(movie, slot)}
                              className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-xs text-white group-hover:text-red-400">{slot.time}</span>
                                {slot.hour24 < 12 && (
                                  <span className="text-[9px] font-mono font-semibold text-emerald-400 bg-emerald-950/70 px-1 py-0.2 rounded border border-emerald-800/60">
                                    -20%
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-400 block truncate mt-0.5">{slot.roomName}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SELECCIÓN DE SILLAS */}
            {purchaseStep === 'seats' && selectedMovie && selectedSlot && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedMovie.movieTitle}</h2>
                    <p className="text-xs text-zinc-400">
                      {selectedSlot.roomName} &bull; Horario: <strong className="text-white">{selectedSlot.time}</strong>
                    </p>
                  </div>
                  <button onClick={handleBackToBillboard} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver</span>
                  </button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
                  <div className="text-center">
                    <div className="w-3/4 max-w-md h-1.5 bg-zinc-700 mx-auto rounded-full mb-1"></div>
                    <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">PANTALLA</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 overflow-x-auto py-2">
                    {['A', 'B', 'C', 'D', 'E', 'F'].map((row) => (
                      <div key={row} className="flex items-center gap-2">
                        <span className="w-4 font-mono text-[10px] text-zinc-500 font-bold">{row}</span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => {
                            const seatId = `${row}${col}`;
                            const seat = selectedSlot.seats[seatId];
                            if (!seat) return null;
                            const isSelected = selectedSeats.includes(seatId);
                            const isSold = seat.status === 'sold';
                            const isReservedOther = seat.status === 'reserved' && !isSelected;
                            const isAccessible = seat.isAccessible;

                            let cls = 'w-9 h-9 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold transition-all border ';
                            if (isSelected) cls += 'bg-red-600 text-white border-red-500 shadow-md';
                            else if (isSold) cls += 'bg-zinc-950 text-zinc-700 border-zinc-900 cursor-not-allowed opacity-40';
                            else if (isReservedOther) cls += 'bg-zinc-800/50 text-zinc-600 border-zinc-800 cursor-not-allowed';
                            else if (isAccessible) cls += 'bg-blue-950/40 text-blue-300 border-blue-900 hover:bg-blue-900/50';
                            else cls += 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700';

                            return (
                              <button
                                key={seatId}
                                onClick={() => handleSeatClick(seatId)}
                                disabled={isSold || isReservedOther}
                                className={cls}
                                title={`Butaca ${seatId}`}
                              >
                                {isAccessible ? <Accessibility className="w-3.5 h-3.5" /> : seatId}
                              </button>
                            );
                          })}
                        </div>
                        <span className="w-4 font-mono text-[10px] text-zinc-500 font-bold">{row}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-zinc-300">
                        Seleccionadas: <strong className="text-white font-mono">{selectedSeats.join(', ') || 'Ninguna'}</strong>{' '}
                        <span className="text-zinc-500">({selectedSeats.length}/6)</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Subtotal: <strong className="text-white font-mono">${ticketsSubtotal.toLocaleString('es-CO')} COP</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => setPurchaseStep('confectionery')}
                      disabled={selectedSeats.length === 0}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <span>Continuar a Confitería</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CONFITERÍA */}
            {purchaseStep === 'confectionery' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h2 className="text-lg font-bold text-white">Confitería Express</h2>
                  <span className="text-xs font-mono text-zinc-400">Subtotal: ${confectionerySubtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {confectionery.map((item) => {
                    const qty = cartConfectionery[item.id] || 0;
                    return (
                      <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-3.5 items-center">
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-white truncate">{item.name}</h3>
                          <div className="text-xs font-mono font-bold text-zinc-200 mt-1">${item.price.toLocaleString('es-CO')}</div>
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <button
                              onClick={() => setCartConfectionery((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                              disabled={qty === 0}
                              className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center disabled:opacity-30"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono text-xs text-white w-4 text-center">{qty}</span>
                            <button
                              onClick={() => setCartConfectionery((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                              disabled={qty >= item.stock}
                              className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <button onClick={() => setPurchaseStep('seats')} className="text-xs text-zinc-400 hover:text-white">
                    Volver a Asientos
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCartConfectionery({});
                        handleProceedToPayment();
                      }}
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold"
                    >
                      Omitir Confitería
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <span>Proceder al Pago</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CHECKOUT */}
            {purchaseStep === 'checkout' && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
                  <div className="pb-3 border-b border-zinc-800">
                    <h2 className="text-base font-bold text-white">Resumen de Compra</h2>
                    <p className="text-xs text-zinc-400">Verifica los datos antes de autorizar el pago.</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-mono text-zinc-500 block">Titular:</span>
                    <div className="font-bold text-white">{currentUser?.fullName}</div>
                    <div className="text-zinc-400 font-mono text-[11px]">{currentUser?.email}</div>
                  </div>
                  <div className="space-y-2 text-xs border-y border-zinc-800 py-3">
                    <div className="flex justify-between text-zinc-300">
                      <span>Película:</span>
                      <span className="font-mono text-white">{selectedMovie?.movieTitle}</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Butacas ({selectedSeats.join(', ')}):</span>
                      <span className="font-mono">${ticketsSubtotal.toLocaleString('es-CO')}</span>
                    </div>
                    {confectionerySubtotal > 0 && (
                      <div className="flex justify-between text-zinc-300">
                        <span>Confitería:</span>
                        <span className="font-mono">${confectionerySubtotal.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold text-sm pt-2">
                      <span>Total Consolidado:</span>
                      <span className="font-mono text-emerald-400">${grandTotal.toLocaleString('es-CO')} COP</span>
                    </div>
                  </div>
                  <button
                    onClick={handleProcessPayment}
                    disabled={isProcessingPayment}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Procesando y Emitiendo Boletos...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pagar ${grandTotal.toLocaleString('es-CO')} COP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* CONFIRMACIÓN */}
            {purchaseStep === 'confirmation' && lastCompletedOrder && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">¡Compra Exitosa!</h2>
                  <p className="text-xs text-zinc-400">
                    Orden <strong className="font-mono text-white">{lastCompletedOrder.id}</strong> aprobada. Los boletos están asignados a tu cuenta.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('tickets');
                      setPurchaseStep('billboard');
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors mt-2"
                  >
                    Ver Mis Entradas y QRs
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MIS ENTRADAS: EXCLUSIVO DEL USUARIO */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Mis Boletos Activos</h2>
              <p className="text-xs text-zinc-400">
                Presenta los códigos QR directamente desde la pantalla de tu celular en la portería del cine.
              </p>
            </div>

            {!currentUser ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 text-xs space-y-3">
                <p>Debes iniciar sesión con tu cuenta para visualizar tus boletos comprados.</p>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Iniciar Sesión
                </button>
              </div>
            ) : myTickets.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 text-xs">
                No tienes boletos emitidos con la cuenta <strong className="text-white">{currentUser.email}</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTickets.map((t) => (
                  <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center space-y-4">
                    <div className="w-full flex justify-between text-xs font-mono pb-2 border-b border-zinc-800">
                      <span className="font-bold text-white">Butaca {t.seatId}</span>
                      <span className="text-zinc-400">{t.roomName}</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-xl">
                      <img src={t.qrDataUrl || getQrCodeUrl(t.payload, 260)} alt={`QR Butaca ${t.seatId}`} className="w-52 h-52 object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{t.movieTitle}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{t.showtimeTime}</p>
                    </div>
                    <div className="w-full pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'valid' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                        {t.status === 'valid' ? 'Válido para Ingreso' : 'Ya Usado'}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">{t.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentUser && myVouchers.length > 0 && (
              <div className="pt-6 border-t border-zinc-800 space-y-4">
                <h3 className="text-base font-bold text-white">Vouchers de Confitería Express</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myVouchers.map((v) => (
                    <div key={v.code} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-black font-mono text-amber-400">{v.code}</span>
                        <div className="text-xs text-white font-bold mt-1">{v.movieTitle}</div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {v.status === 'pending' ? 'Listo para retirar en barra' : 'Despachado'}
                        </span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded font-bold ${v.status === 'pending' ? 'bg-amber-950 text-amber-300' : 'bg-zinc-800 text-zinc-400'}`}>
                        {v.status === 'pending' ? 'Pendiente' : 'Entregado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMINISTRACIÓN (CRUD COMPLETO) */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-xl font-bold text-white">Panel de Administración de Cartelera</h2>
                <p className="text-xs text-zinc-400">Configura películas, salas asignadas y horarios.</p>
              </div>
              <button
                onClick={openCreateMovieModal}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Agregar Película</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <span className="text-zinc-400 text-xs">Venta Taquilla</span>
                <div className="text-lg font-bold font-mono text-white mt-1">${kpiData.totalBoxOffice.toLocaleString('es-CO')}</div>
              </div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <span className="text-zinc-400 text-xs">Venta Confitería</span>
                <div className="text-lg font-bold font-mono text-white mt-1">${kpiData.totalConf.toLocaleString('es-CO')}</div>
              </div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <span className="text-zinc-400 text-xs">Capacidad en Cartelera</span>
                <div className="text-lg font-bold font-mono text-white mt-1">{kpiData.soldSeats} / {kpiData.totalSeats}</div>
              </div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <span className="text-zinc-400 text-xs">Ingresos Portería</span>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{kpiData.validatedIngresos} con QR</div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Póster</th>
                    <th className="p-3">Película & Sala</th>
                    <th className="p-3">Horarios</th>
                    <th className="p-3">Tarifa Base</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {showtimes.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-950/40">
                      <td className="p-3">
                        <img src={m.posterUrl} alt={m.movieTitle} className="w-10 h-14 object-cover rounded-md" />
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{m.movieTitle}</div>
                        <div className="text-zinc-400 text-[11px]">{m.availableSlots[0]?.roomName || 'Sala'}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {m.availableSlots.map((s) => (
                            <span key={s.id} className="bg-zinc-950 px-2 py-0.5 rounded font-mono text-[10px]">
                              {s.time}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold">${m.basePrice.toLocaleString('es-CO')}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => openEditMovieModal(m)}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(m.id)}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-red-950 text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PORTERÍA CON HTML5-QRCODE */}
        {activeTab === 'gatekeeper' && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Control de Portería</h2>
                <p className="text-[11px] text-zinc-400">Escáner óptico de entradas</p>
              </div>
              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg"
              >
                {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                <span>{isCameraActive ? 'Detener Escáner' : 'Activar Escáner'}</span>
              </button>
            </div>

            <div className="relative aspect-square bg-black rounded-3xl overflow-hidden border border-zinc-800 flex items-center justify-center shadow-2xl">
              <div id="qr-reader-container" className="w-full h-full"></div>
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-zinc-500 bg-zinc-950">
                  <Camera className="w-12 h-12 mb-2 text-zinc-600" />
                  <p className="text-xs font-semibold text-zinc-400">Escáner inactivo</p>
                  <p className="text-[11px] text-zinc-600 mt-1 text-center">
                    Presiona "Activar Escáner" para encender la cámara y apuntar a los códigos QR.
                  </p>
                </div>
              )}
            </div>

            {gateResult.status !== 'idle' && (
              <div
                className={`p-4 rounded-2xl border text-center text-xs font-bold transition-all shadow-xl ${
                  gateResult.status === 'success'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                    : gateResult.status === 'already_used'
                    ? 'bg-red-950 border-red-500 text-red-200'
                    : 'bg-amber-950 border-amber-500 text-amber-200'
                }`}
              >
                <div className="text-sm">{gateResult.message}</div>
                {gateResult.ticket && (
                  <div className="text-[11px] font-mono mt-1 text-zinc-300">
                    {gateResult.ticket.movieTitle} &bull; Butaca: <strong>{gateResult.ticket.seatId}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => {
                  const t = tickets.find((x) => x.status === 'valid');
                  if (t) handleValidateTicket(JSON.stringify(t.payload));
                  else alert('No hay boletos válidos para probar.');
                }}
                className="bg-zinc-900 border border-zinc-800 text-xs py-2 rounded-xl text-zinc-200 hover:bg-zinc-800"
              >
                Probar Válido
              </button>
              <button
                onClick={() => {
                  const t = tickets.find((x) => x.status === 'used');
                  if (t) handleValidateTicket(JSON.stringify(t.payload));
                  else alert('Escanea uno válido primero para probar el duplicado.');
                }}
                className="bg-zinc-900 border border-zinc-800 text-xs py-2 rounded-xl text-zinc-200 hover:bg-zinc-800"
              >
                Probar Duplicado
              </button>
              <button
                onClick={() => handleValidateTicket(JSON.stringify({ ticketId: 'FAKE', signature: 'bad' }))}
                className="bg-zinc-900 border border-zinc-800 text-xs py-2 rounded-xl text-zinc-200 hover:bg-zinc-800"
              >
                Probar Inválido
              </button>
            </div>
          </div>
        )}

        {/* KDS CONFITERÍA */}
        {activeTab === 'kds' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-xl font-bold text-white">Barra Express KDS</h2>
                <p className="text-xs text-zinc-400">Entrega de confitería mediante código de voucher.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CONF-XXXX"
                  value={kdsCode}
                  onChange={(e) => setKdsCode(e.target.value.toUpperCase())}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase"
                />
                <button
                  onClick={() => handleDispatchVoucher(kdsCode)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Despachar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vouchers.map((v) => (
                <div key={v.code} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xl font-black text-amber-400">{v.code}</span>
                    <span className="text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{v.showtimeTime}</span>
                  </div>
                  <ul className="text-xs space-y-1">
                    {v.items.map((it, idx) => (
                      <li key={idx} className="text-zinc-300">
                        {it.quantity}x {it.name}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-xs">
                    <span className="text-zinc-400">{v.status === 'pending' ? 'Pendiente' : 'Entregado'}</span>
                    {v.status === 'pending' && (
                      <button
                        onClick={() => handleDispatchVoucher(v.code)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg"
                      >
                        Entregar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER CORPORATIVO CON TÉRMINOS Y PRIVACIDAD */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-6 px-4 text-xs text-zinc-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>CineMax Entertainment Group S.A.S. &bull; NIT 900.824.110-1</div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-zinc-300 underline">
              Términos de Servicio
            </button>
            <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-zinc-300 underline">
              Política de Privacidad y Habeas Data
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL TÉRMINOS DE SERVICIO */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-xs text-zinc-300 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-white text-sm">Términos de Servicio CineMax</h3>
              </div>
              <button onClick={() => setIsTermsModalOpen(false)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-3 leading-relaxed">
              <h4 className="font-bold text-white">1. Límites de Compra por Función</h4>
              <p>Cada usuario podrá seleccionar y adquirir entre 1 y un máximo de 6 boletos por función cinematográfica.</p>
              <h4 className="font-bold text-white">2. Retención Temporal de 10 Minutos</h4>
              <p>Las butacas seleccionadas se reservan temporalmente por un lapso estricto de 10 minutos. Si la orden no se autoriza en dicho periodo, retornan de inmediato a disponibilidad pública.</p>
              <h4 className="font-bold text-white">3. Validación y Control de Reingreso</h4>
              <p>Cada boleto digital contiene un código QR firmado criptográficamente. Al ingresar por portería pasa a estado 'Usado', denegándose cualquier reingreso con el mismo código.</p>
            </div>
            <div className="pt-3 border-t border-zinc-800 text-right">
              <button onClick={() => setIsTermsModalOpen(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2 rounded-xl">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HABEAS DATA */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-xs text-zinc-300 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Política de Privacidad y Habeas Data</h3>
              </div>
              <button onClick={() => setIsPrivacyModalOpen(false)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-3 leading-relaxed">
              <h4 className="font-bold text-white">1. Recolección de Datos Personales</h4>
              <p>CineMax Entertainment Group recopila nombre, documento, correo y teléfono exclusivamente para la emisión legal de boletas y control de accesos.</p>
              <h4 className="font-bold text-white">2. Protección de Datos Sensibles (RUD)</h4>
              <p>Los datos médicos y números de Registro Único de Discapacidad suministrados para la habilitación de butacas de accesibilidad preferencial se tratan con reserva y confidencialidad absoluta.</p>
            </div>
            <div className="pt-3 border-t border-zinc-800 text-right">
              <button onClick={() => setIsPrivacyModalOpen(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2 rounded-xl">
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN PELÍCULA (SALA + HORARIOS) */}
      {isMovieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-white text-sm">{editingMovieId ? 'Editar Película' : 'Nueva Película'}</h3>
              <button onClick={() => setIsMovieModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMovie} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Título:</label>
                <input
                  type="text"
                  required
                  value={adminTitle}
                  onChange={(e) => setAdminTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Sala Asignada:</label>
                  <select
                    value={adminRoom}
                    onChange={(e) => setAdminRoom(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Sala 1 IMAX Láser">Sala 1 IMAX Láser</option>
                    <option value="Sala 2 MacroXE">Sala 2 MacroXE</option>
                    <option value="Sala 3 RealD 3D">Sala 3 RealD 3D</option>
                    <option value="Sala VIP Premier">Sala VIP Premier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Tarifa Base COP:</label>
                  <input
                    type="number"
                    value={adminPrice}
                    onChange={(e) => setAdminPrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Horarios (separados por coma):</label>
                <input
                  type="text"
                  placeholder="10:30 AM, 03:00 PM, 07:30 PM"
                  value={adminTimes}
                  onChange={(e) => setAdminTimes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Sinopsis:</label>
                <textarea
                  rows={2}
                  value={adminSynopsis}
                  onChange={(e) => setAdminSynopsis(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Género:</label>
                  <input
                    type="text"
                    value={adminGenre}
                    onChange={(e) => setAdminGenre(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Duración:</label>
                  <input
                    type="text"
                    value={adminDuration}
                    onChange={(e) => setAdminDuration(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">URL Póster:</label>
                <input
                  type="text"
                  value={adminPoster}
                  onChange={(e) => setAdminPoster(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-[11px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button type="button" onClick={() => setIsMovieModalOpen(false)} className="px-4 py-2 rounded-lg text-zinc-400">
                  Cancelar
                </button>
                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 rounded-lg">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WIDGET CREDENCIALES DE PRUEBA */}
      <div className="fixed bottom-4 left-4 z-50">
        {isDemoWidgetOpen && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl mb-2 w-72 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800 font-bold text-white">
              <span>Cuentas de Acceso Rápido</span>
              <button onClick={() => setIsDemoWidgetOpen(false)}>
                <X className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  setCurrentUser(acc);
                  setIsDemoWidgetOpen(false);
                  if (acc.role === 'admin') setActiveTab('admin');
                  else if (acc.role === 'gatekeeper') setActiveTab('gatekeeper');
                  else if (acc.role === 'confectionery') setActiveTab('kds');
                  else setActiveTab('client');
                }}
                className="w-full text-left p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] block transition-colors"
              >
                <div className="font-bold text-white">{acc.fullName}</div>
                <div className="text-zinc-500 font-mono">
                  {acc.email} ({acc.role})
                </div>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setIsDemoWidgetOpen(!isDemoWidgetOpen)}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-mono font-bold shadow-xl backdrop-blur-md"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span>Credenciales</span>
        </button>
      </div>

      {/* MODAL AUTH */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div className="flex gap-3 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`pb-1 border-b-2 ${authMode === 'login' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400'}`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`pb-1 border-b-2 ${authMode === 'register' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400'}`}
                >
                  Registrarse
                </button>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {authMode === 'login' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const found = users.find(
                    (u) => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword
                  );
                  if (found) {
                    setCurrentUser(found);
                    setIsAuthModalOpen(false);
                    if (purchaseStep === 'confectionery' || purchaseStep === 'seats') setPurchaseStep('checkout');
                  } else {
                    alert('Credenciales inválidas. Usa el botón de Credenciales abajo a la izquierda para autocompletar.');
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-zinc-400 mb-1">Correo:</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="cliente@cinemax.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Contraseña:</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="123"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl">
                  Ingresar
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!regAcceptTerms) {
                    alert('Debes aceptar los Términos y la Política de Datos.');
                    return;
                  }
                  const newUser: UserProfile = {
                    id: 'USR-' + Math.random().toString(36).substring(2, 7),
                    fullName: regName,
                    email: regEmail,
                    password: regPassword,
                    phone: regPhone,
                    documentNumber: regDoc,
                    hasMobilityImpairment: regHasMobility,
                    rudNumber: regHasMobility ? regRud : undefined,
                    isRudVerified: regHasMobility && regRud.trim().length > 3,
                    role: 'customer',
                  };
                  const nextUsers = [newUser, ...users];
                  setUsers(nextUsers);
                  setCurrentUser(newUser);
                  setIsAuthModalOpen(false);
                  if (purchaseStep === 'confectionery' || purchaseStep === 'seats') setPurchaseStep('checkout');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-zinc-400 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1">Correo:</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Contraseña:</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={regHasMobility}
                      onChange={(e) => setRegHasMobility(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600"
                    />
                    <span>Requiere ubicación de accesibilidad (RUD)</span>
                  </label>
                  {regHasMobility && (
                    <input
                      type="text"
                      placeholder="Número RUD / Carné"
                      value={regRud}
                      onChange={(e) => setRegRud(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 mt-2 text-white uppercase font-mono"
                    />
                  )}
                </div>
                <label className="flex items-start gap-2 cursor-pointer text-zinc-400 text-[11px] pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={regAcceptTerms}
                    onChange={(e) => setRegAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 shrink-0"
                  />
                  <span>
                    Acepto los{' '}
                    <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-white underline">
                      Términos de Servicio
                    </button>{' '}
                    y la{' '}
                    <button type="button" onClick={() => setIsPrivacyModalOpen(true)} className="text-white underline">
                      Política de Privacidad
                    </button>
                    .
                  </span>
                </label>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl">
                  Registrarme y Continuar
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CineMaxApp />
    </ErrorBoundary>
  );
}