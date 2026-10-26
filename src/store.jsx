import { useState, useEffect, useCallback } from 'react';
import { supabase } from './client';
import { seed, demoTeam } from './seed';
import { entities } from './schema';
import { uid, canEdit, canDelete } from './domain';
import { removeTeamFiles } from './delete-team';
import { validateCadFile } from './cad';
const EMPTY = () => Object.fromEntries(Object.keys(entities).map((k) => [k, []]));
function readDemo() {
  try {
    return JSON.parse(localStorage.getItem('cnp-demo-v1'));
  } catch {
    return null;
  }
}
export function useWorkspace() {
  const [demo, setDemo] = useState(false),
    [user, setUser] = useState(null),
    [team, setTeam] = useState(null),
    [member, setMember] = useState(null),
    [members, setMembers] = useState([]),
    [data, setData] = useState(EMPTY),
    [activity, setActivity] = useState([]),
    [notifications, setNotifications] = useState([]),
    [presence, setPresence] = useState([]),
    [summary, setSummary] = useState(null),
    [dashboard, setDashboard] = useState(null),
    [busy, setBusy] = useState(false),
    [authLoading, setAuthLoading] = useState(!!supabase),
    [error, setError] = useState('');
  const checked = (r) => {
    if (r.error) throw r.error;
    return r.data;
  };
  const refresh = useCallback(async () => {
    if (!supabase || demo) return;
    setBusy(true);
    try {
      const session = checked(await supabase.auth.getSession());
      if (!session?.session) {
        setUser(null);
        setTeam(null);
        setMember(null);
        setData(EMPTY());
        return;
      }
      const u = checked(await supabase.auth.getUser())?.user;
      if (!u) {
        setUser(null);
        setTeam(null);
        setMember(null);
        setData(EMPTY());
        return;
      }
      setUser(u);
      const links = checked(
        await supabase.from('memberships').select('*').eq('user_id', u.id).order('created_at'),
      );
      const m =
        links.find((x) => x.status === 'approved') ||
        links.find((x) => x.status === 'pending') ||
        links[0];
      if (!m) {
        setTeam(null);
        setMember(null);
        setMembers([]);
        setData(EMPTY());
        setActivity([]);
        setNotifications([]);
        setSummary(null);
        setDashboard(null);
        return;
      }
      setMember(m);
      const t = checked(await supabase.from('teams').select('*').eq('id', m.team_id).single());
      setTeam(t);
      if (m.status !== 'approved') {
        setData(EMPTY());
        return;
      }
      const rows = checked(
        await supabase.from('records').select('*').eq('team_id', t.id).order('created_at'),
      );
      const next = EMPTY();
      rows.forEach((r) => next[r.kind]?.push({
        ...r.data,
        ...(r.kind === 'sessions' && r.data?.attendanceCheckin
          ? { attendanceUserId: r.created_by }
          : {}),
        id: r.id,
      }));
      setData(next);
      setMembers(
        checked(
          await supabase.from('memberships').select('*').eq('team_id', t.id).order('created_at'),
        ),
      );
      setNotifications(
        checked(
          await supabase
            .from('notifications')
            .select('*')
            .eq('team_id', t.id)
            .order('created_at', { ascending: false })
            .limit(100),
        ),
      );
      setSummary(checked(await supabase.rpc('finance_summary', { t: t.id })));
      setDashboard(checked(await supabase.rpc('dashboard_summary', { t: t.id })));
      if (m.role !== 'Parent/Sponsor')
        setActivity(
          checked(
            await supabase
              .from('activity')
              .select('*')
              .eq('team_id', t.id)
              .order('created_at', { ascending: false })
              .limit(200),
          ),
        );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      setAuthLoading(false);
    }
  }, [demo]);
  useEffect(() => {
    if (!supabase) return;
    refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setTimeout(refresh, 0);
    });
    return () => subscription.unsubscribe();
  }, [refresh]);
  useEffect(() => {
    if (demo)
      localStorage.setItem(
        'cnp-demo-v1',
        JSON.stringify({ data, team, activity, member, members, notifications }),
      );
  }, [demo, data, team, activity, member, members, notifications]);
  useEffect(() => {
    if (demo || !team || member?.status !== 'approved' || !supabase) return;
    const ch = supabase.channel(`team:${team.id}`, {
      config: { private: true, presence: { key: user.id } },
    });
    ch.on('presence', { event: 'sync' }, () =>
      setPresence(Object.values(ch.presenceState()).flat()),
    ).subscribe(async (status) => {
      if (status === 'SUBSCRIBED')
        await ch.track({ name: member.name, role: member.role, user_id: user.id });
    });
    const updates = supabase
      .channel(`records:${team.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'records', filter: `team_id=eq.${team.id}` },
        refresh,
      )
      .subscribe();
    const timer = setInterval(refresh, 45000);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(ch);
      supabase.removeChannel(updates);
      setPresence([]);
    };
  }, [demo, team?.id, user?.id, member?.status, member?.role, refresh]);
  function enterDemo() {
    const saved = readDemo();
    const m = saved?.member || {
      id: 'demo-owner',
      user_id: 'demo-user',
      name: 'Avery Chen',
      grade: '11',
      role: 'Captain',
      subteams: ['Mechanical', 'Drive Team'],
      status: 'approved',
      onboarded: true,
      notification_preferences: true,
    };
    setTeam(saved?.team || demoTeam);
    setMember(m);
    setMembers(saved?.members || [m]);
    setData(saved?.data ? { ...EMPTY(), ...saved.data } : seed());
    setActivity(saved?.activity || []);
    setNotifications(saved?.notifications || []);
    setUser({ id: 'demo-user' });
    setDemo(true);
    setError('');
  }
  function log(action, kind, id, before, after) {
    setActivity((a) => [
      {
        id: uid(),
        action,
        kind,
        record_id: id,
        before_data: before,
        after_data: after,
        actor_id: member.name,
        created_at: new Date().toISOString(),
      },
      ...a,
    ]);
  }
  async function save(kind, record) {
    if (!canEdit(member.role, member.mentor_edit)) throw Error('Your role is read-only.');
    const id = record.id || uid(),
      old = data[kind].find((r) => r.id === id),
      next = { ...record, id };
    if (demo) {
      setData((d) => ({
        ...d,
        [kind]: old ? d[kind].map((r) => (r.id === id ? next : r)) : [...d[kind], next],
      }));
      log(old ? 'UPDATE' : 'INSERT', kind, id, old, next);
      if (kind === 'announcements' && !old)
        setNotifications((n) => [
          {
            id: uid(),
            title: next.title,
            targets: next.targets,
            created_at: new Date().toISOString(),
          },
          ...n,
        ]);
      return next;
    }
    const { id: _, ...payload } = record;
    if (old)
      checked(
        await supabase
          .from('records')
          .update({ data: payload })
          .eq('id', id)
          .eq('team_id', team.id),
      );
    else
      checked(
        await supabase
          .from('records')
          .insert({ id, team_id: team.id, kind, data: payload, created_by: user.id }),
      );
    await refresh();
    return next;
  }
  async function remove(kind, id) {
    if (!canDelete(member.role)) throw Error('Captain or coach required to delete.');
    if (demo) {
      log(
        'DELETE',
        kind,
        id,
        data[kind].find((r) => r.id === id),
        null,
      );
      setData((d) => ({ ...d, [kind]: d[kind].filter((r) => r.id !== id) }));
      return;
    }
    checked(await supabase.from('records').delete().eq('id', id).eq('team_id', team.id));
    await refresh();
  }
  async function rpc(name, args) {
    const result = checked(await supabase.rpc(name, args));
    await refresh();
    return result;
  }
  async function updateTeam(profile) {
    if (demo) {
      log('UPDATE', 'teams', team.id, team, { ...team, ...profile });
      setTeam((t) => ({ ...t, ...profile }));
      return;
    }
    checked(await supabase.from('teams').update(profile).eq('id', team.id));
    await refresh();
  }
  async function deleteTeam() {
    if (!team || !user || team.owner_id !== user.id)
      throw Error('Only the team owner can delete the team.');
    if (demo) {
      localStorage.removeItem('cnp-demo-v1');
      setDemo(false);
      setUser(null);
      setTeam(null);
      setMember(null);
      setMembers([]);
      setData(EMPTY());
      return;
    }
    const args = { t: team.id, expected_name: team.name };
    checked(await supabase.rpc('delete_team', { ...args, check_only: true }));
    await removeTeamFiles(supabase, team.id);
    checked(await supabase.rpc('delete_team', { ...args, check_only: false }));
    await refresh();
  }
  async function manage(m, changes, removeMember = false) {
    if (demo) {
      if (m.user_id === team.owner_id && (removeMember || changes.role !== 'Captain'))
        throw Error('Transfer ownership first');
      const next = { ...m, ...changes };
      setMembers((a) =>
        removeMember ? a.filter((x) => x.id !== m.id) : a.map((x) => (x.id === m.id ? next : x)),
      );
      if (m.id === member.id) setMember(next);
      log(removeMember ? 'DELETE' : 'UPDATE', 'memberships', m.id, m, next);
      return;
    }
    await rpc('manage_member', {
      member_id: m.id,
      new_role: changes.role || m.role,
      new_status: changes.status || m.status,
      allow_edit: changes.mentor_edit ?? m.mentor_edit,
      remove_member: removeMember,
    });
  }
  async function upload(file, options = {}) {
    const extension = options.cad
      ? validateCadFile(file)
      : file.name.split('.').pop().toLowerCase();
    if (!options.cad && file.size > 10485760) throw Error('Maximum file size is 10 MB.');
    if (
      !options.cad &&
      !['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'].includes(
        file.type,
      )
    )
      throw Error('Use PNG, JPEG, WebP, PDF or plain text.');
    if (demo)
      throw Error(
        'Connect Supabase to upload shared files. You can use a receipt link in demo mode.',
      );
    const path = `${team.id}/${user.id}/${uid()}.${extension}`;
    checked(
      await supabase.storage.from('team-files').upload(path, file, {
        contentType: options.cad ? 'application/octet-stream' : file.type,
      }),
    );
    return `storage:${path}`;
  }
  async function fileUrl(value, downloadName) {
    if (value.startsWith('storage:'))
      return checked(
        await supabase.storage
          .from('team-files')
          .createSignedUrl(
            value.slice(8),
            60,
            downloadName ? { download: downloadName } : undefined,
          ),
      ).signedUrl;
    if (/^https?:\/\//i.test(value)) return value;
    throw Error('Invalid file link');
  }
  async function preferences(notify, onboarded) {
    if (demo) {
      setMember((m) => ({ ...m, notification_preferences: notify, onboarded }));
      return;
    }
    await rpc('update_preferences', { t: team.id, notify, welcome: onboarded });
  }
  async function logout() {
    if (supabase && !demo) await supabase.auth.signOut();
    setDemo(false);
    setUser(null);
    setTeam(null);
    setMember(null);
    setData(EMPTY());
    setSummary(null);
    setDashboard(null);
    setPresence([]);
  }
  return {
    demo,
    user,
    team,
    member,
    members,
    data,
    activity,
    notifications,
    presence,
    summary,
    dashboard,
    busy,
    authLoading,
    error,
    setError,
    refresh,
    enterDemo,
    save,
    remove,
    rpc,
    updateTeam,
    deleteTeam,
    manage,
    upload,
    fileUrl,
    preferences,
    logout,
    setTeam,
    setMember,
  };
}
