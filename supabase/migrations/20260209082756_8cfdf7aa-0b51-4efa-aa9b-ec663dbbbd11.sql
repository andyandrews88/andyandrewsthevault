-- Make vault-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'vault-files';

-- Drop the public SELECT policy since we'll use signed URLs
DROP POLICY IF EXISTS "Anyone can view vault files" ON storage.objects;

-- Create new policy that only allows authenticated users to access via signed URLs
CREATE POLICY "Authenticated users can access vault files via signed URLs"
ON storage.objects FOR SELECT
USING (bucket_id = 'vault-files' AND auth.role() = 'authenticated');