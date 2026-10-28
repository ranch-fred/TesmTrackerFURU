import React, { useMemo, useState } from 'react';
import {
  Radio,
  Pin,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpRight,
  Users,
  SlidersHorizontal,
  X,
  MessageSquare,
} from 'lucide-react';
import './announcements.css';

function displayDate(value) {
  if (!value) return 'No date';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Announcements({
  records,
  actions,
  canCreate,
  onCreate,
  onExport,
  onDiscuss,
  error,
}) {
  const [query, setQuery] = useState('');
  const [audience, setAudience] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [order, setOrder] = useState('newest');
  const audiences = [
    ...new Set(records.flatMap((r) => (r.targets?.length ? r.targets : ['Whole team']))),
  ].sort();
  const pinnedCount = records.filter((r) => r.pinned).length;
  const rows = useMemo(
    () =>
      records
        .filter((r) => {
          const targets = r.targets?.length ? r.targets : ['Whole team'];
          return (
            (!pinnedOnly || r.pinned) &&
            (!audience || targets.includes(audience)) &&
            [r.title, r.message, r.author, r.date, ...targets]
              .join(' ')
              .toLowerCase()
              .includes(query.toLowerCase())
          );
        })
        .sort(
          (a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
            (order === 'title'
              ? (a.title || '').localeCompare(b.title || '')
              : (order === 'oldest' ? 1 : -1) * (a.date || '').localeCompare(b.date || '')),
        ),
    [records, query, audience, pinnedOnly, order],
  );
  const featured = rows.find((r) => r.pinned);
  const feed = rows.filter((r) => r !== featured);
  const filtered = Boolean(query || audience || pinnedOnly);
  const reset = () => {
    setQuery('');
    setAudience('');
    setPinnedOnly(false);
  };

  function card(record, spotlight = false) {
    const targets = record.targets?.length ? record.targets : ['Whole team'];
    return (
      <article key={record.id} className={`ann-card ${spotlight ? 'ann-spotlight' : ''}`}>
        {spotlight && (
          <div className="ann-orbit" aria-hidden="true">
            <span />
            <span />
            <Radio size={40} strokeWidth={1} />
          </div>
        )}
        <div className="ann-card-top">
          <span className={`ann-label ${record.pinned ? 'ann-label-accent' : ''}`}>
            {record.pinned ? <Pin size={12} /> : <Radio size={12} />}
            {spotlight ? 'IN THE SPOTLIGHT' : record.pinned ? 'PINNED UPDATE' : 'TEAM UPDATE'}
          </span>
          <time dateTime={record.date || undefined}>{displayDate(record.date)}</time>
        </div>
        <h3>{record.title || 'Untitled announcement'}</h3>
        <p className="ann-message">{record.message}</p>
        <div className="ann-audiences" aria-label="Audience">
          <Users size={13} aria-hidden="true" />
          {targets.map((target) => (
            <span key={target}>{target}</span>
          ))}
        </div>
        <footer className="ann-card-footer">
          <div className="ann-author">
            <span className="ann-avatar" aria-hidden="true">
              {(record.author || '?')
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((name) => name[0])
                .join('')}
            </span>
            <div>
              <strong>{record.author || 'Team member'}</strong>
              <small>Posted to your team</small>
            </div>
          </div>
          {actions(record)}
        </footer>
        {spotlight && (
          <button className="ann-discuss" onClick={() => onDiscuss(record)}>
            <MessageSquare size={15} /> Join the discussion <ArrowUpRight size={16} />
          </button>
        )}
      </article>
    );
  }

  return (
    <div className="ann-board">
      <header className="ann-header">
        <div>
          <div className="ann-kicker">
            <span /> THE TEAM BULLETIN
          </div>
          <h2>
            Stay in the loop<span>.</span>
          </h2>
          <p>Big moves. Small updates. Everything your crew needs to know.</p>
        </div>
        <div className="ann-header-actions">
          <button className="outline" onClick={() => onExport(rows)}>
            <ArrowDownToLine size={15} /> Export
          </button>
          {canCreate && (
            <button className="primary" onClick={onCreate}>
              <Plus size={16} /> New announcement
            </button>
          )}
        </div>
      </header>

      <div className="ann-layout">
        <div className="ann-main">
          <div className="ann-controls">
            <div className="ann-search">
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Search announcements"
                placeholder="Find an update, author, or keyword…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="icon-button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="ann-filter-row">
              <div className="ann-tabs" role="group" aria-label="Announcement view">
                <button aria-pressed={!pinnedOnly} onClick={() => setPinnedOnly(false)}>
                  All updates <span>{records.length}</span>
                </button>
                <button aria-pressed={pinnedOnly} onClick={() => setPinnedOnly(true)}>
                  <Pin size={13} /> Pinned <span>{pinnedCount}</span>
                </button>
              </div>
              <label className="ann-sort">
                <SlidersHorizontal size={13} aria-hidden="true" />
                <select
                  aria-label="Sort announcements"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
            </div>
            <label className="ann-mobile-audience">
              Audience
              <select
                aria-label="Filter announcements by audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="">All audiences</option>
                {audiences.map((target) => (
                  <option key={target}>{target}</option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="ann-results" role="status">
            {rows.length} {rows.length === 1 ? 'announcement' : 'announcements'}
            {audience && ` · ${audience}`}
            {filtered && (
              <button onClick={reset}>
                Clear filters <X size={12} />
              </button>
            )}
          </div>
          {featured && card(featured, true)}
          {feed.length > 0 && (
            <>
              <div className="ann-feed-heading">
                <span />
                {featured ? 'MORE FROM YOUR CREW' : 'FROM YOUR CREW'}
                <span />
              </div>
              <div className="ann-feed">{feed.map((r) => card(r))}</div>
            </>
          )}
          {!rows.length && (
            <div className="ann-empty">
              <span>
                <Radio size={30} />
              </span>
              <h3>{filtered ? 'No signals found.' : 'Your next update starts here.'}</h3>
              <p>
                {filtered
                  ? 'Try another keyword or clear your filters to see the team bulletin.'
                  : 'Give your crew something to rally around. Team announcements will appear here.'}
              </p>
              {filtered ? (
                <button className="outline" onClick={reset}>
                  Clear filters
                </button>
              ) : (
                canCreate && (
                  <button className="primary" onClick={onCreate}>
                    <Plus size={16} /> New announcement
                  </button>
                )
              )}
            </div>
          )}
        </div>
        <aside className="ann-sidebar" aria-label="Bulletin overview">
          <section className="ann-overview">
            <div className="ann-side-label">
              <Radio size={15} /> AT A GLANCE
            </div>
            <h3>
              One team.
              <br />
              <span>All connected.</span>
            </h3>
            <div className="ann-metrics">
              <div>
                <strong>{String(records.length).padStart(2, '0')}</strong>
                <span>Updates</span>
              </div>
              <div>
                <strong>{String(pinnedCount).padStart(2, '0')}</strong>
                <span>Pinned</span>
              </div>
            </div>
            <p>Pinned updates lead the way, so the important details stay in sight.</p>
            <div className="ann-signal" aria-hidden="true">
              {Array.from({ length: 23 }, (_, i) => (
                <i key={i} style={{ height: `${12 + ((i * 17) % 37)}px` }} />
              ))}
            </div>
          </section>
          <section className="ann-channels">
            <div className="ann-side-label">
              <Users size={15} /> BROWSE BY AUDIENCE
            </div>
            <button aria-pressed={!audience} onClick={() => setAudience('')}>
              <span>All audiences</span>
              <b>{records.length}</b>
            </button>
            {audiences.map((target) => (
              <button
                key={target}
                aria-pressed={audience === target}
                onClick={() => setAudience(target)}
              >
                <span>{target}</span>
                <b>
                  {
                    records.filter((r) =>
                      (r.targets?.length ? r.targets : ['Whole team']).includes(target),
                    ).length
                  }
                </b>
              </button>
            ))}
          </section>
          <div className="ann-side-note">
            <Pin size={17} />
            <p>
              <strong>Keep the crew aligned.</strong>
              <br />
              Use pins for the updates everyone needs to find.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
