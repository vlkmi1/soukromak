-- Vytvořit nové politiky bez autentizace (admin používá PIN)
-- INSERT politika
CREATE POLICY "public_insert_addons" ON addons
  FOR INSERT
  TO public
  WITH CHECK (true);

-- UPDATE politika
CREATE POLICY "public_update_addons" ON addons
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- DELETE politika
CREATE POLICY "public_delete_addons" ON addons
  FOR DELETE
  TO public
  USING (true);

-- Ověřit výsledek
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'addons'
ORDER BY cmd, policyname;