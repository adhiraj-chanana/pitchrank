-- PitchRank storage setup — Week 2
-- Run this in the Supabase SQL editor after schema.sql.
-- Creates the "pitch-recordings" bucket used to stage audio for
-- transcription. Files are deleted right after transcription completes,
-- so the bucket is a scratch space, not permanent storage.

insert into storage.buckets (id, name, public)
values ('pitch-recordings', 'pitch-recordings', true)
on conflict (id) do nothing;

-- Files are uploaded as {user_id}/{uuid}.webm (or .mp4), so folder-scoped
-- policies key off the first path segment matching auth.uid().

create policy "Users can upload their own pitch recordings"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pitch-recordings'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own pitch recordings"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'pitch-recordings'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Public read access to pitch recordings"
on storage.objects for select
using (bucket_id = 'pitch-recordings');
