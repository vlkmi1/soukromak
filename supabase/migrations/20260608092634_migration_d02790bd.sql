-- Vytvořit politiku pro UPDATE - jen pro autentizované uživatele
CREATE POLICY "Enable update for authenticated users only"
  ON pricing
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Zobrazit všechny politiky
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'pricing'
ORDER BY cmd;