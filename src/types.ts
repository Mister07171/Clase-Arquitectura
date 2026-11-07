export type SeatStatus = 'available' | 'reserved' | 'sold';

export type UserRole = 'customer' | 'admin' | 'gatekeeper' | 'confectionery';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  employeeBadgeId?: string;
  avatar?: string;
}

export interface AccessibilityVerification {
  isVerified: boolean;
  documentType: 'CC' | 'CE' | 'PASSPORT';
  documentNumber: string;
  rudNumber: string; // Registro Único de Discapacidad / Carné Médico
  holderName: string;
  verifiedAt?: number;
}

export interface Seat {
  id: string; // e.g., 'A1'
  row: string; // 'A'
  col: number; // 1
  status: SeatStatus;
  isAccessible: boolean; // Discapacitados / Movilidad reducida
  lockedBySessionId?: string;
  lockedAt?: number; // timestamp
}

export interface Showtime {
  id: string;
  movieId: string;
  movieTitle: string;
  posterUrl: string;
  roomName: string;
  roomCapacity: number;
  date: string;
  time: string; // e.g., "10:30 AM" or "15:45 PM"
  hour24: number; // 10.5, 15.75 for easy comparison
  genre: string;
  duration: string;
  classification: string;
  basePrice: number; // e.g., 20000 COP
  seats: Record<string, Seat>;
}

export interface ConfectioneryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: 'combos' | 'snacks' | 'bebidas';
}

export interface TicketPayload {
  ticketId: string;
  showtimeId: string;
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

export interface ConfectioneryOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ConfectioneryVoucher {
  code: string; // e.g., "CONF-8492"
  orderId: string;
  showtimeId: string;
  movieTitle: string;
  showtimeTime: string;
  items: ConfectioneryOrderItem[];
  status: 'pending' | 'preparing' | 'dispatched';
  dispatchedAt?: number;
}

export interface Order {
  id: string;
  idempotencyKey: string;
  sessionId: string;
  customerEmail: string;
  customerName: string;
  showtimeId: string;
  movieTitle: string;
  seatIds: string[];
  pricingDetails: {
    basePrice: number;
    finalPricePerTicket: number;
    discountPerTicket: number;
    strategyName: string;
    subtotalTickets: number;
  };
  confectioneryItems: ConfectioneryOrderItem[];
  subtotalConfectionery: number;
  totalAmount: number;
  status: 'paid' | 'failed';
  createdAt: number;
  ticketIds: string[];
  voucherCode?: string;
}

export interface TransactionalEmail {
  id: string;
  orderId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  sentAt: number;
  order: Order;
  tickets: TicketRecord[];
  voucher?: ConfectioneryVoucher;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  eventType:
    | 'TICKET_LOCKED'
    | 'TICKET_RELEASED'
    | 'TICKET_PURCHASED'
    | 'TICKET_VALIDATED'
    | 'TICKET_REJECTED'
    | 'STOCK_DEDUCTED'
    | 'VOUCHER_DISPATCHED'
    | 'SHOWTIME_CREATED'
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'ACCESSIBILITY_VERIFIED';
  userId: string;
  ipAddress: string;
  showtimeId?: string;
  seatId?: string;
  details: string;
  previousState?: string;
  newState?: string;
}

export type ActiveTab = 'b2c' | 'gate' | 'kds' | 'admin' | 'email_inbox' | 'architecture';
