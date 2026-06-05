-- Tabulka pro uložení URL obrázku mapy (jenom URL, ne pozice míst)
CREATE TABLE IF NOT EXISTS map_image (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE map_image ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "public_read_map" ON map_image FOR SELECT USING (true);
CREATE POLICY "admin_all_map" ON map_image FOR ALL USING (true) WITH CHECK (true);

-- Defaultní obrázek
INSERT INTO map_image (image_url) VALUES ('/Mapa-Rybnik-Ostrata-scaled.jpg');