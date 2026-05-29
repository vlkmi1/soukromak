import { differenceInHours, getDay } from "date-fns";

/**
 * Vypočítá cenu rezervace podle ceníku
 * 
 * Ceník:
 * - S rezervací 24h (PO-ČT do 12:00h): 500 Kč
 * - Bez rezervace na místě 24h (ČT - NE do 12:00h): 600 Kč
 * - Malá víkendová 48h (PÁ 12:00h do NE 12:00h): 1100 Kč
 * - Velká víkendová 72h (ČT 12:00h do NE 12:00h): 1500 Kč
 * - Týdenní (168 hodin): 2500 Kč
 */
export function calculateReservationPrice(startDate: Date, endDate: Date): number {
  const hours = differenceInHours(endDate, startDate);
  const startDay = getDay(startDate); // 0 = neděle, 1 = pondělí, ..., 6 = sobota
  
  // Týdenní (7 dní = 168 hodin)
  if (hours >= 168) {
    return 2500;
  }
  
  // Velká víkendová (ČT-NE = 72 hodin)
  if (hours >= 72 && hours < 96) {
    if (startDay === 4) { // čtvrtek
      return 1500;
    }
  }
  
  // Malá víkendová (PÁ-NE = 48 hodin)
  if (hours >= 48 && hours < 72) {
    if (startDay === 5) { // pátek
      return 1100;
    }
  }
  
  // 24 hodin
  if (hours >= 24 && hours < 48) {
    // PO-ČT (s rezervací): 500 Kč
    if (startDay >= 1 && startDay <= 4) {
      return 500;
    }
    // ČT-NE (bez rezervace): 600 Kč
    return 600;
  }
  
  // Pro jiné délky - proporcionální výpočet
  // Základní cena 500 Kč/24h
  const days = Math.ceil(hours / 24);
  return days * 500;
}

/**
 * Formátuje cenu s měnou
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("cs-CZ")} Kč`;
}

/**
 * Vrátí název balíčku podle období
 */
export function getPricingPackageName(startDate: Date, endDate: Date): string {
  const hours = differenceInHours(endDate, startDate);
  const startDay = getDay(startDate);
  
  if (hours >= 168) {
    return "Týdenní (168 hodin)";
  }
  
  if (hours >= 72 && hours < 96 && startDay === 4) {
    return "Velká víkendová (ČT-NE, 72h)";
  }
  
  if (hours >= 48 && hours < 72 && startDay === 5) {
    return "Malá víkendová (PÁ-NE, 48h)";
  }
  
  if (hours >= 24 && hours < 48) {
    if (startDay >= 1 && startDay <= 4) {
      return "S rezervací 24h (PO-ČT)";
    }
    return "Bez rezervace 24h (ČT-NE)";
  }
  
  const days = Math.ceil(hours / 24);
  return `${days} ${days === 1 ? "den" : days < 5 ? "dny" : "dní"}`;
}