-- Nastavit RLS politiky pro bucket addon-images
-- Politika pro nahrávání (INSERT) - jen pro autentizované uživatele
CREATE POLICY "authenticated_upload_addon_images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'addon-images');

-- Politika pro čtení (SELECT) - veřejné pro všechny
CREATE POLICY "public_read_addon_images" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'addon-images');

-- Zobrazit politiky
SELECT policyname, cmd, roles FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
AND (policyname LIKE '%addon_images%' OR policyname LIKE '%addon-images%');