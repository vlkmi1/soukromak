-- Vytvořit tabulku pricing (pokud neexistuje)
CREATE TABLE IF NOT EXISTS pricing (
  id SERIAL PRIMARY KEY,
  days INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_per_day INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);