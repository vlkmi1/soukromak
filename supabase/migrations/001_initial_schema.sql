-- Create fishing spots table
CREATE TABLE fishing_spots (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position_x DECIMAL(5,2) NOT NULL,
  position_y DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spot positions table (2 positions per spot)
CREATE TABLE spot_positions (
  id SERIAL PRIMARY KEY,
  spot_id INTEGER REFERENCES fishing_spots(id) ON DELETE CASCADE,
  position_number INTEGER NOT NULL CHECK (position_number IN (1, 2)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spot_id, position_number)
);

-- Create reservations table
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reservation_positions junction table
CREATE TABLE reservation_positions (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
  position_id INTEGER REFERENCES spot_positions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reservation_id, position_id)
);

-- Insert 13 fishing spots with positions
INSERT INTO fishing_spots (id, name, position_x, position_y) VALUES
  (1, 'Místo 1', 15.5, 25.0),
  (2, 'Místo 2', 28.0, 22.0),
  (3, 'Místo 3', 42.0, 20.0),
  (4, 'Místo 4', 58.0, 18.0),
  (5, 'Místo 5', 72.0, 20.0),
  (6, 'Místo 6', 84.5, 25.0),
  (7, 'Místo 7', 88.0, 45.0),
  (8, 'Místo 8', 82.0, 65.0),
  (9, 'Místo 9', 68.0, 75.0),
  (10, 'Místo 10', 50.0, 78.0),
  (11, 'Místo 11', 32.0, 75.0),
  (12, 'Místo 12', 18.0, 65.0),
  (13, 'Místo 13', 12.0, 45.0);

-- Create 2 positions for each spot
INSERT INTO spot_positions (spot_id, position_number)
SELECT id, 1 FROM fishing_spots
UNION ALL
SELECT id, 2 FROM fishing_spots;

-- Enable Row Level Security
ALTER TABLE fishing_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_positions ENABLE ROW LEVEL SECURITY;

-- Public read access for fishing spots and positions
CREATE POLICY "Public read fishing_spots" ON fishing_spots FOR SELECT USING (true);
CREATE POLICY "Public read spot_positions" ON spot_positions FOR SELECT USING (true);

-- Public can create reservations
CREATE POLICY "Public create reservations" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read reservations" ON reservations FOR SELECT USING (true);

-- Public can create reservation positions
CREATE POLICY "Public create reservation_positions" ON reservation_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read reservation_positions" ON reservation_positions FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for reservations
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();