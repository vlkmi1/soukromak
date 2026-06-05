-- Povolit zápis do fishing_spots (pro editor lovných míst)
DROP POLICY IF EXISTS "Allow public read fishing_spots" ON fishing_spots;
DROP POLICY IF EXISTS "Allow all write fishing_spots" ON fishing_spots;

-- Veřejné čtení
CREATE POLICY "Allow public read fishing_spots" 
ON fishing_spots FOR SELECT 
USING (true);

-- Povolit všechny operace (INSERT, UPDATE, DELETE) - admin má PIN autentizaci
CREATE POLICY "Allow all write fishing_spots" 
ON fishing_spots FOR ALL 
USING (true) 
WITH CHECK (true);

-- Povolit zápis do map_image
DROP POLICY IF EXISTS "Allow public read map_image" ON map_image;
DROP POLICY IF EXISTS "Allow all write map_image" ON map_image;

CREATE POLICY "Allow public read map_image" 
ON map_image FOR SELECT 
USING (true);

CREATE POLICY "Allow all write map_image" 
ON map_image FOR ALL 
USING (true) 
WITH CHECK (true);