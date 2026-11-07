import {
  Showtime,
  ConfectioneryItem,
  TicketRecord,
  ConfectioneryVoucher,
  Order,
  AuditLogEntry,
  TransactionalEmail,
  UserSession,
  Seat,
} from '../types';
import { INITIAL_SHOWTIMES, INITIAL_CONFECTIONERY, createInitialSeats } from './initialData';

export const CORPORATE_USERS: UserSession[] = [
  {
    id: 'USR-ADM-01',
    email: 'admin@cinemax.com',
    fullName: 'Dirección de Operaciones & Salas',
    role: 'admin',
    employeeBadgeId: 'EMP-ADM-901',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'USR-SEC-02',
    email: 'porteria@cinemax.com',
    fullName: 'Jefatura de Acceso & Portería',
    role: 'gatekeeper',
    employeeBadgeId: 'EMP-SEC-104',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'USR-BAR-03',
    email: 'confiteria@cinemax.com',
    fullName: 'Supervisor Barra Express Cinema',
    role: 'confectionery',
    employeeBadgeId: 'EMP-BAR-202',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
];

const DB_KEYS = {
  SHOWTIMES: 'cinemax_db_showtimes_v2',
  CONFECTIONERY: 'cinemax_db_confectionery_v2',
  TICKETS: 'cinemax_db_tickets_v2',
  VOUCHERS: 'cinemax_db_vouchers_v2',
  ORDERS: 'cinemax_db_orders_v2',
  AUDIT: 'cinemax_db_audit_v2',
  EMAILS: 'cinemax_db_emails_v2',
  CURRENT_USER: 'cinemax_db_current_user_v2',
};

/**
 * MockDatabaseService: Desacoplada e implementada como capa de acceso a datos (DAO).
 * Diseñada para reemplazo transparente con SDKs como Supabase, Firebase Firestore o REST APIs.
 */
class MockDatabaseService {
  // --- USERS & AUTH ---
  public getCurrentUser(): UserSession {
    const saved = localStorage.getItem(DB_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      id: 'GUEST-CLIENT',
      email: 'cliente@cinemax.com',
      fullName: 'Cliente Invitado',
      role: 'customer',
    };
  }

  public setCurrentUser(user: UserSession): void {
    localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  public clearCurrentUser(): void {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
  }

  // --- SHOWTIMES ---
  public getShowtimes(): Showtime[] {
    const data = localStorage.getItem(DB_KEYS.SHOWTIMES);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    this.saveShowtimes(INITIAL_SHOWTIMES);
    return INITIAL_SHOWTIMES;
  }

  public saveShowtimes(showtimes: Showtime[]): void {
    localStorage.setItem(DB_KEYS.SHOWTIMES, JSON.stringify(showtimes));
  }

  public addShowtime(showtimeData: Omit<Showtime, 'id' | 'seats'>): Showtime {
    const showtimes = this.getShowtimes();
    const newId = 'SH-' + Math.floor(100 + Math.random() * 900);
    const newShowtime: Showtime = {
      ...showtimeData,
      id: newId,
      seats: createInitialSeats(),
    };
    showtimes.unshift(newShowtime);
    this.saveShowtimes(showtimes);
    return newShowtime;
  }

  public updateShowtimePrice(showtimeId: string, basePrice: number): void {
    const showtimes = this.getShowtimes();
    const updated = showtimes.map((st) => (st.id === showtimeId ? { ...st, basePrice } : st));
    this.saveShowtimes(updated);
  }

  // --- CONFECTIONERY & INVENTORY ---
  public getConfectionery(): ConfectioneryItem[] {
    const data = localStorage.getItem(DB_KEYS.CONFECTIONERY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    this.saveConfectionery(INITIAL_CONFECTIONERY);
    return INITIAL_CONFECTIONERY;
  }

  public saveConfectionery(items: ConfectioneryItem[]): void {
    localStorage.setItem(DB_KEYS.CONFECTIONERY, JSON.stringify(items));
  }

  public updateConfectioneryStock(itemId: string, newStock: number): void {
    const items = this.getConfectionery();
    const updated = items.map((it) => (it.id === itemId ? { ...it, stock: Math.max(0, newStock) } : it));
    this.saveConfectionery(updated);
  }

  public deductConfectioneryStock(orderItems: { itemId: string; quantity: number }[]): void {
    const items = this.getConfectionery();
    const updated = items.map((it) => {
      const match = orderItems.find((o) => o.itemId === it.id);
      if (match) {
        return { ...it, stock: Math.max(0, it.stock - match.quantity) };
      }
      return it;
    });
    this.saveConfectionery(updated);
  }

  // --- TICKETS ---
  public getTickets(): TicketRecord[] {
    const data = localStorage.getItem(DB_KEYS.TICKETS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  }

  public saveTickets(tickets: TicketRecord[]): void {
    localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
  }

  public addTickets(newTickets: TicketRecord[]): void {
    const tickets = this.getTickets();
    this.saveTickets([...newTickets, ...tickets]);
  }

  public markTicketUsed(ticketId: string, usedAt: number, validator: string): TicketRecord | null {
    const tickets = this.getTickets();
    let updatedRecord: TicketRecord | null = null;
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        updatedRecord = {
          ...t,
          status: 'used' as const,
          usedAt,
          validatedBy: validator,
        };
        return updatedRecord;
      }
      return t;
    });
    this.saveTickets(updated);
    return updatedRecord;
  }

  // --- VOUCHERS ---
  public getVouchers(): ConfectioneryVoucher[] {
    const data = localStorage.getItem(DB_KEYS.VOUCHERS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  }

  public saveVouchers(vouchers: ConfectioneryVoucher[]): void {
    localStorage.setItem(DB_KEYS.VOUCHERS, JSON.stringify(vouchers));
  }

  public addVoucher(voucher: ConfectioneryVoucher): void {
    const vouchers = this.getVouchers();
    this.saveVouchers([voucher, ...vouchers]);
  }

  public markVoucherDispatched(code: string, dispatchedAt: number): ConfectioneryVoucher | null {
    const vouchers = this.getVouchers();
    let updatedVoucher: ConfectioneryVoucher | null = null;
    const updated = vouchers.map((v) => {
      if (v.code === code) {
        updatedVoucher = {
          ...v,
          status: 'dispatched' as const,
          dispatchedAt,
        };
        return updatedVoucher;
      }
      return v;
    });
    this.saveVouchers(updated);
    return updatedVoucher;
  }

  // --- ORDERS ---
  public getOrders(): Order[] {
    const data = localStorage.getItem(DB_KEYS.ORDERS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  }

  public saveOrders(orders: Order[]): void {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  }

  public addOrder(order: Order): void {
    const orders = this.getOrders();
    this.saveOrders([order, ...orders]);
  }

  // --- TRANSACTIONAL EMAILS ---
  public getEmails(): TransactionalEmail[] {
    const data = localStorage.getItem(DB_KEYS.EMAILS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  }

  public saveEmails(emails: TransactionalEmail[]): void {
    localStorage.setItem(DB_KEYS.EMAILS, JSON.stringify(emails));
  }

  public addEmail(email: TransactionalEmail): void {
    const emails = this.getEmails();
    this.saveEmails([email, ...emails]);
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLogEntry[] {
    const data = localStorage.getItem(DB_KEYS.AUDIT);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'LOG-SYS-01',
        timestamp: Date.now() - 3600000,
        eventType: 'SHOWTIME_CREATED',
        userId: 'SYSTEM_BOOT',
        ipAddress: '10.0.0.1',
        details: 'CineMax Entertainment Group Core Engine inicializado. Motor de tarifas y HMAC activos.',
      },
    ];
  }

  public saveAuditLogs(logs: AuditLogEntry[]): void {
    localStorage.setItem(DB_KEYS.AUDIT, JSON.stringify(logs));
  }

  public addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress'>): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: 'LOG-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: Date.now(),
      ipAddress: '192.168.1.50',
    };
    this.saveAuditLogs([newEntry, ...logs.slice(0, 199)]);
  }

  public clearAuditLogs(): void {
    localStorage.removeItem(DB_KEYS.AUDIT);
  }
}

export const mockDatabaseService = new MockDatabaseService();
