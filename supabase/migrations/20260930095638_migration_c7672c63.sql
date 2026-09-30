-- UPDATE politika - povolit aktualizaci objektů v addon-images bucketu
CREATE POLICY "allow_update_addon_images" ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'addon-images')
  WITH CHECK (bucket_id = 'addon-images');