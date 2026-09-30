-- Přidat INSERT, UPDATE, DELETE politiky na addon_availability
CREATE POLICY "public_insert_addon_availability" ON addon_availability
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "public_update_addon_availability" ON addon_availability
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_delete_addon_availability" ON addon_availability
  FOR DELETE
  TO public
  USING (true);

-- Ověřit výsledek
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'addon_availability'
ORDER BY cmd, policyname;