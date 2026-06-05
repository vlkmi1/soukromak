import { supabase } from "./supabase";

export interface BrandSettings {
  id?: number;
  site_name: string;
  site_tagline: string;
  logo_url: string;
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
  social_facebook: string;
  social_instagram: string;
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
        site_name: data.site_name,
        site_tagline: data.site_tagline,
        logo_url: data.logo_url || "",
        color_primary: data.primary_color,
        color_secondary: data.secondary_color,
        color_accent: data.accent_color,
        color_background: data.background_color,
        color_foreground: data.foreground_color,
        font_heading: data.heading_font,
        font_body: data.body_font,
        contact_phone: data.contact_phone || "",
        contact_email: data.contact_email || "",
        contact_address: data.contact_address || "",
        social_facebook: data.social_facebook || "",
        social_instagram: data.social_instagram || "",
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
    site_tagline: "Kaprový rybník Ostrata",
    logo_url: "",
    color_primary: "142 76% 36%",
    color_secondary: "200 18% 46%",
    color_accent: "207 90% 54%",
    color_background: "0 0% 100%",
    color_foreground: "222 47% 11%",
    font_heading: "Inter",
    font_body: "Inter",
    contact_phone: "+420 123 456 789",
    contact_email: "info@rybnikostrata.cz",
    contact_address: "Nové Veselí",
    social_facebook: "",
    social_instagram: "",
  };
};

export const updateBrandSettings = async (settings: BrandSettings): Promise<void> => {
  try {
    // Mapování z rozhraní (color_primary) na databázi (primary_color)
    const dbData = {
      site_name: settings.site_name,
      site_tagline: settings.site_tagline,
      logo_url: settings.logo_url,
      primary_color: settings.color_primary,
      secondary_color: settings.color_secondary,
      accent_color: settings.color_accent,
      background_color: settings.color_background,
      foreground_color: settings.color_foreground,
      heading_font: settings.font_heading,
      body_font: settings.font_body,
      contact_phone: settings.contact_phone,
      contact_email: settings.contact_email,
      contact_address: settings.contact_address,
      social_facebook: settings.social_facebook,
      social_instagram: settings.social_instagram,
      updated_at: new Date().toISOString(),
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