import { differenceInHours, getDay } from "date-fns";
import { supabase } from "./supabase";

// Cache pro cenové pravidla (5 minut platnost)
let pricingCache: { data: any[] | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minut

/**
 * Načte cenová pravidla z databáze s cachováním
 */
async function getPricingRules() {
  const now = Date.now();
  
  // Pokud je cache platná, vrátit z cache
  if (pricingCache.data && now - pricingCache.timestamp < CACHE_DURATION) {
    return pricingCache.data;
  }

  // Načíst z databáze
  const { data, error } = await supabase
    .from("pricing")
    .select("*")
    .eq("is_active", true)
    .order("days", { ascending: true });

  if (error) {
    console.error("Error loading pricing rules:", error);
    return [];
  }

  // Uložit do cache
  pricingCache = {
    data: data || [],
    timestamp: now,
  };

  return data || [];
}

/**
 * Vymazat cache (volat po změně cen v admin panelu)
 */
export function clearPricingCache() {
  pricingCache = { data: null, timestamp: 0 };
}

/**
 * Vypočítat cenu rezervace podle počtu dnů
 */
export async function calculatePrice(days: number): Promise<number> {
  const rules = await getPricingRules();

  if (rules.length === 0) {
    // Fallback na výchozí ceny pokud nejsou v DB
    console.warn("No pricing rules found in database, using fallback prices");
    return calculateFallbackPrice(days);
  }

  // Najít pravidlo pro daný počet dnů
  const rule = rules.find((r: any) => r.days === days);

  if (rule) {
    return rule.price_per_day * days;
  }

  // Pokud není přesné pravidlo, použít nejbližší vyšší
  const higherRule = rules.find((r: any) => r.days > days);
  if (higherRule) {
    return higherRule.price_per_day * days;
  }

  // Pokud není žádné vyšší, použít nejvyšší dostupné
  const lastRule = rules[rules.length - 1];
  if (lastRule) {
    return lastRule.price_per_day * days;
  }

  // Poslední fallback
  return calculateFallbackPrice(days);
}

/**
 * Fallback výpočet pokud DB není dostupná
 */
function calculateFallbackPrice(days: number): number {
  // Původní hardcoded ceny jako záloha
  const fallbackPrices: Record<number, number> = {
    1: 500,
    2: 900,
    3: 1200,
    4: 1500,
    5: 1750,
    6: 2000,
    7: 2200,
  };

  return fallbackPrices[days] || days * 300;
}

/**
 * Získat informace o balíčku podle počtu dnů
 */
export async function getPackageInfo(days: number): Promise<{
  name: string;
  pricePerDay: number;
  totalPrice: number;
}> {
  const rules = await getPricingRules();
  const rule = rules.find((r: any) => r.days === days);

  if (rule) {
    return {
      name: rule.name,
      pricePerDay: rule.price_per_day,
      totalPrice: rule.price_per_day * days,
    };
  }

  // Fallback
  const totalPrice = await calculatePrice(days);
  return {
    name: `${days}denní balíček`,
    pricePerDay: Math.round(totalPrice / days),
    totalPrice,
  };
}

/**
 * Získat všechny dostupné balíčky pro výběr
 */
export async function getAvailablePackages(): Promise<Array<{
  days: number;
  name: string;
  pricePerDay: number;
  totalPrice: number;
  isActive: boolean;
}>> {
  const rules = await getPricingRules();

  return rules.map((rule: any) => ({
    days: rule.days,
    name: rule.name,
    pricePerDay: rule.price_per_day,
    totalPrice: rule.price_per_day * rule.days,
    isActive: rule.is_active,
  }));
}

/**
 * Vypočítá cenu rezervace podle ceníku
 * 
 * Ceník (ceny za 1 rybáře):
 * - S rezervací 24h (PO-ČT do 12:00h): 500 Kč
 * - Bez rezervace na místě 24h (ČT - NE do 12:00h): 600 Kč
 * - Malá víkendová 48h (PÁ 12:00h do NE 12:00h): 1100 Kč
 * - Velká víkendová 72h (ČT 12:00h do NE 12:00h): 1500 Kč
 * - Týdenní (168 hodin): 2500 Kč
 * 
 * Celková cena = základní cena × počet rybářů
 */
export function calculateReservationPrice(startDate: Date, endDate: Date, fishermanCount: number = 1): number {
  const basePrice = getBasePricePerFisherman(startDate, endDate);
  return basePrice * fishermanCount;
}

/**
 * Vypočítá základní cenu za jednoho rybáře podle období
 */
export function getBasePricePerFisherman(startDate: Date, endDate: Date): number {
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