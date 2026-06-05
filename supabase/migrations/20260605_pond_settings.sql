-- Tabulka pro nastavení mapy rybníku
CREATE TABLE IF NOT EXISTS pond_settings (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabulka pro pozice lovných míst
CREATE TABLE IF NOT EXISTS spot_positions (
  id SERIAL PRIMARY KEY,
  pond_settings_id INTEGER REFERENCES pond_settings(id) ON DELETE CASCADE,
  spot_number INTEGER NOT NULL,
  x_position DECIMAL(5,2) NOT NULL,
  y_position DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pond_settings_id, spot_number)
);

-- Enable RLS
ALTER TABLE pond_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_positions ENABLE ROW LEVEL SECURITY;

-- Policies - veřejné čtení, admin zápis
CREATE POLICY "public_read_pond_settings" ON pond_settings FOR SELECT USING (true);
CREATE POLICY "public_read_spot_positions" ON spot_positions FOR SELECT USING (true);

CREATE POLICY "admin_insert_pond_settings" ON pond_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_update_pond_settings" ON pond_settings FOR UPDATE USING (true);
CREATE POLICY "admin_delete_pond_settings" ON pond_settings FOR DELETE USING (true);

CREATE POLICY "admin_insert_spot_positions" ON spot_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_update_spot_positions" ON spot_positions FOR UPDATE USING (true);
CREATE POLICY "admin_delete_spot_positions" ON spot_positions FOR DELETE USING (true);

-- Defaultní nastavení s aktuální mapou
INSERT INTO pond_settings (image_url) VALUES ('/Mapa-Rybnik-Ostrata-scaled.jpg');

-- Defaultní pozice míst (z PondMap.tsx)
INSERT INTO spot_positions (pond_settings_id, spot_number, x_position, y_position) VALUES
  (1, 1, 82, 42),
  (1, 2, 79, 48),
  (1, 3, 75, 54),
  (1, 4, 71, 60),
  (1, 5, 67, 65),
  (1, 6, 62, 69),
  (1, 7, 57, 71),
  (1, 8, 52, 72),
  (1, 9, 47, 71),
  (1, 10, 42, 69),
  (1, 11, 37, 65),
  (1, 12, 33, 60),
  (1, 13, 29, 54),
  (1, 14, 25, 47);