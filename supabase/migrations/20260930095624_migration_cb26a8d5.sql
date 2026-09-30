-- Vytvořit novou politiku pro upload bez autentizace (admin používá PIN, ne Supabase Auth)
-- INSERT politika - povolit nahrávání do addon-images bucketu
CREATE POLICY "allow_upload_addon_images" ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'addon-images');