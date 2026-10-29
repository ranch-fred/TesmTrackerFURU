import React, { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { canDelete, canEdit } from './domain';
import { Modal, RecordForm } from './Records';
import './purchase-requests.css';

const stages = ['Requested', 'Approved', 'Ordered', 'Received'];

export default function PurchaseRequests({ w }) {
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const editable = canEdit(w.member.role, w.member.mentor_edit);
  const rows = [...w.data.purchases].sort((a, b) =>
    (b.neededBy || '').localeCompare(a.neededBy || ''),
  );

  return (
    <>
      <div className="page-intro purchase-intro">
        <div>
          <div className="eyebrow">BUSINESS / PURCHASES</div>
          <h1>
            PURCHASE <span>REQUESTS.</span>
          </h1>
          <p>See what the team needs and follow each request through.</p>
        </div>
        {editable && (
          <button className="primary" onClick={() => setForm({})}>
            <Plus size={17} /> New request
          </button>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {rows.length ? (
        <div className="purchase-grid">
          {rows.map((row) => {
            const open = openId === row.id;
            const person = w.members.find(
              (member) =>
                member.name === row.requestedBy || member.display_name === row.requestedBy,
            );
            const name = person?.display_name || row.requestedBy || 'Team member';
            const items = Array.isArray(row.parts) ? row.parts : [];
            const stage = Math.max(0, stages.indexOf(row.status));
            return (
              <article className={`purchase-card ${open ? 'open' : ''}`} key={row.id}>
                <button
                  className="purchase-card-toggle"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : row.id)}
                >
                  <span className="purchase-avatar" aria-hidden="true">
                    {person?.photo ? (
                      <img src={person.photo} alt="" />
                    ) : (
                      name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                    )}
                  </span>
                  <span className="purchase-card-identity">
                    <strong>{name}</strong>
                    <small>Request {row.number || '—'}</small>
                  </span>
                  <span
                    className={`purchase-status status-${(row.status || 'Requested').toLowerCase()}`}
                  >
                    {row.status || 'Requested'}
                  </span>
                  {open ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
                </button>
                {!open ? (
                  <div className="purchase-card-preview">
                    <strong>{items[0] || 'Items to be added'}</strong>
                    {items.length > 1 && <small>+{items.length - 1} more</small>}
                    <span>
                      <CalendarDays size={15} /> Needed {row.neededBy || 'date not set'}
                    </span>
                  </div>
                ) : (
                  <div className="purchase-card-details">
                    <ol className="purchase-progress" aria-label="Request status">
                      {stages.map((status, index) => (
                        <li className={index <= stage ? 'reached' : ''} key={status}>
                          <span>{index + 1}</span>
                          {status}
                        </li>
                      ))}
                    </ol>
                    <div className="purchase-facts">
                      <div>
                        <small>REQUEST #</small>
                        <strong>{row.number || '—'}</strong>
                      </div>
                      <div>
                        <small>REQUESTED BY</small>
                        <strong>{name}</strong>
                      </div>
                      <div>
                        <small>NEEDED BY</small>
                        <strong>{row.neededBy || 'Not set'}</strong>
                      </div>
                    </div>
                    {person?.bio && (
                      <p className="purchase-requester-bio">
                        About {name}: {person.bio}
                      </p>
                    )}
                    <div className="purchase-items">
                      <small>ITEM DETAILS</small>
                      {items.length ? (
                        items.map((item, index) => <div key={`${item}-${index}`}>{item}</div>)
                      ) : (
                        <p>No items added yet.</p>
                      )}
                    </div>
                    {row.notes && (
                      <div className="purchase-note">
                        <small>NOTE</small>
                        <p>{row.notes}</p>
                      </div>
                    )}
                    {editable && (
                      <div className="purchase-card-actions">
                        <button className="outline" onClick={() => setForm(row)}>
                          <Pencil size={15} /> Edit request
                        </button>
                        {canDelete(w.member.role) && (
                          <button className="outline danger" onClick={() => setDeleting(row)}>
                            <Trash2 size={15} /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel purchase-empty">
          <h2>No purchase requests yet.</h2>
          <p>Start with the next item the team needs.</p>
          {editable && (
            <button className="primary" onClick={() => setForm({})}>
              <Plus size={16} /> New request
            </button>
          )}
        </div>
      )}
      {form && (
        <RecordForm
          kind="purchases"
          record={form.id ? form : null}
          w={w}
          onClose={() => setForm(null)}
        />
      )}
      {deleting && (
        <Modal title="Delete this request?" onClose={() => setDeleting(null)}>
          <p>This permanently removes the request.</p>
          <div className="modal-actions">
            <button className="outline" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              className="primary danger-button"
              onClick={async () => {
                try {
                  await w.remove('purchases', deleting.id);
                  setDeleting(null);
                  setOpenId(null);
                } catch (e) {
                  setError(e.message);
                  setDeleting(null);
                }
              }}
            >
              Delete request
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
