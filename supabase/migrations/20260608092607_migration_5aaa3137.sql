-- Povolit RLS na tabulce pricing (pokud není povolen)
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Ověřit že je RLS povolen
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'pricing'
  AND schemaname = 'public';