import React, { useState } from 'react';
import {
  Box,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  ChevronUp,
  CircuitBoard,
  ClipboardList,
  Cog,
  Pencil,
  Plus,
  Shirt,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react';
import { canDelete, canEdit } from './domain';
import { Modal, RecordForm } from './Records';
import './purchase-requests.css';

const stages = ['Requested', 'Approved', 'Ordered', 'Received'];
const stageIcons = [ClipboardList, Check, Box, Truck];
const itemIcon = (item) =>
  /camera/i.test(item)
    ? Camera
    : /shirt|uniform/i.test(item)
      ? Shirt
      : /hub|control|board/i.test(item)
        ? CircuitBoard
        : /motor|drive/i.test(item)
          ? Cog
          : Box;
const readableDate = (date) =>
  date
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${date}T12:00:00Z`))
    : 'Date not set';

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
      <div className="purchase-intro">
        <div>
          <h1>Purchase requests</h1>
          <p>Request team purchases and track their status.</p>
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
            const primaryItem = items[0]?.split(/\s+[—–-]\s+/) || [];
            const ItemIcon = itemIcon(primaryItem[0] || '');
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
                    <small>Request #{row.number || '—'}</small>
                  </span>
                  <span
                    className={`purchase-status status-${(row.status || 'Requested').toLowerCase()}`}
                  >
                    {row.status || 'Requested'}
                  </span>
                  {open && <ChevronUp className="purchase-expand-icon" size={21} />}
                </button>
                {!open ? (
                  <button
                    className="purchase-card-preview"
                    onClick={() => setOpenId(row.id)}
                    aria-label={`Open request ${row.number || ''} from ${name}`}
                  >
                    <span className="purchase-preview-item">
                      <span className="purchase-item-icon">
                        <ItemIcon size={34} strokeWidth={1.5} />
                      </span>
                      <strong>{primaryItem[0] || 'Items to be added'}</strong>
                      {items.length > 1 && <small>+{items.length - 1} more</small>}
                      <ChevronRight className="purchase-expand-icon" size={22} />
                    </span>
                    <span className="purchase-preview-date">
                      <CalendarDays size={22} strokeWidth={1.6} />
                      <span>
                        Needed by<strong>{readableDate(row.neededBy)}</strong>
                      </span>
                    </span>
                  </button>
                ) : (
                  <div className="purchase-card-details">
                    <ol className="purchase-progress" aria-label="Request status">
                      {stages.map((status, index) => {
                        const StageIcon = stageIcons[index];
                        return (
                          <li
                            className={
                              index === stage ? 'current' : index < stage ? 'completed' : ''
                            }
                            key={status}
                          >
                            <span>
                              <StageIcon size={20} strokeWidth={1.7} />
                            </span>
                            <strong>{status}</strong>
                          </li>
                        );
                      })}
                    </ol>
                    <div className="purchase-facts">
                      <div>
                        <ClipboardList size={25} strokeWidth={1.5} />
                        <span>
                          <small>Request #</small>
                          <strong>{row.number || '—'}</strong>
                        </span>
                      </div>
                      <div>
                        <UserRound size={25} strokeWidth={1.5} />
                        <span>
                          <small>Requested by</small>
                          <strong>{name}</strong>
                        </span>
                      </div>
                      <div>
                        <CalendarDays size={25} strokeWidth={1.5} />
                        <span>
                          <small>Needed by</small>
                          <strong>{readableDate(row.neededBy)}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="purchase-items-wrap">
                      <small>Item details</small>
                      <div className="purchase-items">
                        {items.length ? (
                          items.map((item, index) => {
                            const [title, detail] = item.split(/\s+[—–-]\s+/);
                            const Icon = itemIcon(title);
                            return (
                              <div className="purchase-item-detail" key={`${item}-${index}`}>
                                <span className="purchase-item-icon">
                                  <Icon size={31} strokeWidth={1.5} />
                                </span>
                                <span>
                                  <strong>{title}</strong>
                                  {detail && <small>{detail}</small>}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <p>No items added yet.</p>
                        )}
                      </div>
                    </div>
                    <div className="purchase-card-footer">
                      <div className="purchase-note">
                        <small>Note</small>
                        <p>{row.notes || 'No note added.'}</p>
                      </div>
                      <div className="purchase-card-actions">
                        {canDelete(w.member.role) && (
                          <button className="purchase-delete-link" onClick={() => setDeleting(row)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                        {editable && (
                          <button className="outline" onClick={() => setForm(row)}>
                            <Pencil size={17} /> Edit
                          </button>
                        )}
                        <button className="outline purchase-close" onClick={() => setOpenId(null)}>
                          × <span>Close</span>
                        </button>
                      </div>
                    </div>
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
