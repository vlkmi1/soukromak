import { supabase } from "@/lib/supabase";

export interface BrandSettings {
  id: number;
  site_name: string;
  site_tagline: string;
  logo_url: string | null;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_background: string;
  color_foreground: string;
  font_heading: string;
  font_body: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  social_facebook: string | null;
  social_instagram: string | null;
}

// Default nastavení jako fallback
export const DEFAULT_BRAND: BrandSettings = {
  id: 0,
  site_name: "Rybník Ostrata",
  site_tagline: "Kaprový rybník v Novém Veselí",
  logo_url: null,
  color_primary: "142 70% 25%",
  color_secondary: "142 60% 35%",
  color_accent: "142 65% 45%",
  color_background: "0 0% 100%",
  color_foreground: "0 0% 20%",
  font_heading: "Roboto Condensed",
  font_body: "Roboto Condensed",
  contact_phone: "+420 123 456 789",
  contact_email: "info@rybnikostrata.cz",
  contact_address: "Nové Veselí",
  social_facebook: "https://www.facebook.com/rybnikostrata",
  social_instagram: "https://www.instagram.com/rybnikostrata",
};

let cachedBrand: BrandSettings | null = null;

export async function getBrandSettings(): Promise<BrandSettings> {
  // Vrátit cache pokud existuje
  if (cachedBrand) {
    return cachedBrand;
  }

  try {
    const { data, error } = await supabase
      .from("brand_settings")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn("Using default brand settings:", error);
      return DEFAULT_BRAND;
    }

    if (data) {
      cachedBrand = data as BrandSettings;
      return cachedBrand;
    }

    return DEFAULT_BRAND;
  } catch (error) {
    console.error("Error loading brand settings:", error);
    return DEFAULT_BRAND;
  }
}

export async function updateBrandSettings(settings: Partial<BrandSettings>): Promise<void> {
  try {
    const { error } = await supabase
      .from("brand_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", settings.id);

    if (error) throw error;

    // Invalidovat cache
    cachedBrand = null;
  } catch (error) {
    console.error("Error updating brand settings:", error);
    throw error;
  }
}

export function clearBrandCache() {
  cachedBrand = null;
}

// Aplikovat brand CSS variables do dokumentu
export function applyBrandStyles(brand: BrandSettings) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--primary", brand.color_primary);
  root.style.setProperty("--secondary", brand.color_secondary);
  root.style.setProperty("--accent", brand.color_accent);
  root.style.setProperty("--background", brand.color_background);
  root.style.setProperty("--foreground", brand.color_foreground);

  // Načíst fonty z Google Fonts
  const fontLink = document.getElementById("brand-fonts") as HTMLLinkElement;
  const fonts = [brand.font_heading, brand.font_body].filter((f, i, arr) => arr.indexOf(f) === i);
  const fontUrl = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/ /g, "+")}:wght@400;700`).join("&")}&display=swap`;
  
  if (fontLink) {
    fontLink.href = fontUrl;
  } else {
    const link = document.createElement("link");
    link.id = "brand-fonts";
    link.rel = "stylesheet";
    link.href = fontUrl;
    document.head.appendChild(link);
  }
}