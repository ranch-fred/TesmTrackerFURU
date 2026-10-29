-- Run once in a NEW Supabase project's SQL editor. No service-role key is used by the app.
create extension if not exists pgcrypto;
create table public.teams(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),name text not null,number text not null,school text default '',season text default '',logo text default '',location text default '',join_code text unique not null default upper(encode(gen_random_bytes(6),'hex')),created_at timestamptz default now());
create table public.memberships(id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,user_id uuid not null references auth.users(id),name text not null,display_name text default '',bio text default '',photo text default '',grade text default '',requested_role text default 'Member',role text not null default 'Member' check(role in ('Captain','Coach','Mentor','Member','Parent/Sponsor')),subteams text[] default '{}',status text not null default 'pending' check(status in ('pending','approved','denied')),mentor_edit boolean not null default false,notification_preferences boolean not null default true,onboarded boolean not null default false,created_at timestamptz default now(),unique(team_id,user_id));
create table public.email_invites(id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,email text not null,token_hash text unique not null,expires_at timestamptz not null default now()+interval '7 days',used_at timestamptz,used_by uuid references auth.users(id),revoked_at timestamptz,created_at timestamptz not null default now());
create index on public.email_invites(team_id,lower(email)) where used_at is null and revoked_at is null;
create table public.records(id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,kind text not null check(kind in ('announcements','tasks','roster','sessions','meetings','expenses','income','purchases','budgets','parts','packing','robot','subsystems','hardware','inspection','rules','programming','build','designs','matches','events','milestones','risks','outreach','judging','resources','portfolio')),data jsonb not null default '{}',created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz default now(),updated_at timestamptz default now());
create index on public.records(team_id,kind);
create table public.comments(id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,record_id uuid not null references public.records(id) on delete cascade,user_id uuid not null default auth.uid() references auth.users(id),message text not null check(length(message) between 1 and 5000),created_at timestamptz default now());
create table public.notifications(id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,title text not null,targets text[] default '{}',created_at timestamptz default now());
create table public.activity(id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,actor_id uuid default auth.uid(),action text not null,kind text not null,record_id uuid,before_data jsonb,after_data jsonb,created_at timestamptz default now());
create index on public.activity(team_id,created_at desc);
create function public.team_role(t uuid) returns text language sql stable security definer set search_path=public as $$ select role from memberships where team_id=t and user_id=auth.uid() and status='approved' $$;
create function public.team_admin(t uuid) returns boolean language sql stable security definer set search_path=public as $$ select coalesce(public.team_role(t) in ('Captain','Coach'),false) $$;
create function public.team_editor(t uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from memberships where team_id=t and user_id=auth.uid() and status='approved' and (role in ('Captain','Coach','Member') or (role='Mentor' and mentor_edit))) $$;
create function public.team_view(t uuid,k text) returns boolean language sql stable security definer set search_path=public as $$ select coalesce(public.team_role(t) is not null and (public.team_role(t)<>'Parent/Sponsor' or k in ('announcements','outreach')),false) $$;
alter table public.teams enable row level security;
alter table public.memberships enable row level security;
alter table public.email_invites enable row level security;
alter table public.records enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.activity enable row level security;
create policy teams_read on public.teams for select to authenticated using(exists(select 1 from memberships where team_id=teams.id and user_id=auth.uid()));
create policy teams_edit on public.teams for update to authenticated using(public.team_admin(id)) with check(public.team_admin(id));
-- owner_id and join_code cannot be changed directly; use guarded RPCs.
revoke all on public.teams from authenticated;
grant select on public.teams to authenticated;
grant update(name,number,school,season,logo,location) on public.teams to authenticated;
create policy members_read on public.memberships for select to authenticated using(user_id=auth.uid() or (public.team_role(team_id) is not null and public.team_role(team_id)<>'Parent/Sponsor'));
create policy records_read on public.records for select to authenticated using(public.team_view(team_id,kind));
create policy records_insert on public.records for insert to authenticated with check(public.team_editor(team_id) and created_by=auth.uid());
create policy records_update on public.records for update to authenticated using(public.team_editor(team_id)) with check(public.team_editor(team_id));
create policy records_delete on public.records for delete to authenticated using(public.team_admin(team_id));
create policy comments_read on public.comments for select to authenticated using(exists(select 1 from records r where r.id=record_id and r.team_id=comments.team_id and public.team_view(r.team_id,r.kind)));
create policy comments_insert on public.comments for insert to authenticated with check(user_id=auth.uid() and public.team_role(team_id) in ('Captain','Coach','Mentor','Member') and exists(select 1 from records r where r.id=record_id and r.team_id=comments.team_id));
create policy notifications_read on public.notifications for select to authenticated using(public.team_role(team_id) is not null and exists(select 1 from memberships m where m.team_id=notifications.team_id and m.user_id=auth.uid() and (cardinality(targets)=0 or 'Whole team'=any(targets) or m.subteams && targets)));
create policy activity_read on public.activity for select to authenticated using(public.team_role(team_id) is not null and public.team_role(team_id)<>'Parent/Sponsor');
create function public.audit_changes() returns trigger language plpgsql security definer set search_path=public as $$
declare t uuid; rid uuid; b jsonb; a jsonb; k text;
begin
 if tg_op<>'INSERT' then b:=to_jsonb(old); end if;
 if tg_op<>'DELETE' then a:=to_jsonb(new); end if;
 if tg_table_name='memberships' then b:=b-'photo'; a:=a-'photo'; end if;
 t:=(case when tg_table_name='teams' then coalesce(a,b)->>'id' else coalesce(a,b)->>'team_id' end)::uuid;
 rid:=(coalesce(a,b)->>'id')::uuid;
 k:=coalesce(coalesce(a,b)->>'kind',tg_table_name);
 insert into activity(team_id,actor_id,action,kind,record_id,before_data,after_data) values(t,auth.uid(),tg_op,k,rid,b,a);
 if tg_table_name='records' and tg_op='INSERT' then
  if new.kind='announcements' then
   insert into notifications(team_id,title,targets) values(new.team_id,new.data->>'title',array(select jsonb_array_elements_text(coalesce(new.data->'targets','[]'::jsonb))));
  end if;
 end if;
 return coalesce(new,old);
end $$;
create trigger audit_records after insert or update or delete on public.records for each row execute function public.audit_changes();
create trigger audit_members after insert or update or delete on public.memberships for each row execute function public.audit_changes();
create trigger audit_teams after insert or update on public.teams for each row execute function public.audit_changes();
create trigger audit_comments after insert on public.comments for each row execute function public.audit_changes();
create function public.guard_record_update() returns trigger language plpgsql set search_path=public as $$ begin if new.team_id<>old.team_id or new.id<>old.id or new.kind<>old.kind or new.created_by<>old.created_by then raise exception 'Record identity cannot change';end if;new.updated_at:=now();return new;end $$;
create trigger guard_record before update on public.records for each row execute function public.guard_record_update();
create function public.validate_record() returns trigger language plpgsql set search_path=public as $$
declare k text;v jsonb;
begin
 if jsonb_typeof(new.data)<>'object' or octet_length(new.data::text)>250000 then raise exception 'Invalid or oversized record';end if;
 for k,v in select * from jsonb_each(new.data) loop
  if k in ('amount','received','pledged','quantity','cost','weight','length','width','height','horizontal','vertical','motors','servos','cube','lowStock','hours','reached','professionals','hiveTime','flowerTime','hiveHit','flowerHit','intake','performance','reliability','simplicity','likelihood','impact','cycle','points','nectar','leftovers','garden') and jsonb_typeof(v)='number' and (v::text)::numeric<0 then raise exception 'Negative number: %',k;end if;
  if k in ('hiveHit','flowerHit','intake') and jsonb_typeof(v)='number' and (v::text)::numeric>100 then raise exception 'Percentage exceeds 100';end if;
  if k in ('amount','received','pledged') and jsonb_typeof(v)<>'number' then raise exception 'Money fields must be numbers';end if;
 end loop;
 return new;
end $$;
create trigger validate_record before insert or update on public.records for each row execute function public.validate_record();
create function public.create_team(profile jsonb,full_name text,grade_value text default '') returns uuid language plpgsql security definer set search_path=public as $$
declare t uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 if length(trim(profile->>'name'))<1 or length(trim(full_name))<1 then raise exception 'Team and full name required';end if;
 insert into teams(owner_id,name,number,school,season,location,logo) values(auth.uid(),profile->>'name',coalesce(profile->>'number',''),coalesce(profile->>'school',''),coalesce(profile->>'season',''),coalesce(profile->>'location',''),coalesce(profile->>'logo','')) returning id into t;
 insert into memberships(team_id,user_id,name,grade,requested_role,role,status) values(t,auth.uid(),full_name,grade_value,'Captain','Captain','approved');
 return t;
end $$;
create function public.create_email_invite(t uuid,invite_email text) returns text language plpgsql security definer set search_path=public as $$
declare normalized text:=lower(trim(coalesce(invite_email,''))); raw text; code text;
begin
 if not public.team_admin(t) then raise exception 'Captain or coach required';end if;
 if length(normalized)>254 or normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Valid email required';end if;
 update email_invites set revoked_at=now() where team_id=t and lower(email)=normalized and used_at is null and revoked_at is null;
 raw:=upper(md5(gen_random_uuid()::text||gen_random_uuid()::text));
 code:=substr(raw,1,4)||'-'||substr(raw,5,4)||'-'||substr(raw,9,4)||'-'||substr(raw,13,4)||'-'||substr(raw,17,4);
 insert into email_invites(team_id,email,token_hash) values(t,normalized,md5(code));
 return code;
end $$;
create function public.request_join(code text,full_name text,grade_value text,desired_role text,teams_value text[]) returns uuid language plpgsql security definer set search_path=public as $$
declare t uuid; invite_id uuid; account_email text;
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 select lower(email) into account_email from auth.users where id=auth.uid();
 select id,team_id into invite_id,t from email_invites where token_hash=md5(upper(trim(code))) and lower(email)=account_email and used_at is null and revoked_at is null and expires_at>now() for update;
 if invite_id is null then raise exception 'Invite code invalid, expired, or already used for this account';end if;
 if length(trim(full_name))<1 or desired_role not in ('Captain','Coach','Mentor','Member','Parent/Sponsor') then raise exception 'Invalid profile';end if;
 insert into memberships(team_id,user_id,name,grade,requested_role,role,subteams,status) values(t,auth.uid(),full_name,grade_value,desired_role,'Member',teams_value,'pending');
 update email_invites set used_at=now(),used_by=auth.uid() where id=invite_id;
 return t;
end $$;
create function public.manage_member(member_id uuid,new_role text,new_status text,allow_edit boolean default false,remove_member boolean default false) returns void language plpgsql security definer set search_path=public as $$
declare m memberships;owner uuid;
begin
 select * into m from memberships where id=member_id;
 if not public.team_admin(m.team_id) then raise exception 'Captain or coach required';end if;
 select owner_id into owner from teams where id=m.team_id;
 if m.user_id=owner and (remove_member or new_role<>'Captain' or new_status<>'approved') then raise exception 'Transfer ownership before changing the owner';end if;
 if new_role not in ('Captain','Coach','Mentor','Member','Parent/Sponsor') or new_status not in ('approved','pending','denied') then raise exception 'Invalid role or status';end if;
 if remove_member then delete from memberships where id=member_id;else update memberships set role=new_role,status=new_status,mentor_edit=allow_edit where id=member_id;end if;
end $$;
create function public.transfer_ownership(t uuid,to_user uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from teams where id=t and owner_id=auth.uid()) then raise exception 'Current owner required';end if;
 if not exists(select 1 from memberships where team_id=t and user_id=to_user and status='approved') then raise exception 'Approved member required';end if;
 update memberships set role='Captain' where team_id=t and user_id=to_user;
 update teams set owner_id=to_user where id=t;
end $$;
create function public.update_preferences(t uuid,notify boolean,welcome boolean) returns void language plpgsql security definer set search_path=public as $$ begin update memberships set notification_preferences=notify,onboarded=welcome where team_id=t and user_id=auth.uid();end $$;
create function public.update_own_profile(t uuid,new_display_name text,new_bio text,new_photo text) returns void language plpgsql security definer set search_path=public as $$ begin
 if length(trim(coalesce(new_display_name,''))) not between 1 and 60 then raise exception 'Display name must be 1 to 60 characters'; end if;
 if length(coalesce(new_bio,''))>240 then raise exception 'Bio must be 240 characters or fewer'; end if;
 if length(coalesce(new_photo,''))>200000 or (coalesce(new_photo,'')<>'' and new_photo !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$') then raise exception 'Invalid profile photo'; end if;
 update memberships set display_name=trim(new_display_name),bio=trim(coalesce(new_bio,'')),photo=coalesce(new_photo,'') where team_id=t and user_id=auth.uid() and status='approved';
 if not found then raise exception 'Approved membership required'; end if;
end $$;
create function public.finance_summary(t uuid) returns jsonb language plpgsql security definer set search_path=public as $$ declare received numeric;spent numeric;pledged numeric;begin if public.team_role(t) is null then raise exception 'Approved member required';end if;select coalesce(sum((data->>'received')::numeric),0),coalesce(sum((data->>'pledged')::numeric),0) into received,pledged from records where team_id=t and kind='income';select coalesce(sum((data->>'amount')::numeric),0) into spent from records where team_id=t and kind='expenses';return jsonb_build_object('received',received,'spent',spent,'balance',received-spent,'pledged',pledged);end $$;
create function public.dashboard_summary(t uuid) returns jsonb language plpgsql security definer set search_path=public as $$ begin if public.team_role(t) is null then raise exception 'Approved member required';end if;return jsonb_build_object('robot',(select data from records where team_id=t and kind='robot' order by created_at limit 1),'events',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',data->>'name','date',data->>'date')),'[]') from records where team_id=t and kind='events'));end $$;
create function public.delete_team(t uuid, expected_name text, check_only boolean default false) returns void language plpgsql security definer set search_path='' as $$
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
 -- Clear children before the parent so audit triggers cannot write new rows for a deleted team.
 delete from public.comments where team_id=t;
 delete from public.records where team_id=t;
 delete from public.memberships where team_id=t;
 delete from public.notifications where team_id=t;
 delete from public.activity where team_id=t;
 delete from public.teams where id=t;
end $$;
revoke execute on all functions in schema public from public,anon;
grant execute on function public.team_role(uuid),public.team_admin(uuid),public.team_editor(uuid),public.team_view(uuid,text),public.create_team(jsonb,text,text),public.create_email_invite(uuid,text),public.request_join(text,text,text,text,text[]),public.manage_member(uuid,text,text,boolean,boolean),public.transfer_ownership(uuid,uuid),public.update_preferences(uuid,boolean,boolean),public.update_own_profile(uuid,text,text,text),public.finance_summary(uuid),public.dashboard_summary(uuid),public.delete_team(uuid,text,boolean) to authenticated;
grant select on public.memberships,public.notifications,public.activity to authenticated;
grant select,insert,update,delete on public.records to authenticated;
grant select,insert on public.comments to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('team-files','team-files',false,52428800,array['image/png','image/jpeg','image/webp','application/pdf','text/plain','application/octet-stream']);
create policy files_read on storage.objects for select to authenticated using(bucket_id='team-files' and public.team_role(((storage.foldername(name))[1])::uuid) in ('Captain','Coach','Mentor','Member'));
create policy files_upload on storage.objects for insert to authenticated with check(bucket_id='team-files' and public.team_editor(((storage.foldername(name))[1])::uuid) and (storage.foldername(name))[2]=auth.uid()::text);
create policy files_delete on storage.objects for delete to authenticated using(bucket_id='team-files' and public.team_admin(((storage.foldername(name))[1])::uuid));
-- Enable postgres changes for records. Presence does not require a publication.
alter publication supabase_realtime add table public.records;
-- Private Presence authorization; disable "Allow public access" in Realtime settings.
create policy team_presence_read on realtime.messages for select to authenticated using(extension='presence' and exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.status='approved' and realtime.topic()='team:'||m.team_id::text));
create policy team_presence_write on realtime.messages for insert to authenticated with check(extension='presence' and exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.status='approved' and realtime.topic()='team:'||m.team_id::text));
