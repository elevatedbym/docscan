/*
# Create scans table for document scanning app

1. New Tables
- `scans`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
  - `image_url` (text, not null) - storage URL of uploaded document image
  - `target_language` (text, not null) - target language code: 'sr', 'hr', or 'bs'
  - `translated_text` (text) - AI-translated text from the document
  - `summary` (text) - AI-generated two-sentence summary (what to do + deadline)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `scans`.
- Owner-scoped CRUD: each authenticated user can only access their own scan records.
- 4 separate policies (select/insert/update/delete) scoped to `authenticated` with `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so frontend inserts omitting it still succeed.

3. Notes
- The credit system (3 free scans) is enforced in the edge function and frontend by counting a user's rows in this table.
- Email/password auth is used; email confirmation stays OFF.
*/

CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  target_language text NOT NULL,
  translated_text text,
  summary text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scans" ON scans;
CREATE POLICY "select_own_scans" ON scans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scans" ON scans;
CREATE POLICY "insert_own_scans" ON scans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_scans" ON scans;
CREATE POLICY "update_own_scans" ON scans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_scans" ON scans;
CREATE POLICY "delete_own_scans" ON scans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS scans_user_id_idx ON scans(user_id);
