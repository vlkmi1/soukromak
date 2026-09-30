-- Vytvořit tabulku pro vazbu rezervací na doplňky
CREATE TABLE IF NOT EXISTS reservation_addons (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  addon_id INTEGER NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_day NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reservation_id, addon_id)
);

-- RLS politiky
ALTER TABLE reservation_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_reservation_addons" ON reservation_addons
  FOR SELECT 
  USING (true);

CREATE POLICY "authenticated_insert_reservation_addons" ON reservation_addons
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_reservation_addons" ON reservation_addons
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_reservation_addons" ON reservation_addons
  FOR DELETE 
  TO authenticated
  USING (true);

-- Index pro rychlejší dotazy
CREATE INDEX IF NOT EXISTS idx_reservation_addons_reservation_id ON reservation_addons(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_addons_addon_id ON reservation_addons(addon_id);

SELECT 'Table reservation_addons created successfully' as status;