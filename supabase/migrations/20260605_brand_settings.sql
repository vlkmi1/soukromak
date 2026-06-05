-- Tabulka pro brand nastavení webu
CREATE TABLE IF NOT EXISTS brand_settings (
  id SERIAL PRIMARY KEY,
  -- Základní info
  site_name TEXT DEFAULT 'Rybník Ostrata',
  site_tagline TEXT DEFAULT 'Kaprový rybník v Novém Veselí',
  logo_url TEXT,
  
  -- Barvy (HSL formát: "H S% L%")
  color_primary TEXT DEFAULT '142 70% 25%',
  color_secondary TEXT DEFAULT '142 60% 35%',
  color_accent TEXT DEFAULT '142 65% 45%',
  color_background TEXT DEFAULT '0 0% 100%',
  color_foreground TEXT DEFAULT '0 0% 20%',
  
  -- Fonty
  font_heading TEXT DEFAULT 'Roboto Condensed',
  font_body TEXT DEFAULT 'Roboto Condensed',
  
  -- Kontakt
  contact_phone TEXT DEFAULT '+420 123 456 789',
  contact_email TEXT DEFAULT 'info@rybnikostrata.cz',
  contact_address TEXT DEFAULT 'Nové Veselí',
  
  -- Sociální sítě
  social_facebook TEXT,
  social_instagram TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- Policies - veřejné čtení, admin zápis
CREATE POLICY "public_read_brand_settings" ON brand_settings FOR SELECT USING (is_active = true);
CREATE POLICY "admin_all_brand_settings" ON brand_settings FOR ALL USING (true);

-- Defaultní nastavení
INSERT INTO brand_settings (
  site_name,
  site_tagline,
  color_primary,
  color_secondary,
  color_accent,
  font_heading,
  font_body,
  contact_phone,
  contact_email,
  contact_address,
  social_facebook,
  social_instagram
) VALUES (
  'Rybník Ostrata',
  'Kaprový rybník v Novém Veselí',
  '142 70% 25%',
  '142 60% 35%',
  '142 65% 45%',
  'Roboto Condensed',
  'Roboto Condensed',
  '+420 123 456 789',
  'info@rybnikostrata.cz',
  'Nové Veselí',
  'https://www.facebook.com/rybnikostrata',
  'https://www.instagram.com/rybnikostrata'
);