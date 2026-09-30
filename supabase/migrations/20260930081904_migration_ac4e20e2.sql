-- Povolit INSERT pro autentizované uživatele na tabulce addons
CREATE POLICY "authenticated_insert_addons" ON addons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Povolit UPDATE pro autentizované uživatele
CREATE POLICY "authenticated_update_addons" ON addons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Povolit DELETE pro autentizované uživatele
CREATE POLICY "authenticated_delete_addons" ON addons
  FOR DELETE
  TO authenticated
  USING (true);

-- Zobrazit nové politiky
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'addons'
ORDER BY cmd;