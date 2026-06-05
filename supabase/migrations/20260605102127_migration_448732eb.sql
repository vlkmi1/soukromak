-- Tabulka pro brand nastavení webu
CREATE TABLE IF NOT EXISTS brand_settings (
  id SERIAL PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT 'Rybník Ostrata',
  site_tagline TEXT DEFAULT 'Kaprový rybník Ostrata',
  logo_url TEXT,
  
  -- Barvy
  primary_color TEXT NOT NULL DEFAULT '142 76% 36%',
  secondary_color TEXT NOT NULL DEFAULT '200 18% 46%',
  accent_color TEXT NOT NULL DEFAULT '207 90% 54%',
  background_color TEXT NOT NULL DEFAULT '0 0% 100%',
  foreground_color TEXT NOT NULL DEFAULT '222 47% 11%',
  
  -- Fonty
  heading_font TEXT NOT NULL DEFAULT 'Inter',
  body_font TEXT NOT NULL DEFAULT 'Inter',
  
  -- Kontakt
  contact_phone TEXT DEFAULT '+420 123 456 789',
  contact_email TEXT DEFAULT 'info@rybnikostrata.cz',
  contact_address TEXT DEFAULT 'Nové Veselí',
  
  -- Sociální sítě
  social_facebook TEXT,
  social_instagram TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Povolit RLS
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- Povolit čtení všem (veřejné nastavení)
CREATE POLICY "Allow public read brand_settings" 
ON brand_settings FOR SELECT 
USING (true);

-- Povolit zápis všem (admin autentizace přes PIN)
CREATE POLICY "Allow all write brand_settings" 
ON brand_settings FOR ALL 
USING (true) 
WITH CHECK (true);

-- Vložit výchozí hodnoty
INSERT INTO brand_settings (
  site_name,
  site_tagline,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  foreground_color,
  heading_font,
  body_font,
  contact_phone,
  contact_email,
  contact_address,
  social_facebook,
  social_instagram
) VALUES (
  'Rybník Ostrata',
  'Kaprový rybník v srdci přírody',
  '142 76% 36%',
  '200 18% 46%',
  '207 90% 54%',
  '0 0% 100%',
  '222 47% 11%',
  'Inter',
  'Inter',
  '+420 123 456 789',
  'info@rybnikostrata.cz',
  'Nové Veselí',
  'https://www.facebook.com/rybnikostrata',
  'https://www.instagram.com/rybnikostrata'
);