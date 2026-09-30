-- Vytvořit jednoduchou politiku pro veřejné čtení
CREATE POLICY "Enable read access for all users"
  ON pricing
  FOR SELECT
  USING (true);

-- Zobrazit vytvořené politiky
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'pricing';