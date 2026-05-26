CREATE POLICY "Users can delete own answer uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'answer-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);