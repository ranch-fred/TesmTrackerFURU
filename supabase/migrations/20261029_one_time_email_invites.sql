-- Run in the existing Supabase project's SQL editor before sending new invites.
-- Existing reusable team codes stop working after this migration.
create table if not exists public.email_invites(
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.teams(id) on delete cascade,
 email text not null,
 token_hash text unique not null,
 expires_at timestamptz not null default now()+interval '7 days',
 used_at timestamptz,
 used_by uuid references auth.users(id),
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists email_invites_team_email_idx on public.email_invites(team_id,lower(email)) where used_at is null and revoked_at is null;
alter table public.email_invites enable row level security;
revoke all on public.email_invites from public,anon,authenticated;

create or replace function public.create_email_invite(t uuid,invite_email text) returns text language plpgsql security definer set search_path=public as $$
declare normalized text:=lower(trim(coalesce(invite_email,''))); raw text; code text;
begin
 if not public.team_admin(t) then raise exception 'Captain or coach required';end if;
 if length(normalized)>254 or normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Valid email required';end if;
 update email_invites set revoked_at=now() where team_id=t and lower(email)=normalized and used_at is null and revoked_at is null;
 raw:=upper(encode(gen_random_bytes(10),'hex'));
 code:=substr(raw,1,4)||'-'||substr(raw,5,4)||'-'||substr(raw,9,4)||'-'||substr(raw,13,4)||'-'||substr(raw,17,4);
 insert into email_invites(team_id,email,token_hash) values(t,normalized,md5(code));
 return code;
end $$;

create or replace function public.request_join(code text,full_name text,grade_value text,desired_role text,teams_value text[]) returns uuid language plpgsql security definer set search_path=public as $$
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

drop function if exists public.rotate_invite(uuid);
revoke execute on function public.create_email_invite(uuid,text) from public,anon;
grant execute on function public.create_email_invite(uuid,text),public.request_join(text,text,text,text,text[]) to authenticated;
