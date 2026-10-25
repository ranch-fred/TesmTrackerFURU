import React, { useState } from 'react';
import {
  Copy,
  RefreshCw,
  Download,
  Upload,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { roles, entities, subteams } from './schema';
import { canDelete, canEdit, uid } from './domain';
import { download, csv } from './exports';
import { Modal, Badge } from './Records';
import { parseCSV, validateImport } from './importer';
export default function Settings({ w }) {
  const [tab, setTab] = useState(canDelete(w.member.role) ? 'profile' : 'preferences'),
    [note, setNote] = useState(''),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(null),
    [pending, setPending] = useState(null),
    [kind, setKind] = useState('expenses'),
    [busy, setBusy] = useState(false),
    [deleteOpen, setDeleteOpen] = useState(false),
    [deleteName, setDeleteName] = useState(''),
    [deleteError, setDeleteError] = useState('');
  const admin = canDelete(w.member.role);
  const owner = w.team.owner_id === w.user.id;
  const [profile, setProfile] = useState({
    name: w.team.name,
    number: w.team.number,
    school: w.team.school,
    season: w.team.season,
    location: w.team.location,
    logo: w.team.logo,
  });
  async function act(fn) {
    setError('');
    setNote('');
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    }
  }
  async function importFile(file) {
    setError('');
    try {
      const text = await file.text();
      let entries;
      if (file.name.toLowerCase().endsWith('.csv')) {
        entries = { [kind]: parseCSV(text, entities[kind].fields) };
      } else {
        const value = JSON.parse(text);
        entries = value.records || value.data || value;
      }
      const valid = validateImport(entries);
      setPending(valid);
    } catch (e) {
      setError(e.message);
    }
  }
  async function applyImport() {
    setBusy(true);
    await act(async () => {
      for (const [type, rows] of Object.entries(pending))
        for (const row of rows) {
          const { id, ...record } = row;
          await w.save(type, record);
        }
      setNote(
        'Import completed. Imported records received new IDs; existing records were preserved.',
      );
      setPending(null);
    });
    setBusy(false);
  }
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">TEAM / THE CONTROL ROOM</div>
        <h1>
          YOUR CREW. <span>YOUR CALL.</span>
        </h1>
        <p>Keep the workspace ready for the work.</p>
      </div>
      <div className="tabs page-tabs">
        {(admin
          ? [
              'profile',
              'members',
              'invites',
              'preferences',
              'data',
              ...(owner ? ['delete team'] : []),
            ]
          : ['preferences', ...(canEdit(w.member.role, w.member.mentor_edit) ? ['data'] : [])]
        ).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="error notice">
          {error}
        </p>
      )}
      {note && (
        <p role="status" className="success notice">
          {note}
        </p>
      )}
      {tab === 'profile' && admin && (
        <section className="panel settings-panel">
          <h2>Team profile</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                await w.updateTeam(profile);
                setNote('Team profile saved.');
              });
            }}
          >
            <div className="form-grid">
              {Object.entries({
                name: 'Team name',
                number: 'Team number',
                school: 'School / organization',
                season: 'Season',
                location: 'Location',
                logo: 'Logo URL',
              }).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    type={key === 'logo' ? 'url' : 'text'}
                    required={['name', 'number'].includes(key)}
                    value={profile[key] || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            <label>
              Upload team logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  act(async () => {
                    if (e.target.files[0]) {
                      const logo = await w.upload(e.target.files[0]);
                      setProfile((p) => ({ ...p, logo }));
                    }
                  })
                }
              />
            </label>
            <button className="primary">Save team profile</button>
          </form>
        </section>
      )}
      {tab === 'members' && admin && (
        <section className="panel">
          <div className="panel-heading">
            <h2>Members & requests</h2>
            <button className="outline" onClick={w.refresh}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
          <p className="note">
            Approval grants the selected role. Captains and coaches can administer the team. Roster
            roles do not grant account access.
          </p>
          {w.members.map((m) => (
            <div key={m.id} className="membership-row">
              <div>
                <strong>{m.name}</strong>
                <small>
                  Grade {m.grade} · {m.subteams?.join(', ') || 'No sub-team'}
                  <br />
                  Requested: {m.requested_role}
                </small>
              </div>
              <Badge>{m.status}</Badge>
              <select
                aria-label={`Role for ${m.name}`}
                value={m.role}
                onChange={(e) =>
                  setConfirm({
                    title: 'Change member role?',
                    run: () => w.manage(m, { ...m, role: e.target.value }),
                  })
                }
              >
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              {m.role === 'Mentor' && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={m.mentor_edit}
                    onChange={(e) =>
                      act(() => w.manage(m, { ...m, mentor_edit: e.target.checked }))
                    }
                  />{' '}
                  Allow edits
                </label>
              )}
              {m.status !== 'approved' && (
                <button
                  className="primary small"
                  onClick={() =>
                    setConfirm({
                      title: `Approve ${m.name}?`,
                      run: () => w.manage(m, { ...m, status: 'approved', role: m.requested_role }),
                    })
                  }
                >
                  Approve
                </button>
              )}
              {m.status === 'pending' && (
                <button
                  className="outline small"
                  onClick={() =>
                    setConfirm({
                      title: 'Deny this request?',
                      run: () => w.manage(m, { ...m, status: 'denied' }),
                    })
                  }
                >
                  Deny
                </button>
              )}
              <button
                className="text-button danger"
                onClick={() =>
                  setConfirm({ title: 'Remove this member?', run: () => w.manage(m, m, true) })
                }
              >
                Remove
              </button>
              {w.team.owner_id === w.user.id &&
                m.user_id !== w.user.id &&
                m.status === 'approved' && (
                  <button
                    className="text-button"
                    onClick={() =>
                      setConfirm({
                        title: `Transfer ownership to ${m.name}?`,
                        run: async () => {
                          if (w.demo) {
                            setNote('Ownership transfer is available with live accounts.');
                            return;
                          }
                          await w.rpc('transfer_ownership', { t: w.team.id, to_user: m.user_id });
                        },
                      })
                    }
                  >
                    Transfer ownership
                  </button>
                )}
            </div>
          ))}
        </section>
      )}
      {tab === 'invites' && admin && (
        <section className="panel settings-panel">
          <div className="eyebrow">BRING YOUR CREW</div>
          <h2>One code. A whole team.</h2>
          <p>New members request access. A captain or coach approves each request.</p>
          <div className="invite-code">{w.team.join_code}</div>
          <div className="inline">
            <button
              className="primary"
              onClick={() =>
                act(async () => {
                  await navigator.clipboard.writeText(
                    `${location.origin}/?invite=${w.team.join_code}`,
                  );
                  setNote('Invite link copied.');
                })
              }
            >
              <Copy size={16} /> Copy invite link
            </button>
            <button
              className="outline"
              onClick={() =>
                setConfirm({
                  title: 'Replace the join code?',
                  run: async () => {
                    if (w.demo) await w.updateTeam({ join_code: uid().slice(0, 8).toUpperCase() });
                    else await w.rpc('rotate_invite', { t: w.team.id });
                  },
                })
              }
            >
              <RefreshCw size={16} /> New code
            </button>
          </div>
          <p className="note">
            Rotating the code invalidates old invite links. Existing members keep access.
          </p>
        </section>
      )}
      {tab === 'preferences' && (
        <section className="panel settings-panel">
          <h2>Notifications</h2>
          <label className="check-label">
            <input
              type="checkbox"
              checked={w.member.notification_preferences}
              onChange={(e) => act(() => w.preferences(e.target.checked, w.member.onboarded))}
            />{' '}
            Show in-app announcement notifications
          </label>
          <p className="muted">
            Announcements are targeted to the whole team or your sub-teams. No email is sent by this
            app.
          </p>
        </section>
      )}
      {tab === 'data' && canEdit(w.member.role, w.member.mentor_edit) && (
        <section className="panel settings-panel">
          <h2>Your team’s data, in your hands.</h2>
          <p>
            Download all accessible operational records as JSON, or a section as CSV. Account
            credentials and uploaded file binaries are excluded. Shared attachment paths require the
            original team’s storage.
          </p>
          <button
            className="primary"
            onClick={() =>
              download(
                'team-records.json',
                JSON.stringify(
                  {
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    team: w.team,
                    records: w.data,
                  },
                  null,
                  2,
                ),
                'application/json',
              )
            }
          >
            <Download size={16} /> Export all records (JSON)
          </button>
          <label>
            Section for CSV export / import
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.entries(entities).map(([k, e]) => (
                <option key={k} value={k}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <button
            className="outline"
            onClick={() => csv(kind, w.data[kind], entities[kind].fields)}
          >
            Export section CSV
          </button>
          <hr />
          <h3>Import records</h3>
          <p className="muted">
            JSON uses the exported records format. CSV headers must match the exported field labels.
            Preview the record count before adding anything.
          </p>
          <label>
            Choose JSON or CSV
            <input
              type="file"
              accept=".json,.csv"
              onChange={(e) => {
                if (e.target.files[0]) importFile(e.target.files[0]);
              }}
            />
          </label>
          <p className="note">
            Import adds new records. Memberships, access roles, audit logs and team ownership cannot
            be imported.
          </p>
        </section>
      )}
      {tab === 'delete team' && owner && (
        <section className="panel settings-panel delete-team-panel">
          <div className="eyebrow">TEAM SETTINGS / DANGER ZONE</div>
          <h2>Delete this team</h2>
          <p>
            Permanently remove <strong>{w.team.name}</strong>, its members, records, activity, and
            uploaded files. Everyone on the team will lose access. Your Google account will stay.
          </p>
          <button
            className="primary danger-button"
            onClick={() => {
              setDeleteName('');
              setDeleteError('');
              setDeleteOpen(true);
            }}
          >
            <Trash2 size={16} /> Delete team
          </button>
        </section>
      )}
      {deleteOpen && (
        <Modal
          title="Delete this team permanently?"
          onClose={(event) => {
            if (busy) return event?.preventDefault();
            setDeleteOpen(false);
          }}
        >
          <p>
            This removes the team and its shared data for everyone. This action cannot be undone.
          </p>
          <label>
            Type <strong>{w.team.name}</strong> to confirm
            <input
              value={deleteName}
              onChange={(event) => setDeleteName(event.target.value)}
              autoComplete="off"
              spellCheck="false"
            />
          </label>
          {deleteError && (
            <p role="alert" className="error notice">
              {deleteError}
            </p>
          )}
          <div className="modal-actions">
            <button className="outline" disabled={busy} onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button
              className="primary danger-button"
              disabled={busy || deleteName !== w.team.name}
              onClick={async () => {
                setBusy(true);
                setDeleteError('');
                try {
                  await w.deleteTeam();
                  setDeleteOpen(false);
                } catch (e) {
                  setDeleteError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Deleting team…' : 'Delete team permanently'}
            </button>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p>This changes team access or settings and will be recorded in the activity log.</p>
          <div className="modal-actions">
            <button className="outline" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="primary"
              onClick={async () => {
                const fn = confirm.run;
                setConfirm(null);
                await act(fn);
              }}
            >
              Confirm change
            </button>
          </div>
        </Modal>
      )}
      {pending && (
        <Modal
          title="Review import"
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          <p>Ready to add {Object.values(pending).reduce((n, a) => n + a.length, 0)} records:</p>
          {Object.entries(pending).map(([k, v]) => (
            <p key={k}>
              {entities[k].title}: {v.length}
            </p>
          ))}
          <p className="note">
            Adds records with new IDs. Large imports run sequentially; if interrupted, already saved
            rows remain.
          </p>
          <button className="primary" disabled={busy} onClick={applyImport}>
            {busy ? 'Importing…' : 'Import these records'}
          </button>
        </Modal>
      )}
    </>
  );
}
