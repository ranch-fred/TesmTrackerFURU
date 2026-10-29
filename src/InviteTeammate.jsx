import React, { useState } from 'react';
import { ArrowUpRight, Mail, Send } from 'lucide-react';
import { supabase } from './client';
import './invite-teammate.css';

export default function InviteTeammate({ w }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function sendInvite(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setSending(true);
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) throw Error('Sign in again to send invitations.');
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ email, teamId: w.team.id }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Could not send invitation.');
      setMessage(`Invitation sent to ${email}.`);
      setEmail('');
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="invite-teammate">
      <div className="invite-teammate-heading">
        <span className="invite-teammate-icon">
          <Mail size={22} />
        </span>
        <div>
          <span className="eyebrow">DIRECT INVITE / EMAIL</span>
          <h3>Bring someone aboard.</h3>
          <p>Send a join link from the team Gmail account.</p>
        </div>
        <ArrowUpRight size={18} aria-hidden="true" />
      </div>
      <form className="invite-teammate-form" onSubmit={sendInvite}>
        <label htmlFor="teammate-email">Teammate email</label>
        <div className="invite-teammate-controls">
          <input
            id="teammate-email"
            required
            type="email"
            autoComplete="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button className="primary" disabled={sending || w.demo}>
            <Send size={16} /> {sending ? 'Sending…' : 'Send invitation'}
          </button>
        </div>
      </form>
      {w.demo && <p className="note">Sending invitations requires a live team account.</p>}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
