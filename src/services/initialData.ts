import { Showtime, ConfectioneryItem, Seat } from '../types';

export function createInitialSeats(rows = ['A', 'B', 'C', 'D', 'E', 'F'], cols = 8): Record<string, Seat> {
  const seats: Record<string, Seat> = {};

  rows.forEach((row) => {
    for (let c = 1; c <= cols; c++) {
      const id = `${row}${c}`;
      // Accessible seats: Row A seats 1, 2, 7, 8
      const isAccessible = row === 'A' && (c <= 2 || c >= 7);

      seats[id] = {
        id,
        row,
        col: c,
        status: 'available',
        isAccessible,
      };
    }
  });

  return seats;
}

export const INITIAL_SHOWTIMES: Showtime[] = [
  {
    id: 'SH-01',
    movieId: 'MOV-01',
    movieTitle: 'Interstellar (10º Aniversario)',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    roomName: 'Sala 1 IMAX Láser',
    roomCapacity: 48,
    date: 'Hoy, 24 Octubre',
    time: '10:30 AM',
    hour24: 10.5,
    genre: 'Ciencia Ficción / Drama',
    duration: '169 min',
    classification: '+12',
    basePrice: 20000,
    seats: (() => {
      const s = createInitialSeats();
      s['C3'].status = 'sold';
      s['C4'].status = 'sold';
      return s;
    })(),
  },
  {
    id: 'SH-02',
    movieId: 'MOV-01',
    movieTitle: 'Interstellar (10º Aniversario)',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    roomName: 'Sala 1 IMAX Láser',
    roomCapacity: 48,
    date: 'Hoy, 24 Octubre',
    time: '03:45 PM',
    hour24: 15.75,
    genre: 'Ciencia Ficción / Drama',
    duration: '169 min',
    classification: '+12',
    basePrice: 20000,
    seats: (() => {
      const s = createInitialSeats();
      s['D4'].status = 'sold';
      return s;
    })(),
  },
  {
    id: 'SH-03',
    movieId: 'MOV-02',
    movieTitle: 'Duna: Parte Dos',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    roomName: 'Sala 2 MacroXE Dolby Atmos',
    roomCapacity: 48,
    date: 'Hoy, 24 Octubre',
    time: '11:15 AM',
    hour24: 11.25,
    genre: 'Aventura / Épica',
    duration: '166 min',
    classification: '+14',
    basePrice: 20000,
    seats: (() => {
      const s = createInitialSeats();
      s['B3'].status = 'sold';
      s['B4'].status = 'sold';
      return s;
    })(),
  },
  {
    id: 'SH-04',
    movieId: 'MOV-02',
    movieTitle: 'Duna: Parte Dos',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    roomName: 'Sala 2 MacroXE Dolby Atmos',
    roomCapacity: 48,
    date: 'Hoy, 24 Octubre',
    time: '07:30 PM',
    hour24: 19.5,
    genre: 'Aventura / Épica',
    duration: '166 min',
    classification: '+14',
    basePrice: 20000,
    seats: createInitialSeats(),
  },
  {
    id: 'SH-05',
    movieId: 'MOV-03',
    movieTitle: 'Spider-Man: Across Spider-Verse',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80',
    roomName: 'Sala 3 RealD 3D',
    roomCapacity: 48,
    date: 'Hoy, 24 Octubre',
    time: '10:00 AM',
    hour24: 10.0,
    genre: 'Animación / Acción',
    duration: '140 min',
    classification: 'TE',
    basePrice: 20000,
    seats: createInitialSeats(),
  },
  {
    id: 'SH-06',
    movieId: 'MOV-03',
    movieTitle: 'Spider-Man: Across Spider-Verse',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80',
    roomName: 'Sala 3 RealD 3D',
    roomCapacity: 48,
    date: 'Hoy, 24 Octubre',
    time: '06:15 PM',
    hour24: 18.25,
    genre: 'Animación / Acción',
    duration: '140 min',
    classification: 'TE',
    basePrice: 20000,
    seats: createInitialSeats(),
  },
];

export const INITIAL_CONFECTIONERY: ConfectioneryItem[] = [
  {
    id: 'CONF-01',
    name: 'Combo Personal Clásico',
    description: 'Crispetas de maíz recién estalladas medianas + Gaseosa 640ml a elección',
    price: 18000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?auto=format&fit=crop&w=500&q=80',
    category: 'combos',
  },
  {
    id: 'CONF-02',
    name: 'Combo Dúo CineMax',
    description: '2 Crispetas Medianas + 2 Gaseosas 640ml + 1 Chocolatina M&M o Jet',
    price: 32000,
    stock: 28,
    imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=500&q=80',
    category: 'combos',
  },
  {
    id: 'CONF-03',
    name: 'Combo Mega Familiar',
    description: 'Balde Gigante XXL Crispetas + 4 Gaseosas + Nachos bañados en Queso Cheddar',
    price: 48000,
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?auto=format&fit=crop&w=500&q=80',
    category: 'combos',
  },
  {
    id: 'CONF-04',
    name: 'Hot Dog Especial Cinema',
    description: 'Perro caliente artesanal con tocineta, papita fosforito, salsas + Gaseosa 500ml',
    price: 16000,
    stock: 22,
    imageUrl: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=500&q=80',
    category: 'snacks',
  },
  {
    id: 'CONF-05',
    name: 'Nachos Supremos con Cheddar',
    description: 'Crujientes totopos de maíz con abundante queso cheddar caliente y jalapeños',
    price: 14000,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=500&q=80',
    category: 'snacks',
  },
];
