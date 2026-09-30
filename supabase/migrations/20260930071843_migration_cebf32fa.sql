-- Vytvořit tabulku pro doplňkové položky
CREATE TABLE IF NOT EXISTS addons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  price_per_day DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vytvořit vazební tabulku pro dostupnost doplňků na lovných místech
CREATE TABLE IF NOT EXISTS addon_availability (
  id SERIAL PRIMARY KEY,
  addon_id INTEGER NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  spot_id INTEGER NOT NULL REFERENCES fishing_spots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(addon_id, spot_id)
);

-- Vytvořit tabulku pro zarezervované doplňky
CREATE TABLE IF NOT EXISTS reservation_addons (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  addon_id INTEGER NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  price_per_day DECIMAL(10, 2) NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Povolit RLS
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_addons ENABLE ROW LEVEL SECURITY;

-- RLS politiky pro veřejné čtení
CREATE POLICY "Enable read access for all users on addons" ON addons
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on addon_availability" ON addon_availability
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on reservation_addons" ON reservation_addons
  FOR SELECT USING (true);

-- RLS politiky pro zápis (jen autentizovaní)
CREATE POLICY "Enable all for authenticated users on addons" ON addons
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users on addon_availability" ON addon_availability
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable insert for all users on reservation_addons" ON reservation_addons
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update/delete for authenticated users on reservation_addons" ON reservation_addons
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Zobrazit výsledek
SELECT 'Tables created successfully' as status;