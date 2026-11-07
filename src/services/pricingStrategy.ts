import { Showtime } from '../types';

export interface PricingCalculationResult {
  basePrice: number;
  finalPrice: number;
  discount: number;
  discountPercentage: number;
  strategyName: string;
  tag: string;
  description: string;
}

/**
 * Interface polimórfica desacoplada para el cálculo de tarifas (RNF-08).
 * Permite añadir nuevas estrategias sin modificar el servicio de pago ni el checkout.
 */
export interface PricingStrategy {
  readonly id: string;
  readonly name: string;
  isApplicable(showtime: Showtime): boolean;
  calculate(basePrice: number, showtime: Showtime): PricingCalculationResult;
}

/**
 * Estrategia Estándar: Sin descuento para funciones a partir de las 12:00 PM (Mediodía).
 */
export class StandardPricingStrategy implements PricingStrategy {
  readonly id = 'standard';
  readonly name = 'Tarifa Estándar';

  isApplicable(showtime: Showtime): boolean {
    return showtime.hour24 >= 12;
  }

  calculate(basePrice: number, _showtime: Showtime): PricingCalculationResult {
    return {
      basePrice,
      finalPrice: basePrice,
      discount: 0,
      discountPercentage: 0,
      strategyName: this.name,
      tag: 'Tarifa Estándar',
      description: 'Precio regular para funciones de la tarde y noche (>= 12:00 PM)',
    };
  }
}

/**
 * Estrategia Matinal (RF-08):
 * Descuento automático del 20% para funciones que inicien antes de las 12:00 PM.
 * Ejemplo: Base $20.000 COP -> Cobro $16.000 COP.
 */
export class MatinalPricingStrategy implements PricingStrategy {
  readonly id = 'matinal';
  readonly name = 'Tarifa Matinal (-20%)';

  isApplicable(showtime: Showtime): boolean {
    return showtime.hour24 < 12;
  }

  calculate(basePrice: number, _showtime: Showtime): PricingCalculationResult {
    const discountPercentage = 20;
    const discount = Math.round(basePrice * 0.20);
    const finalPrice = basePrice - discount;

    return {
      basePrice,
      finalPrice,
      discount,
      discountPercentage,
      strategyName: this.name,
      tag: 'Tarifa Matinal 20% OFF',
      description: 'Aplica automáticamente para funciones matinales antes del mediodía (< 12:00 PM)',
    };
  }
}

/**
 * Estrategia Extendida: Demostración de extensibilidad arquitectónica (RNF-08).
 * Permite agregar tarifas promocionales sin tocar la lógica central.
 */
export class MemberPromoPricingStrategy implements PricingStrategy {
  readonly id = 'promo_member';
  readonly name = 'Tarifa Alianza Cinéfilo (-15%)';

  isApplicable(_showtime: Showtime): boolean {
    return false; // Activada bajo demanda en eventos o cupones
  }

  calculate(basePrice: number, _showtime: Showtime): PricingCalculationResult {
    const discountPercentage = 15;
    const discount = Math.round(basePrice * 0.15);
    const finalPrice = basePrice - discount;

    return {
      basePrice,
      finalPrice,
      discount,
      discountPercentage,
      strategyName: this.name,
      tag: 'Alianza Cinéfilo -15%',
      description: 'Descuento especial para clientes con membresía CineMax',
    };
  }
}

/**
 * Contexto de Tarificación (Patrón Strategy)
 */
export class PricingContext {
  private strategies: PricingStrategy[] = [
    new MatinalPricingStrategy(),
    new StandardPricingStrategy(),
  ];

  public resolveStrategy(showtime: Showtime): PricingStrategy {
    const matched = this.strategies.find((strategy) => strategy.isApplicable(showtime));
    return matched || new StandardPricingStrategy();
  }

  public calculateTicketPrice(showtime: Showtime): PricingCalculationResult {
    const strategy = this.resolveStrategy(showtime);
    return strategy.calculate(showtime.basePrice, showtime);
  }
}

export const pricingEngine = new PricingContext();
