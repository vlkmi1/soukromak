-- Přidat sloupec pro cenu do tabulky reservations
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS price INTEGER;

-- Aktualizovat existující rezervace s výchozí cenou
UPDATE reservations 
SET price = 500 
WHERE price IS NULL;