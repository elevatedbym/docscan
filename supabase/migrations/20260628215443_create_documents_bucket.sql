/*
# Create storage bucket for document images

1. Storage
- Create public bucket `documents` for storing uploaded document images.
- Public read so images can be displayed; writes controlled by RLS on storage.objects.

2. Security
- Storage RLS policies: authenticated users can upload/read/delete their own files.
- Files are scoped by user_id folder convention.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can read documents" ON storage.objects;
CREATE POLICY "Users can read documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
