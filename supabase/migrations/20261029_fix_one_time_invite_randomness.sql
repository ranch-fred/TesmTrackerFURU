-- Repair existing one-time invite installations. The built-in UUID generator
-- works when pgcrypto's gen_random_bytes lives outside the public search path.
create or replace function public.create_email_invite(t uuid,invite_email text) returns text language plpgsql security definer set search_path=public as $$
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
