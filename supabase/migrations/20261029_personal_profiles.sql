-- Add optional personal profile fields without changing existing member identity or permissions.
alter table public.memberships add column if not exists display_name text default '';
alter table public.memberships add column if not exists bio text default '';
alter table public.memberships add column if not exists photo text default '';

create or replace function public.update_own_profile(t uuid,new_display_name text,new_bio text,new_photo text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if length(trim(coalesce(new_display_name,''))) not between 1 and 60 then
    raise exception 'Display name must be 1 to 60 characters';
  end if;
  if length(coalesce(new_bio,'')) > 240 then
    raise exception 'Bio must be 240 characters or fewer';
  end if;
  if length(coalesce(new_photo,'')) > 200000 or
    (coalesce(new_photo,'') <> '' and new_photo !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$') then
    raise exception 'Invalid profile photo';
  end if;
  update public.memberships
  set display_name=trim(new_display_name),bio=trim(coalesce(new_bio,'')),photo=coalesce(new_photo,'')
  where team_id=t and user_id=auth.uid() and status='approved';
  if not found then raise exception 'Approved membership required'; end if;
end $$;

revoke all on function public.update_own_profile(uuid,text,text,text) from public,anon;
grant execute on function public.update_own_profile(uuid,text,text,text) to authenticated;

-- Keep avatar bytes out of the team activity log while retaining the other audit fields.
create or replace function public.audit_changes() returns trigger
language plpgsql security definer set search_path=public as $$
declare t uuid; rid uuid; b jsonb; a jsonb; k text;
begin
  if tg_op<>'INSERT' then b:=to_jsonb(old); end if;
  if tg_op<>'DELETE' then a:=to_jsonb(new); end if;
  if tg_table_name='memberships' then b:=b-'photo'; a:=a-'photo'; end if;
  t:=(case when tg_table_name='teams' then coalesce(a,b)->>'id' else coalesce(a,b)->>'team_id' end)::uuid;
  rid:=(coalesce(a,b)->>'id')::uuid;
  k:=coalesce(coalesce(a,b)->>'kind',tg_table_name);
  insert into activity(team_id,actor_id,action,kind,record_id,before_data,after_data)
    values(t,auth.uid(),tg_op,k,rid,b,a);
  if tg_table_name='records' and tg_op='INSERT' then
    if new.kind='announcements' then
      insert into notifications(team_id,title,targets)
        values(new.team_id,new.data->>'title',array(select jsonb_array_elements_text(coalesce(new.data->'targets','[]'::jsonb))));
    end if;
  end if;
  return coalesce(new,old);
end $$;

-- Rollback, only if this feature must be removed: revoke and drop the function.
-- Keep the three columns during rollback to preserve members' saved profile data.
