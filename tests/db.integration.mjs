import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;create schema realtime;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,storage,realtime to authenticated;grant execute on function auth.uid() to authenticated;
create function public.gen_random_bytes(n int) returns bytea language sql as $$ select decode(substr(repeat(md5(random()::text),20),1,n*2),'hex') $$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;
create table realtime.messages(extension text,topic text);alter table realtime.messages enable row level security;
create function realtime.topic() returns text language sql as $$ select current_setting('realtime.topic',true) $$;
grant select,insert,delete on storage.objects to authenticated;grant select,insert on realtime.messages to authenticated;`);
let sql = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
sql = sql
  .replace('create extension if not exists pgcrypto;', '')
  .replace('alter publication supabase_realtime add table public.records;', '');
await db.exec(sql);
// Reapply the upgrade against an existing schema, as the live project will do.
await db.exec('drop function public.delete_team(uuid,text,boolean)');
await db.exec(
  await readFile(
    new URL('../supabase/migrations/20261025_delete_team.sql', import.meta.url),
    'utf8',
  ),
);
await db.exec(
  "update storage.buckets set file_size_limit=10485760, allowed_mime_types=array['image/png','image/jpeg','image/webp','application/pdf','text/plain'] where id='team-files'",
);
await db.exec(
  await readFile(new URL('../supabase/migrations/20261025_cad_files.sql', import.meta.url), 'utf8'),
);
await db.exec(
  await readFile(new URL('../supabase/migrations/20261025_build_log.sql', import.meta.url), 'utf8'),
);
// Simulate the existing production schema before applying the personal-profile upgrade.
await db.exec(`drop function public.update_own_profile(uuid,text,text,text);
alter table public.memberships drop column display_name, drop column bio, drop column photo;`);
await db.exec(
  await readFile(
    new URL('../supabase/migrations/20261029_personal_profiles.sql', import.meta.url),
    'utf8',
  ),
);
await db.exec(
  await readFile(
    new URL('../supabase/migrations/20261029_one_time_email_invites.sql', import.meta.url),
    'utf8',
  ),
);
const owner = '10000000-0000-0000-0000-000000000001',
  member = '10000000-0000-0000-0000-000000000002',
  parent = '10000000-0000-0000-0000-000000000003',
  outsider = '10000000-0000-0000-0000-000000000004',
  mentor = '10000000-0000-0000-0000-000000000005';
await db.query('insert into auth.users(id,email) values ($1,$6),($2,$7),($3,$8),($4,$9),($5,$10)', [
  owner,
  member,
  parent,
  outsider,
  mentor,
  'captain@example.com',
  'member@example.com',
  'parent@example.com',
  'outsider@example.com',
  'mentor@example.com',
]);
async function as(id) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec('set role authenticated');
}
let count = 0;
function ok(value, message) {
  assert.ok(value, message);
  count++;
  console.log('PASS', message);
}
const cadBucket = (
  await db.query(
    "select public, file_size_limit, allowed_mime_types from storage.buckets where id='team-files'",
  )
).rows[0];
ok(
  cadBucket.public === false &&
    Number(cadBucket.file_size_limit) === 52428800 &&
    cadBucket.allowed_mime_types.includes('application/octet-stream'),
  'CAD upgrade keeps the bucket private and allows 50 MB binary files',
);
async function rejects(fn, message) {
  await assert.rejects(fn);
  count++;
  console.log('PASS', message);
}
await as(owner);
const t = (
  await db.query("select create_team($1::jsonb,'Captain One','11') as id", [
    JSON.stringify({ name: 'Test team', number: '30439', season: 'BIOBUZZ' }),
  ])
).rows[0].id;
const legacyCode = (await db.query('select join_code from teams where id=$1', [t])).rows[0]
  .join_code;
const memberCode = (
  await db.query("select create_email_invite($1,'member@example.com') as code", [t])
).rows[0].code;
ok(memberCode.length === 24, 'Captain creates a unique one-time email code');
ok(
  (await db.query('select role from memberships')).rows[0].role === 'Captain',
  'Team creation assigns approved captain',
);
ok(
  (await db.query('select * from activity')).rows.length === 2,
  'Team and membership creation audited',
);
await db.query('select update_own_profile($1,$2,$3,$4)', [
  t,
  'Ace Captain',
  'Build lead',
  'data:image/png;base64,aGVsbG8=',
]);
const ownProfile = (
  await db.query('select name,display_name,bio,photo from memberships where user_id=$1', [owner])
).rows[0];
ok(
  ownProfile.name === 'Captain One' &&
    ownProfile.display_name === 'Ace Captain' &&
    ownProfile.bio === 'Build lead' &&
    ownProfile.photo.startsWith('data:image/png'),
  'Personal profile saves without changing member identity',
);
ok(
  (
    await db.query(
      "select after_data from activity where kind='memberships' order by created_at desc limit 1",
    )
  ).rows[0].after_data.photo === undefined,
  'Audit history omits profile photo bytes',
);
await db.query("insert into records(team_id,kind,data) values ($1,'expenses',$2)", [
  t,
  { description: 'Private purchase', amount: 25 },
]);
await db.query("insert into records(team_id,kind,data) values ($1,'income',$2)", [
  t,
  { company: 'Private contact', received: 100, pledged: 120 },
]);
await db.query("insert into records(team_id,kind,data) values ($1,'announcements',$2)", [
  t,
  { title: 'Hello crew', targets: ['Whole team'] },
]);
ok(
  (await db.query('select * from notifications')).rows.length === 1,
  'Announcement generates in-app notification',
);
await rejects(
  () => db.query('update teams set owner_id=$1 where id=$2', [outsider, t]),
  'Direct ownership mutation denied',
);
await as(outsider);
await rejects(
  () => db.query('select update_own_profile($1,$2,$3,$4)', [t, 'Intruder', '', '']),
  'Unrelated account cannot edit a team profile',
);
ok(
  (await db.query('select * from records')).rows.length === 0,
  'Unrelated account cannot read team records',
);
await rejects(
  () => db.query('select finance_summary($1)', [t]),
  'Unrelated account cannot read finance summary',
);
await rejects(
  () => db.query("select create_email_invite($1,'outsider@example.com')", [t]),
  'Unrelated account cannot create email invites',
);
await as(member);
await rejects(
  () =>
    db.query("select request_join($1,'Member Two','10','Captain',array['Programming'])", [
      legacyCode,
    ]),
  'Old reusable team code cannot join',
);
await db.query("select request_join($1,'Member Two','10','Captain',array['Programming'])", [
  memberCode,
]);
await rejects(
  () => db.query('select * from email_invites'),
  'Recipient cannot read private invite tokens',
);
await db.exec('reset role');
ok(
  (await db.query('select used_at from email_invites where token_hash=md5($1)', [memberCode]))
    .rows[0].used_at !== null,
  'One-time code is spent after join request',
);
await as(member);
ok(
  (await db.query('select role,status from memberships where user_id=$1', [member])).rows[0]
    .role === 'Member',
  'Requested captain role does not auto-grant access',
);
ok(
  (await db.query('select * from records')).rows.length === 0,
  'Pending member cannot read records',
);
await rejects(
  () =>
    db.query(
      "insert into memberships(team_id,user_id,name,role,status) values ($1,$2,'Bypass','Captain','approved')",
      [t, outsider],
    ),
  'Direct membership escalation denied',
);
await as(owner);
const m = (await db.query('select * from memberships where user_id=$1', [member])).rows[0];
await db.query("select manage_member($1,'Member','approved',false,false)", [m.id]);
await as(member);
await db.query(
  'insert into records(team_id,kind,data) values ($1,\'tasks\',\'{"title":"Test task"}\')',
  [t],
);
ok(
  (await db.query("select * from records where kind='tasks'")).rows.length === 1,
  'Approved member can create task',
);
await db.query("insert into records(team_id,kind,data) values ($1,'build',$2)", [
  t,
  { date: '2026-10-25', whatDone: 'Assembled intake', author: 'Member Two' },
]);
ok(
  (await db.query("select * from records where kind='build'")).rows.length === 1,
  'Approved member can create a shared build log entry',
);
ok(
  (await db.query("delete from records where kind='tasks' returning id")).rows.length === 0,
  'Member cannot delete operational records',
);
await rejects(
  () =>
    db.query("update teams set name='Hacked' where id=$1 returning id", [t]).then((r) => {
      if (!r.rows.length) throw Error('denied');
    }),
  'Member cannot edit team settings',
);
await rejects(
  () =>
    db.query("insert into records(team_id,kind,data) values ($1,'expenses','{\"amount\":-1}')", [
      t,
    ]),
  'Negative money rejected at database boundary',
);
await as(parent);
await rejects(
  () =>
    db.query("select request_join($1,'Sponsor Three','','Parent/Sponsor',array[]::text[])", [
      memberCode,
    ]),
  'Spent code cannot be used by another account',
);
await as(owner);
const parentCode = (
  await db.query("select create_email_invite($1,'parent@example.com') as code", [t])
).rows[0].code;
await as(outsider);
await rejects(
  () =>
    db.query("select request_join($1,'Outsider Four','','Member',array[]::text[])", [parentCode]),
  'Invite only works for the addressed email',
);
await as(parent);
await db.query("select request_join($1,'Sponsor Three','','Parent/Sponsor',array[]::text[])", [
  parentCode,
]);
await as(owner);
const p = (await db.query('select * from memberships where user_id=$1', [parent])).rows[0];
await db.query("select manage_member($1,'Parent/Sponsor','approved',false,false)", [p.id]);
await as(parent);
const visible = (await db.query('select kind from records')).rows;
ok(
  visible.length === 1 && visible[0].kind === 'announcements',
  'Sponsor cannot read expense or funding contact records',
);
const f = (await db.query('select finance_summary($1) as result', [t])).rows[0].result;
ok(
  f.received === 100 && f.spent === 25 && f.balance === 75,
  'Sponsor receives safe aggregate finance summary',
);
ok(
  (await db.query('select * from activity')).rows.length === 0,
  'Sponsor cannot read audit payloads',
);
await rejects(
  () => db.query("insert into records(team_id,kind,data) values ($1,'outreach','{}')", [t]),
  'Sponsor cannot insert outreach records',
);
await as(mentor);
await as(owner);
const mentorCode = (
  await db.query("select create_email_invite($1,'mentor@example.com') as code", [t])
).rows[0].code;
await as(mentor);
await db.query("select request_join($1,'Mentor Five','','Mentor',array[]::text[])", [mentorCode]);
await as(owner);
const me = (await db.query('select * from memberships where user_id=$1', [mentor])).rows[0];
await db.query("select manage_member($1,'Mentor','approved',false,false)", [me.id]);
await as(mentor);
await rejects(
  () => db.query("insert into records(team_id,kind,data) values ($1,'tasks','{}')", [t]),
  'Mentor cannot edit without permission',
);
const target = (await db.query("select id from records where kind='tasks'")).rows[0].id;
await db.query('insert into comments(team_id,record_id,message) values ($1,$2,$3)', [
  t,
  target,
  'Review comment',
]);
ok((await db.query('select * from comments')).rows.length === 1, 'Read-only mentor can comment');
await as(owner);
await db.query("select manage_member($1,'Mentor','approved',true,false)", [me.id]);
await as(mentor);
await db.query("insert into records(team_id,kind,data) values ($1,'tasks','{}')", [t]);
ok(true, 'Mentor can edit after captain grant');
await as(owner);
const own = (await db.query('select id from memberships where user_id=$1', [owner])).rows[0];
await rejects(
  () => db.query("select manage_member($1,'Member','approved',false,false)", [own.id]),
  'Owner cannot be demoted before transfer',
);
await db.query('select transfer_ownership($1,$2)', [t, member]);
ok(
  (await db.query('select owner_id from teams where id=$1', [t])).rows[0].owner_id === member,
  'Owner transfer updates team and promotes recipient',
);
await rejects(
  () => db.query('select delete_team($1,$2,false)', [t, 'Test team']),
  'Former owner cannot delete the team',
);
await as(member);
await rejects(
  () => db.query('select delete_team($1,$2,false)', [t, 'Wrong team']),
  'Team deletion requires the exact name',
);
await db.query('select delete_team($1,$2,true)', [t, 'Test team']);
ok(
  (await db.query('select id from teams where id=$1', [t])).rows.length === 1,
  'Deletion preflight does not remove team data',
);
await db.exec('reset role');
await db.query('insert into storage.objects(bucket_id,name) values ($1,$2)', [
  'team-files',
  `${t}/${member}/receipt.pdf`,
]);
await as(member);
await rejects(
  () => db.query('select delete_team($1,$2,false)', [t, 'Test team']),
  'Team deletion refuses to orphan uploaded files',
);
await db.exec('reset role');
await db.query('delete from storage.objects where bucket_id=$1 and name=$2', [
  'team-files',
  `${t}/${member}/receipt.pdf`,
]);
await as(member);
await db.query('select delete_team($1,$2,false)', [t, 'Test team']);
await db.exec('reset role');
for (const table of ['teams', 'memberships', 'records', 'comments', 'notifications', 'activity'])
  ok(
    (
      await db.query(
        `select id from public.${table} where team_id=$1`.replace(
          'teams where team_id',
          'teams where id',
        ),
        [t],
      )
    ).rows.length === 0,
    `Team deletion removes ${table}`,
  );
ok(
  (await db.query('select id from auth.users where id=$1', [member])).rows.length === 1,
  'Team deletion keeps the owner account',
);
console.log(`${count} database checks passed`);
await db.close();
