-- Run once in the existing Supabase project's SQL Editor before deploying the UI.
-- This removes one team only when its signed-in owner calls the function.
begin;
create or replace function public.delete_team(t uuid, expected_name text, check_only boolean default false) returns void
language plpgsql security definer set search_path='' as $$
declare current_name text; current_owner uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select name,owner_id into current_name,current_owner from public.teams where id=t for update;
 if not found then raise exception 'Team not found'; end if;
 if current_owner<>auth.uid() then raise exception 'Only the team owner can delete the team'; end if;
 if expected_name is distinct from current_name then raise exception 'Team name did not match'; end if;
 if check_only then return; end if;
 if exists(select 1 from storage.objects where bucket_id='team-files' and name like t::text||'/%') then
  raise exception 'Remove team files before deleting the team';
 end if;
 delete from public.comments where team_id=t;
 delete from public.records where team_id=t;
 delete from public.memberships where team_id=t;
 delete from public.notifications where team_id=t;
 delete from public.activity where team_id=t;
 delete from public.teams where id=t;
end $$;
revoke all on function public.delete_team(uuid,text,boolean) from public,anon;
grant execute on function public.delete_team(uuid,text,boolean) to authenticated;
commit;
notify pgrst, 'reload schema';
