-- Vytvoření tabulky lovných míst
CREATE TABLE IF NOT EXISTS fishing_spots (
  id BIGSERIAL PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  x_position DECIMAL(5,2) NOT NULL,
  y_position DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vytvoření tabulky pozic na lovných místech (každé místo má 2 pozice)
CREATE TABLE IF NOT EXISTS spot_positions (
  id BIGSERIAL PRIMARY KEY,
  spot_id BIGINT NOT NULL REFERENCES fishing_spots(id) ON DELETE CASCADE,
  position_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(spot_id, position_number)
);

-- Vytvoření tabulky rezervací
CREATE TABLE IF NOT EXISTS reservations (
  id BIGSERIAL PRIMARY KEY,
  spot_id BIGINT NOT NULL REFERENCES fishing_spots(id) ON DELETE CASCADE,
  position_id BIGINT NOT NULL REFERENCES spot_positions(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexy pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_spot ON reservations(spot_id);

-- RLS politiky
ALTER TABLE fishing_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Všichni mohou číst lovná místa a jejich pozice
CREATE POLICY "public_read_spots" ON fishing_spots FOR SELECT USING (true);
CREATE POLICY "public_read_positions" ON spot_positions FOR SELECT USING (true);

-- Všichni mohou číst rezervace
CREATE POLICY "public_read_reservations" ON reservations FOR SELECT USING (true);

-- Kdokoliv může vytvořit rezervaci (anonymně)
CREATE POLICY "anon_insert_reservations" ON reservations FOR INSERT WITH CHECK (true);

-- Pouze admin může aktualizovat/mazat rezervace (prozatím kdokoliv)
CREATE POLICY "public_update_reservations" ON reservations FOR UPDATE USING (true);
CREATE POLICY "public_delete_reservations" ON reservations FOR DELETE USING (true);