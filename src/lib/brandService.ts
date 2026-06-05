import { supabase } from "./supabase";

export interface BrandSettings {
  id?: number;
  site_name: string;
  tagline?: string;
  logo_url?: string;
  color_primary: string;
  color_secondary: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  muted_color: string;
  heading_font: string;
  body_font: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  facebook_url?: string;
  instagram_url?: string;
}

let brandCache: BrandSettings | null = null;

export const getBrandSettings = async (): Promise<BrandSettings> => {
  if (brandCache) {
    return brandCache;
  }

  try {
    const { data, error } = await supabase
      .from("brand_settings")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    if (data) {
      // Mapování z databáze (primary_color) na rozhraní (color_primary)
      const settings: BrandSettings = {
        id: data.id,
        site_name: data.site_name || "Rybník Ostrata",
        tagline: data.tagline || "Kaprový rybník v Novém Veselí",
        logo_url: data.logo_url || undefined,
        color_primary: data.primary_color || "142 76% 36%",
        color_secondary: data.secondary_color || "200 18% 46%",
        accent_color: data.accent_color || "207 90% 54%",
        background_color: data.background_color || "0 0% 100%",
        foreground_color: data.foreground_color || "222 47% 11%",
        muted_color: data.muted_color || "210 40% 96%",
        heading_font: data.heading_font || "Inter",
        body_font: data.body_font || "Inter",
        contact_phone: data.contact_phone || undefined,
        contact_email: data.contact_email || undefined,
        contact_address: data.contact_address || undefined,
        facebook_url: data.facebook_url || undefined,
        instagram_url: data.instagram_url || undefined,
      };

      brandCache = settings;
      return settings;
    }
  } catch (error) {
    console.error("Error loading brand settings:", error);
  }

  // Defaultní nastavení
  return {
    site_name: "Rybník Ostrata",
    tagline: "Kaprový rybník Ostrata",
    logo_url: "",
    color_primary: "142 76% 36%",
    color_secondary: "200 18% 46%",
    accent_color: "207 90% 54%",
    background_color: "0 0% 100%",
    foreground_color: "222 47% 11%",
    muted_color: "210 40% 96%",
    heading_font: "Inter",
    body_font: "Inter",
    contact_phone: "+420 123 456 789",
    contact_email: "info@rybnikostrata.cz",
    contact_address: "Nové Veselí",
    facebook_url: "",
    instagram_url: "",
  };
};

export const updateBrandSettings = async (settings: BrandSettings): Promise<void> => {
  try {
    // Mapování z rozhraní (color_primary) na databázi (primary_color)
    const dbData = {
      site_name: settings.site_name,
      tagline: settings.tagline,
      logo_url: settings.logo_url,
      primary_color: settings.color_primary,
      secondary_color: settings.color_secondary,
      accent_color: settings.accent_color,
      background_color: settings.background_color,
      foreground_color: settings.foreground_color,
      muted_color: settings.muted_color,
      heading_font: settings.heading_font,
      body_font: settings.body_font,
      contact_phone: settings.contact_phone,
      contact_email: settings.contact_email,
      contact_address: settings.contact_address,
      facebook_url: settings.facebook_url,
      instagram_url: settings.instagram_url,
    };

    if (settings.id) {
      // Update existujícího záznamu
      const { error } = await supabase
        .from("brand_settings")
        .update(dbData)
        .eq("id", settings.id);

      if (error) throw error;
    } else {
      // Insert nového záznamu
      const { error } = await supabase
        .from("brand_settings")
        .insert([dbData]);

      if (error) throw error;
    }

    clearBrandCache();
  } catch (error) {
    console.error("Error updating brand settings:", error);
    throw error;
  }
};

export const clearBrandCache = () => {
  brandCache = null;
};