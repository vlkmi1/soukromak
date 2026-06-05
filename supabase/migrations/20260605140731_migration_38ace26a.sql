-- Tabulka pro CMS stránky/články
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  published BOOLEAN DEFAULT false,
  display_in_menu BOOLEAN DEFAULT true,
  menu_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabulka pro galerii
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS politiky
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read pages" 
ON pages FOR SELECT 
USING (published = true);

CREATE POLICY "Allow all write pages" 
ON pages FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public read gallery" 
ON gallery FOR SELECT 
USING (true);

CREATE POLICY "Allow all write gallery" 
ON gallery FOR ALL 
USING (true) 
WITH CHECK (true);

-- Defaultní stránky
INSERT INTO pages (slug, title, content, excerpt, published, display_in_menu, menu_order) VALUES
('o-rybníku', 'O rybníku', '<h2>Rybník Ostrata</h2><p>Kaprový rybník v Novém Veselí s 14 lovnými místy. Ideální podmínky pro sportovní rybolov.</p>', 'Kaprový rybník v Novém Veselí', true, true, 1),
('pravidla', 'Pravidla', '<h2>Pravidla rybolovu</h2><p>Na rybníku platí standardní pravidla sportovního rybolovu.</p>', 'Pravidla sportovního rybolovu', true, true, 2),
('kontakt', 'Kontakt', '<h2>Kontaktujte nás</h2><p>Pro více informací nás neváhejte kontaktovat.</p>', 'Kontaktní informace', true, true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Galerie má speciální slug
INSERT INTO pages (slug, title, content, published, display_in_menu, menu_order) VALUES
('fotogalerie', 'Fotogalerie', '', true, true, 3)
ON CONFLICT (slug) DO NOTHING;