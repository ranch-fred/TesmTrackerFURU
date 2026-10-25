-- Run once in the existing project's Supabase SQL Editor.
-- Keeps the private team-files bucket and its existing RLS policies intact.
-- CAD extensions are checked in the app; Storage receives them as octet-stream.
begin;
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/png', 'image/jpeg', 'image/webp', 'application/pdf',
      'text/plain', 'application/octet-stream'
    ]
where id = 'team-files';
commit;
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'team-files';
