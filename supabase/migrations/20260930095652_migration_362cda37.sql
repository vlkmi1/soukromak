-- DELETE politika - povolit mazání objektů v addon-images bucketu
CREATE POLICY "allow_delete_addon_images" ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'addon-images');