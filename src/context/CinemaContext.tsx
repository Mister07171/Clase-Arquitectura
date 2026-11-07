import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Showtime,
  ConfectioneryItem,
  TicketRecord,
  ConfectioneryVoucher,
  Order,
  AuditLogEntry,
  ConfectioneryOrderItem,
  Seat,
  UserSession,
  AccessibilityVerification,
  TransactionalEmail,
} from '../types';
import { mockDatabaseService, CORPORATE_USERS } from '../services/mockDatabaseService';
import { pricingEngine } from '../services/pricingStrategy';
import { signTicket, verifyTicketSignature, generateQrDataUrl } from '../services/crypto';

interface ActiveReservation {
  showtimeId: string | null;
  selectedSeatIds: string[];
  expiresAt: number | null; // Timestamp ms
  durationSeconds: number; // 600 (10 min) or 60 (1 min for quick demo)
}

interface ValidationResult {
  status: 'idle' | 'success' | 'already_used' | 'invalid';
  ticket?: TicketRecord;
  message: string;
  timestamp: number;
  reason?: string;
}

interface CinemaContextType {
  // Auth & RBAC
  currentUser: UserSession;
  login: (user: UserSession) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;

  // Showtimes & Movies
  showtimes: Showtime[];
  selectedShowtime: Showtime | null;
  setSelectedShowtimeId: (id: string | null) => void;
  createShowtime: (newShowtime: Omit<Showtime, 'id' | 'seats'>) => void;
  updateShowtimeBasePrice: (showtimeId: string, newBasePrice: number) => void;

  // Reservation & Seat Locking
  activeReservation: ActiveReservation;
  remainingSeconds: number;
  isExpiringSoon: boolean;
  demoFastTimer: boolean;
  setDemoFastTimer: (fast: boolean) => void;
  toggleSeatSelection: (seatId: string) => { success: boolean; requiresAccessibilityModal?: boolean; message?: string };
  cancelActiveReservation: () => void;

  // Accessibility Verification (RUD / Carné)
  accessibilityVerification: AccessibilityVerification | null;
  verifyAccessibility: (data: AccessibilityVerification) => void;
  isAccessibilityModalOpen: boolean;
  setIsAccessibilityModalOpen: (open: boolean) => void;
  pendingAccessibleSeatId: string | null;

  // Confectionery & Stock
  confectionery: ConfectioneryItem[];
  cartConfectionery: Record<string, number>; // itemId -> quantity
  updateCartConfectionery: (itemId: string, delta: number) => void;
  updateConfectioneryStock: (itemId: string, newStock: number) => void;
  clearCartConfectionery: () => void;

  // Checkout & Payment
  isProcessingPayment: boolean;
  idempotencyKey: string;
  regenerateIdempotencyKey: () => void;
  processCheckout: (
    customerEmail?: string,
    customerName?: string,
    simulateFailure?: boolean
  ) => Promise<{ success: boolean; order?: Order; email?: TransactionalEmail; error?: string }>;
  completedOrder: Order | null;
  resetCheckoutFlow: () => void;

  // Transactional Emails
  emails: TransactionalEmail[];
  latestEmail: TransactionalEmail | null;
  isEmailModalOpen: boolean;
  setIsEmailModalOpen: (open: boolean) => void;

  // Tickets & Portería
  tickets: TicketRecord[];
  offlineMode: boolean;
  setOfflineMode: (enabled: boolean) => void;
  validationResult: ValidationResult | null;
  validateTicketByCodeOrPayload: (input: string) => Promise<ValidationResult>;
  resetValidationResult: () => void;
  testScanSuccess: () => Promise<void>;
  testScanDuplicate: () => Promise<void>;
  testScanTampered: () => Promise<void>;

  // KDS & Vouchers
  vouchers: ConfectioneryVoucher[];
  kdsFilter: 'all' | 'pending' | 'dispatched';
  setKdsFilter: (filter: 'all' | 'pending' | 'dispatched') => void;
  dispatchVoucher: (code: string) => { success: boolean; message: string; voucher?: ConfectioneryVoucher };

  // Audit Logs & Architecture
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress'>) => void;
  clearAuditLogs: () => void;
  simulateRaceCondition: () => { winner: string; loser: string; seatId: string };

  // Client Session
  sessionId: string;
}

const CinemaContext = createContext<CinemaContextType | null>(null);

export const CinemaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session ID for current user browser thread
  const [sessionId] = useState(() => 'ses_' + Math.random().toString(36).substring(2, 9));
  const userIp = '190.84.112.45';

  // State: Current Authenticated User (RBAC)
  const [currentUser, setCurrentUser] = useState<UserSession>(() => mockDatabaseService.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // State: Showtimes
  const [showtimes, setShowtimes] = useState<Showtime[]>(() => mockDatabaseService.getShowtimes());

  // State: Confectionery
  const [confectionery, setConfectionery] = useState<ConfectioneryItem[]>(() => mockDatabaseService.getConfectionery());

  // State: Tickets
  const [tickets, setTickets] = useState<TicketRecord[]>(() => mockDatabaseService.getTickets());

  // State: Vouchers
  const [vouchers, setVouchers] = useState<ConfectioneryVoucher[]>(() => mockDatabaseService.getVouchers());

  // State: Orders
  const [orders, setOrders] = useState<Order[]>(() => mockDatabaseService.getOrders());

  // State: Transactional Emails
  const [emails, setEmails] = useState<TransactionalEmail[]>(() => mockDatabaseService.getEmails());
  const [latestEmail, setLatestEmail] = useState<TransactionalEmail | null>(() => {
    const list = mockDatabaseService.getEmails();
    return list.length > 0 ? list[0] : null;
  });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  // State: Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => mockDatabaseService.getAuditLogs());

  // Active user selection state
  const [selectedShowtimeId, setSelectedShowtimeIdState] = useState<string | null>(showtimes[0]?.id || null);
  const selectedShowtime = useMemo(
    () => showtimes.find((st) => st.id === selectedShowtimeId) || null,
    [showtimes, selectedShowtimeId]
  );

  // Demo speed: 10 min vs 1 min
  const [demoFastTimer, setDemoFastTimer] = useState<boolean>(false);

  // Active reservation
  const [activeReservation, setActiveReservation] = useState<ActiveReservation>({
    showtimeId: null,
    selectedSeatIds: [],
    expiresAt: null,
    durationSeconds: 600,
  });

  // Accessibility Verification Modal & State
  const [accessibilityVerification, setAccessibilityVerification] = useState<AccessibilityVerification | null>(null);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState<boolean>(false);
  const [pendingAccessibleSeatId, setPendingAccessibleSeatId] = useState<string | null>(null);

  // Cart Confectionery items
  const [cartConfectionery, setCartConfectionery] = useState<Record<string, number>>({});

  // Idempotency Key
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => 'idem_cmx_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now()
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Portería validation
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // KDS filter
  const [kdsFilter, setKdsFilter] = useState<'all' | 'pending' | 'dispatched'>('all');

  // Helper to add audit log entries
  const addAuditLog = useCallback(
    (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress'>) => {
      mockDatabaseService.addAuditLog(entry);
      setAuditLogs(mockDatabaseService.getAuditLogs());
    },
    []
  );

  // AUTH RBAC Handlers
  const login = useCallback(
    (user: UserSession) => {
      mockDatabaseService.setCurrentUser(user);
      setCurrentUser(user);
      addAuditLog({
        eventType: 'USER_LOGIN',
        userId: user.email,
        details: `Inicio de sesión exitoso. Rol corporativo asignado: ${user.role} (${user.fullName})`,
      });
    },
    [addAuditLog]
  );

  const logout = useCallback(() => {
    mockDatabaseService.clearCurrentUser();
    const guest: UserSession = {
      id: 'GUEST-CLIENT',
      email: 'cliente@cinemax.com',
      fullName: 'Cliente Invitado',
      role: 'customer',
    };
    setCurrentUser(guest);
    addAuditLog({
      eventType: 'USER_LOGOUT',
      userId: currentUser.email,
      details: 'Cierre de sesión de funcionario. Retorno al portal público de clientes.',
    });
  }, [currentUser, addAuditLog]);

  // Accessibility Verification Handler
  const verifyAccessibility = useCallback(
    (data: AccessibilityVerification) => {
      setAccessibilityVerification(data);
      setIsAccessibilityModalOpen(false);

      addAuditLog({
        eventType: 'ACCESSIBILITY_VERIFIED',
        userId: sessionId,
        details: `Verificación exitosa de movilidad reducida. Titular: ${data.holderName}, Doc: ${data.documentType}-${data.documentNumber}, RUD: ${data.rudNumber}`,
      });

      // If there was a pending seat that initiated the modal, select it now!
      if (pendingAccessibleSeatId && selectedShowtime) {
        const seatId = pendingAccessibleSeatId;
        const duration = demoFastTimer ? 60 : 600;
        const expiresAt = activeReservation.expiresAt || Date.now() + duration * 1000;

        setShowtimes((prev) => {
          const updated = prev.map((st) => {
            if (st.id !== selectedShowtime.id) return st;
            return {
              ...st,
              seats: {
                ...st.seats,
                [seatId]: {
                  ...st.seats[seatId],
                  status: 'reserved' as const,
                  lockedBySessionId: sessionId,
                  lockedAt: Date.now(),
                },
              },
            };
          });
          mockDatabaseService.saveShowtimes(updated);
          return updated;
        });

        setActiveReservation((prev) => ({
          ...prev,
          showtimeId: selectedShowtime.id,
          selectedSeatIds: [...prev.selectedSeatIds, seatId],
          expiresAt,
          durationSeconds: duration,
        }));

        setPendingAccessibleSeatId(null);
      }
    },
    [sessionId, pendingAccessibleSeatId, selectedShowtime, demoFastTimer, activeReservation, addAuditLog]
  );

  // Timer Calculation
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!activeReservation.expiresAt) return 0;
    return Math.max(0, Math.ceil((activeReservation.expiresAt - currentTime) / 1000));
  }, [activeReservation.expiresAt, currentTime]);

  const isExpiringSoon = useMemo(() => {
    return activeReservation.selectedSeatIds.length > 0 && remainingSeconds > 0 && remainingSeconds <= 60;
  }, [activeReservation.selectedSeatIds.length, remainingSeconds]);

  // CRON JOB / WORKER AUDITOR SIMULATION (RF-05, RNF-03)
  useEffect(() => {
    if (activeReservation.expiresAt && currentTime >= activeReservation.expiresAt) {
      const expiredShowtimeId = activeReservation.showtimeId;
      const expiredSeats = [...activeReservation.selectedSeatIds];

      if (expiredShowtimeId && expiredSeats.length > 0) {
        setShowtimes((prev) => {
          const updated = prev.map((st) => {
            if (st.id !== expiredShowtimeId) return st;
            const updatedSeats = { ...st.seats };
            expiredSeats.forEach((seatId) => {
              if (updatedSeats[seatId] && updatedSeats[seatId].status === 'reserved') {
                updatedSeats[seatId] = {
                  ...updatedSeats[seatId],
                  status: 'available' as const,
                  lockedBySessionId: undefined,
                  lockedAt: undefined,
                };
              }
            });
            return { ...st, seats: updatedSeats };
          });
          mockDatabaseService.saveShowtimes(updated);
          return updated;
        });

        expiredSeats.forEach((seatId) => {
          addAuditLog({
            eventType: 'TICKET_RELEASED',
            userId: 'CRON_JOB_AUDITOR',
            showtimeId: expiredShowtimeId,
            seatId,
            details: `Worker de concurrencia liberó automáticamente la butaca ${seatId} por inactividad de compra.`,
            previousState: 'reserved',
            newState: 'available',
          });
        });

        setActiveReservation({
          showtimeId: null,
          selectedSeatIds: [],
          expiresAt: null,
          durationSeconds: demoFastTimer ? 60 : 600,
        });

        alert('Tu tiempo de retención ha expirado. Las butacas seleccionadas han retornado al estado disponible.');
      }
    }
  }, [currentTime, activeReservation, addAuditLog, demoFastTimer]);

  // Showtime selection
  const setSelectedShowtimeId = useCallback(
    (id: string | null) => {
      if (activeReservation.showtimeId && activeReservation.showtimeId !== id && activeReservation.selectedSeatIds.length > 0) {
        const confirmSwitch = window.confirm(
          'Tienes butacas retenidas en otra función. ¿Deseas liberarlas para cambiar de función?'
        );
        if (!confirmSwitch) return;

        const prevShowtimeId = activeReservation.showtimeId;
        const seatsToRelease = activeReservation.selectedSeatIds;
        setShowtimes((prev) => {
          const updated = prev.map((st) => {
            if (st.id !== prevShowtimeId) return st;
            const updatedSeats = { ...st.seats };
            seatsToRelease.forEach((sid) => {
              if (updatedSeats[sid] && updatedSeats[sid].status === 'reserved') {
                updatedSeats[sid] = { ...updatedSeats[sid], status: 'available' as const, lockedBySessionId: undefined };
              }
            });
            return { ...st, seats: updatedSeats };
          });
          mockDatabaseService.saveShowtimes(updated);
          return updated;
        });

        setActiveReservation({
          showtimeId: null,
          selectedSeatIds: [],
          expiresAt: null,
          durationSeconds: demoFastTimer ? 60 : 600,
        });
      }
      setSelectedShowtimeIdState(id);
    },
    [activeReservation, demoFastTimer]
  );

  // Toggle seat selection with all business rules
  const toggleSeatSelection = useCallback(
    (seatId: string): { success: boolean; requiresAccessibilityModal?: boolean; message?: string } => {
      if (!selectedShowtime) {
        return { success: false, message: 'Selecciona una función de la cartelera primero.' };
      }

      const seat = selectedShowtime.seats[seatId];
      if (!seat) {
        return { success: false, message: 'Butaca no encontrada.' };
      }

      const isCurrentlySelected = activeReservation.selectedSeatIds.includes(seatId);

      // Deselecting seat
      if (isCurrentlySelected) {
        const nextSelected = activeReservation.selectedSeatIds.filter((id) => id !== seatId);

        setShowtimes((prev) => {
          const updated = prev.map((st) => {
            if (st.id !== selectedShowtime.id) return st;
            return {
              ...st,
              seats: {
                ...st.seats,
                [seatId]: {
                  ...st.seats[seatId],
                  status: 'available' as const,
                  lockedBySessionId: undefined,
                  lockedAt: undefined,
                },
              },
            };
          });
          mockDatabaseService.saveShowtimes(updated);
          return updated;
        });

        addAuditLog({
          eventType: 'TICKET_RELEASED',
          userId: sessionId,
          showtimeId: selectedShowtime.id,
          seatId,
          details: `Cliente liberó voluntariamente la butaca ${seatId}`,
          previousState: 'reserved',
          newState: 'available',
        });

        setActiveReservation((prev) => ({
          ...prev,
          selectedSeatIds: nextSelected,
          expiresAt: nextSelected.length === 0 ? null : prev.expiresAt,
        }));

        return { success: true };
      }

      // Max 6 seats limit
      if (activeReservation.selectedSeatIds.length >= 6) {
        return {
          success: false,
          message: 'Límite alcanzado: Máximo 6 boletos por transacción según políticas de CineMax.',
        };
      }

      // Formal Accessibility Verification Modal requirement (Point 3)
      if (seat.isAccessible && (!accessibilityVerification || !accessibilityVerification.isVerified)) {
        setPendingAccessibleSeatId(seatId);
        setIsAccessibilityModalOpen(true);
        return {
          success: false,
          requiresAccessibilityModal: true,
          message: 'Esta butaca requiere verificación oficial de Registro Único de Discapacidad (RUD).',
        };
      }

      // Concurrency check
      if (seat.status === 'sold') {
        return { success: false, message: 'Esta butaca ya fue adquirida.' };
      }
      if (seat.status === 'reserved' && seat.lockedBySessionId !== sessionId) {
        return { success: false, message: 'Esta butaca se encuentra retenida temporalmente por otro cliente.' };
      }

      // Lock the seat
      const duration = demoFastTimer ? 60 : 600;
      const expiresAt = activeReservation.expiresAt || Date.now() + duration * 1000;

      setShowtimes((prev) => {
        const updated = prev.map((st) => {
          if (st.id !== selectedShowtime.id) return st;
          return {
            ...st,
            seats: {
              ...st.seats,
              [seatId]: {
                ...st.seats[seatId],
                status: 'reserved' as const,
                lockedBySessionId: sessionId,
                lockedAt: Date.now(),
              },
            },
          };
        });
        mockDatabaseService.saveShowtimes(updated);
        return updated;
      });

      addAuditLog({
        eventType: 'TICKET_LOCKED',
        userId: sessionId,
        showtimeId: selectedShowtime.id,
        seatId,
        details: `Retención atómica de butaca ${seatId} por ${duration / 60} minutos.`,
        previousState: 'available',
        newState: 'reserved',
      });

      setActiveReservation((prev) => ({
        ...prev,
        showtimeId: selectedShowtime.id,
        selectedSeatIds: [...prev.selectedSeatIds, seatId],
        expiresAt,
        durationSeconds: duration,
      }));

      return { success: true };
    },
    [selectedShowtime, activeReservation, accessibilityVerification, sessionId, demoFastTimer, addAuditLog]
  );

  // Cancel reservation
  const cancelActiveReservation = useCallback(() => {
    if (!activeReservation.showtimeId || activeReservation.selectedSeatIds.length === 0) return;

    const showtimeId = activeReservation.showtimeId;
    const seatsToRelease = [...activeReservation.selectedSeatIds];

    setShowtimes((prev) => {
      const updated = prev.map((st) => {
        if (st.id !== showtimeId) return st;
        const updatedSeats = { ...st.seats };
        seatsToRelease.forEach((sid) => {
          if (updatedSeats[sid] && updatedSeats[sid].status === 'reserved') {
            updatedSeats[sid] = { ...updatedSeats[sid], status: 'available' as const, lockedBySessionId: undefined };
          }
        });
        return { ...st, seats: updatedSeats };
      });
      mockDatabaseService.saveShowtimes(updated);
      return updated;
    });

    seatsToRelease.forEach((sid) => {
      addAuditLog({
        eventType: 'TICKET_RELEASED',
        userId: sessionId,
        showtimeId,
        seatId: sid,
        details: `Cancelación anticipada de retención para butaca ${sid}`,
        previousState: 'reserved',
        newState: 'available',
      });
    });

    setActiveReservation({
      showtimeId: null,
      selectedSeatIds: [],
      expiresAt: null,
      durationSeconds: demoFastTimer ? 60 : 600,
    });
  }, [activeReservation, sessionId, demoFastTimer, addAuditLog]);

  // Confectionery helpers
  const updateCartConfectionery = useCallback((itemId: string, delta: number) => {
    setCartConfectionery((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  }, []);

  const clearCartConfectionery = useCallback(() => {
    setCartConfectionery({});
  }, []);

  const updateConfectioneryStock = useCallback((itemId: string, newStock: number) => {
    mockDatabaseService.updateConfectioneryStock(itemId, newStock);
    setConfectionery(mockDatabaseService.getConfectionery());
  }, []);

  const regenerateIdempotencyKey = useCallback(() => {
    setIdempotencyKey('idem_cmx_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now());
  }, []);

  // Checkout & Payment Simulation with Transactional Email Generation
  const processCheckout = useCallback(
    async (
      customerEmail = 'cliente@cinemax.com',
      customerName = 'Carlos Ramírez',
      simulateFailure = false
    ): Promise<{ success: boolean; order?: Order; email?: TransactionalEmail; error?: string }> => {
      if (!selectedShowtime || activeReservation.selectedSeatIds.length === 0) {
        return { success: false, error: 'No hay butacas seleccionadas.' };
      }

      setIsProcessingPayment(true);
      await new Promise((resolve) => setTimeout(resolve, 380));

      if (simulateFailure) {
        setIsProcessingPayment(false);
        addAuditLog({
          eventType: 'TICKET_REJECTED',
          userId: sessionId,
          showtimeId: selectedShowtime.id,
          details: `Simulación de pago rechazado por pasarela bancaria. El inventario de confitería y las butacas permanecen intactos.`,
        });
        return {
          success: false,
          error: 'Transacción declinada por la entidad financiera. No se realizaron cobros ni descargues de stock.',
        };
      }

      // Calculate pricing using Strategy Pattern
      const pricing = pricingEngine.calculateTicketPrice(selectedShowtime);
      const subtotalTickets = pricing.finalPrice * activeReservation.selectedSeatIds.length;

      // Prepare Confectionery items
      const confectioneryOrderItems: ConfectioneryOrderItem[] = [];
      let subtotalConfectionery = 0;

      Object.entries(cartConfectionery).forEach(([itemId, qty]) => {
        const item = confectionery.find((c) => c.id === itemId);
        if (item && qty > 0) {
          confectioneryOrderItems.push({
            itemId: item.id,
            name: item.name,
            quantity: qty,
            unitPrice: item.price,
          });
          subtotalConfectionery += item.price * qty;
        }
      });

      const totalAmount = subtotalTickets + subtotalConfectionery;
      const orderId = 'CMX-' + Math.floor(100000 + Math.random() * 900000);

      // Deduct confectionery stock ONLY after payment approval
      if (confectioneryOrderItems.length > 0) {
        mockDatabaseService.deductConfectioneryStock(confectioneryOrderItems);
        setConfectionery(mockDatabaseService.getConfectionery());

        addAuditLog({
          eventType: 'STOCK_DEDUCTED',
          userId: sessionId,
          details: `Descargue atómico de existencias de confitería para la orden ${orderId}`,
        });
      }

      // Transition seats to 'sold'
      setShowtimes((prev) => {
        const updated = prev.map((st) => {
          if (st.id !== selectedShowtime.id) return st;
          const updatedSeats = { ...st.seats };
          activeReservation.selectedSeatIds.forEach((sid) => {
            if (updatedSeats[sid]) {
              updatedSeats[sid] = {
                ...updatedSeats[sid],
                status: 'sold',
                lockedBySessionId: undefined,
              };
            }
          });
          return { ...st, seats: updatedSeats };
        });
        mockDatabaseService.saveShowtimes(updated);
        return updated;
      });

      // Generate signed tickets with unique QR codes
      const newTicketRecords: TicketRecord[] = [];
      const ticketIds: string[] = [];

      for (let i = 0; i < activeReservation.selectedSeatIds.length; i++) {
        const seatId = activeReservation.selectedSeatIds[i];
        const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}-${seatId}`;
        ticketIds.push(ticketId);

        const unsignedPayload = {
          ticketId,
          showtimeId: selectedShowtime.id,
          movie: selectedShowtime.movieTitle,
          room: selectedShowtime.roomName,
          seat: seatId,
          showtimeDate: selectedShowtime.date,
          showtimeTime: selectedShowtime.time,
          issuedAt: Math.floor(Date.now() / 1000),
        };

        const signedPayload = signTicket(unsignedPayload);
        const qrDataUrl = await generateQrDataUrl(signedPayload);

        const ticketRecord: TicketRecord = {
          id: ticketId,
          orderId,
          showtimeId: selectedShowtime.id,
          movieTitle: selectedShowtime.movieTitle,
          roomName: selectedShowtime.roomName,
          seatId,
          showtimeDate: selectedShowtime.date,
          showtimeTime: selectedShowtime.time,
          payload: signedPayload,
          qrDataUrl,
          status: 'valid',
        };

        newTicketRecords.push(ticketRecord);

        addAuditLog({
          eventType: 'TICKET_PURCHASED',
          userId: sessionId,
          showtimeId: selectedShowtime.id,
          seatId,
          details: `Emisión de boleto digital ${ticketId} firmado con HMAC-SHA256 para ${selectedShowtime.movieTitle}`,
          previousState: 'reserved',
          newState: 'sold',
        });
      }

      mockDatabaseService.addTickets(newTicketRecords);
      setTickets(mockDatabaseService.getTickets());

      // Generate independent Confectionery Voucher
      let voucherCode: string | undefined = undefined;
      let newVoucher: ConfectioneryVoucher | undefined = undefined;

      if (confectioneryOrderItems.length > 0) {
        voucherCode = 'CONF-' + Math.floor(1000 + Math.random() * 9000);
        newVoucher = {
          code: voucherCode,
          orderId,
          showtimeId: selectedShowtime.id,
          movieTitle: selectedShowtime.movieTitle,
          showtimeTime: selectedShowtime.time,
          items: confectioneryOrderItems,
          status: 'pending',
        };
        mockDatabaseService.addVoucher(newVoucher);
        setVouchers(mockDatabaseService.getVouchers());
      }

      // Store Order
      const newOrder: Order = {
        id: orderId,
        idempotencyKey,
        sessionId,
        customerEmail,
        customerName,
        showtimeId: selectedShowtime.id,
        movieTitle: selectedShowtime.movieTitle,
        seatIds: [...activeReservation.selectedSeatIds],
        pricingDetails: {
          basePrice: selectedShowtime.basePrice,
          finalPricePerTicket: pricing.finalPrice,
          discountPerTicket: pricing.discount,
          strategyName: pricing.strategyName,
          subtotalTickets,
        },
        confectioneryItems: confectioneryOrderItems,
        subtotalConfectionery,
        totalAmount,
        status: 'paid',
        createdAt: Date.now(),
        ticketIds,
        voucherCode,
      };

      mockDatabaseService.addOrder(newOrder);
      setOrders(mockDatabaseService.getOrders());
      setCompletedOrder(newOrder);

      // Generate Transactional Email (Point 4)
      const newEmail: TransactionalEmail = {
        id: 'EML-' + Math.floor(100000 + Math.random() * 900000),
        orderId,
        recipientEmail: customerEmail,
        recipientName: customerName,
        subject: `Confirmación de Boletos y Confitería CineMax - Orden #${orderId}`,
        sentAt: Date.now(),
        order: newOrder,
        tickets: newTicketRecords,
        voucher: newVoucher,
      };

      mockDatabaseService.addEmail(newEmail);
      setEmails(mockDatabaseService.getEmails());
      setLatestEmail(newEmail);

      // Clean up reservation state
      setActiveReservation({
        showtimeId: null,
        selectedSeatIds: [],
        expiresAt: null,
        durationSeconds: demoFastTimer ? 60 : 600,
      });
      setCartConfectionery({});
      setIsProcessingPayment(false);

      return { success: true, order: newOrder, email: newEmail };
    },
    [
      selectedShowtime,
      activeReservation,
      cartConfectionery,
      confectionery,
      idempotencyKey,
      sessionId,
      demoFastTimer,
      addAuditLog,
    ]
  );

  const resetCheckoutFlow = useCallback(() => {
    setCompletedOrder(null);
    regenerateIdempotencyKey();
  }, [regenerateIdempotencyKey]);

  // Portería validation logic (< 500 ms)
  const validateTicketByCodeOrPayload = useCallback(
    async (input: string): Promise<ValidationResult> => {
      const startTime = performance.now();
      const candidateTickets = mockDatabaseService.getTickets();

      let parsedPayload: any = null;
      let ticketRecord: TicketRecord | undefined = undefined;

      try {
        parsedPayload = JSON.parse(input);
        if (parsedPayload.ticketId) {
          ticketRecord = candidateTickets.find((t) => t.id === parsedPayload.ticketId);
        }
      } catch {
        ticketRecord = candidateTickets.find((t) => t.id === input.trim());
        if (ticketRecord) {
          parsedPayload = ticketRecord.payload;
        }
      }

      // Estado Naranja: Boleto Inválido o Inexistente
      if (!ticketRecord || !parsedPayload) {
        const res: ValidationResult = {
          status: 'invalid',
          message: 'BOLETO INVÁLIDO: No registrado en el sistema o formato de código ilegible.',
          timestamp: Date.now(),
          reason: 'Boleto inexistente en la base de datos de CineMax.',
        };
        setValidationResult(res);
        addAuditLog({
          eventType: 'TICKET_REJECTED',
          userId: currentUser.email,
          details: `Acceso denegado: código no registrado (${input.slice(0, 30)})`,
        });
        return res;
      }

      // Check Cryptographic Signature
      const sigCheck = verifyTicketSignature(parsedPayload);
      if (!sigCheck.isValid) {
        const res: ValidationResult = {
          status: 'invalid',
          ticket: ticketRecord,
          message: 'BOLETO INVÁLIDO: Firma criptográfica no coincide (Posible alteración o falsificación).',
          timestamp: Date.now(),
          reason: sigCheck.reason,
        };
        setValidationResult(res);
        addAuditLog({
          eventType: 'TICKET_REJECTED',
          userId: currentUser.email,
          showtimeId: ticketRecord.showtimeId,
          seatId: ticketRecord.seatId,
          details: `Alerta de seguridad: Firma HMAC-SHA256 corrupta para boleto ${ticketRecord.id}`,
        });
        return res;
      }

      // Estado Rojo: Boleto Ya Usado
      if (ticketRecord.status === 'used') {
        const usedDateStr = ticketRecord.usedAt
          ? new Date(ticketRecord.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : 'previamente';
        const res: ValidationResult = {
          status: 'already_used',
          ticket: ticketRecord,
          message: `ACCESO DENEGADO: Este boleto ya fue utilizado a las ${usedDateStr}.`,
          timestamp: Date.now(),
          reason: 'Intento de reingreso no autorizado con boleto redimido.',
        };
        setValidationResult(res);
        addAuditLog({
          eventType: 'TICKET_REJECTED',
          userId: currentUser.email,
          showtimeId: ticketRecord.showtimeId,
          seatId: ticketRecord.seatId,
          details: `Rechazo de reingreso: Boleto ${ticketRecord.id} ya utilizado a las ${usedDateStr}.`,
        });
        return res;
      }

      // Estado Verde: Acceso Concedido
      const usedAt = Date.now();
      const updatedRecord = mockDatabaseService.markTicketUsed(ticketRecord.id, usedAt, currentUser.email);
      setTickets(mockDatabaseService.getTickets());

      const elapsedMs = Math.round(performance.now() - startTime);
      const res: ValidationResult = {
        status: 'success',
        ticket: updatedRecord || ticketRecord,
        message: `ACCESO CONCEDIDO (${elapsedMs} ms)`,
        timestamp: Date.now(),
      };
      setValidationResult(res);

      addAuditLog({
        eventType: 'TICKET_VALIDATED',
        userId: currentUser.email,
        showtimeId: ticketRecord.showtimeId,
        seatId: ticketRecord.seatId,
        details: `Ingreso autorizado en ${elapsedMs}ms para ${ticketRecord.movieTitle} - Butaca ${ticketRecord.seatId}`,
        previousState: 'valid',
        newState: 'used',
      });

      return res;
    },
    [currentUser, addAuditLog]
  );

  const resetValidationResult = useCallback(() => {
    setValidationResult(null);
  }, []);

  // Quick tests for Gatekeeper
  const testScanSuccess = useCallback(async () => {
    let unused = tickets.find((t) => t.status === 'valid');
    if (!unused) {
      const showtime = showtimes[0];
      const seatId = 'B1';
      const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}-${seatId}`;
      const payload = signTicket({
        ticketId,
        showtimeId: showtime.id,
        movie: showtime.movieTitle,
        room: showtime.roomName,
        seat: seatId,
        showtimeDate: showtime.date,
        showtimeTime: showtime.time,
        issuedAt: Math.floor(Date.now() / 1000),
      });
      const qrDataUrl = await generateQrDataUrl(payload);
      const newT: TicketRecord = {
        id: ticketId,
        orderId: 'ORD-CORP',
        showtimeId: showtime.id,
        movieTitle: showtime.movieTitle,
        roomName: showtime.roomName,
        seatId,
        showtimeDate: showtime.date,
        showtimeTime: showtime.time,
        payload,
        qrDataUrl,
        status: 'valid',
      };
      mockDatabaseService.addTickets([newT]);
      setTickets(mockDatabaseService.getTickets());
      unused = newT;
    }
    await validateTicketByCodeOrPayload(JSON.stringify(unused.payload));
  }, [tickets, showtimes, validateTicketByCodeOrPayload]);

  const testScanDuplicate = useCallback(async () => {
    let used = tickets.find((t) => t.status === 'used');
    if (!used) {
      await testScanSuccess();
      return;
    }
    await validateTicketByCodeOrPayload(JSON.stringify(used.payload));
  }, [tickets, testScanSuccess, validateTicketByCodeOrPayload]);

  const testScanTampered = useCallback(async () => {
    const showtime = showtimes[0];
    const forgedPayload = {
      ticketId: 'TKT-FORGED-CORP-999',
      showtimeId: showtime.id,
      movie: showtime.movieTitle,
      room: showtime.roomName,
      seat: 'F8',
      showtimeDate: showtime.date,
      showtimeTime: showtime.time,
      issuedAt: Math.floor(Date.now() / 1000),
      signature: 'bad_signature_tampered_hash_4f9a0c1122334455',
    };
    await validateTicketByCodeOrPayload(JSON.stringify(forgedPayload));
  }, [showtimes, validateTicketByCodeOrPayload]);

  // KDS Dispatching
  const dispatchVoucher = useCallback(
    (code: string): { success: boolean; message: string; voucher?: ConfectioneryVoucher } => {
      const cleanCode = code.trim().toUpperCase();
      const voucher = vouchers.find((v) => v.code === cleanCode);

      if (!voucher) {
        return { success: false, message: 'Voucher no encontrado en el sistema de CineMax.' };
      }

      if (voucher.status === 'dispatched') {
        return {
          success: false,
          message: `Pedido previamente despachado el ${new Date(voucher.dispatchedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          voucher,
        };
      }

      const updated = mockDatabaseService.markVoucherDispatched(cleanCode, Date.now());
      setVouchers(mockDatabaseService.getVouchers());

      addAuditLog({
        eventType: 'VOUCHER_DISPATCHED',
        userId: currentUser.email,
        details: `Entrega física de confitería despachada para voucher ${cleanCode}`,
      });

      return {
        success: true,
        message: '¡Pedido entregado con éxito! Marcado como Despachado.',
        voucher: updated || undefined,
      };
    },
    [vouchers, currentUser, addAuditLog]
  );

  // Admin CRUD
  const createShowtime = useCallback(
    (newShowtimeData: Omit<Showtime, 'id' | 'seats'>) => {
      const created = mockDatabaseService.addShowtime(newShowtimeData);
      setShowtimes(mockDatabaseService.getShowtimes());

      addAuditLog({
        eventType: 'SHOWTIME_CREATED',
        userId: currentUser.email,
        showtimeId: created.id,
        details: `Nueva función registrada: ${created.movieTitle} (${created.roomName} - ${created.time})`,
      });
    },
    [currentUser, addAuditLog]
  );

  const updateShowtimeBasePrice = useCallback((showtimeId: string, newBasePrice: number) => {
    mockDatabaseService.updateShowtimePrice(showtimeId, newBasePrice);
    setShowtimes(mockDatabaseService.getShowtimes());
  }, []);

  const clearAuditLogs = useCallback(() => {
    mockDatabaseService.clearAuditLogs();
    setAuditLogs([]);
  }, []);

  // Concurrency Simulation
  const simulateRaceCondition = useCallback(() => {
    const availableSeat = selectedShowtime
      ? Object.values(selectedShowtime.seats).find((s) => s.status === 'available')
      : null;
    const targetSeatId = availableSeat ? availableSeat.id : 'D5';

    addAuditLog({
      eventType: 'TICKET_LOCKED',
      userId: 'CLIENTE_HILO_1',
      showtimeId: selectedShowtime?.id,
      seatId: targetSeatId,
      details: `[CONCURRENCIA] Solicitud 1 adquirió cerrojo atómico (SELECT FOR UPDATE).`,
      previousState: 'available',
      newState: 'reserved',
    });

    addAuditLog({
      eventType: 'TICKET_REJECTED',
      userId: 'CLIENTE_HILO_2',
      showtimeId: selectedShowtime?.id,
      seatId: targetSeatId,
      details: `[CONCURRENCIA] Solicitud 2 rechazada: Cerrojo en uso (HTTP 409 Conflict). Tasa de sobreventa: 0.00%.`,
    });

    return {
      winner: 'Cliente A (Adquirió Cerrojo en 12ms)',
      loser: 'Cliente B (Rechazado con 409 Conflict en 14ms)',
      seatId: targetSeatId,
    };
  }, [selectedShowtime, addAuditLog]);

  return (
    <CinemaContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        showtimes,
        selectedShowtime,
        setSelectedShowtimeId,
        createShowtime,
        updateShowtimeBasePrice,
        activeReservation,
        remainingSeconds,
        isExpiringSoon,
        demoFastTimer,
        setDemoFastTimer,
        toggleSeatSelection,
        cancelActiveReservation,
        accessibilityVerification,
        verifyAccessibility,
        isAccessibilityModalOpen,
        setIsAccessibilityModalOpen,
        pendingAccessibleSeatId,
        confectionery,
        cartConfectionery,
        updateCartConfectionery,
        updateConfectioneryStock,
        clearCartConfectionery,
        isProcessingPayment,
        idempotencyKey,
        regenerateIdempotencyKey,
        processCheckout,
        completedOrder,
        resetCheckoutFlow,
        emails,
        latestEmail,
        isEmailModalOpen,
        setIsEmailModalOpen,
        tickets,
        offlineMode,
        setOfflineMode,
        validationResult,
        validateTicketByCodeOrPayload,
        resetValidationResult,
        testScanSuccess,
        testScanDuplicate,
        testScanTampered,
        vouchers,
        kdsFilter,
        setKdsFilter,
        dispatchVoucher,
        auditLogs,
        addAuditLog,
        clearAuditLogs,
        simulateRaceCondition,
        sessionId,
      }}
    >
      {children}
    </CinemaContext.Provider>
  );
};

export const useCinema = () => {
  const context = useContext(CinemaContext);
  if (!context) {
    throw new Error('useCinema must be used within a CinemaProvider');
  }
  return context;
};
