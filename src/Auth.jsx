import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Hexagon,
  ShieldCheck,
  Users,
  Layers,
  LoaderCircle,
} from 'lucide-react';
import { supabase } from './client';
import { roles, subteams } from './schema';
import { MotionToggle } from './Motion';
import { readInvite, clearInvite, callbackError, signInWithGoogle } from './auth-flow';
import { teamMonogram } from './branding';
import FieldBackdrop from './hero/FieldBackdrop';
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.12H3.04v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.92A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.49H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.51l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.35 2.59C7.18 7.72 9.39 5.96 12 5.96Z"
      />
    </svg>
  );
}
export function Brand({ team, onHome }) {
  return (
    <div
      className="brand"
      role={onHome ? 'button' : undefined}
      tabIndex={onHome ? 0 : undefined}
      onClick={onHome}
      onKeyDown={
        onHome
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onHome();
              }
            }
          : undefined
      }
      aria-label={onHome ? 'Go to home' : undefined}
    >
      <span className="brand-icon">
        <Hexagon size={26} />
        <b>{team ? teamMonogram(team.name).slice(0, 1) : 'T'}</b>
      </span>
      <div>
        <strong>
          {team?.name || 'FTC TEAM TRACKER'}
          <span className="orange">.</span>
        </strong>
        <small>
          {team ? `FTC #${team.number} / TEAM WORKSPACE` : 'SIGN IN OR SIGN UP TO TRACK YOUR TEAM'}
        </small>
      </div>
    </div>
  );
}
const INTRO_KEY = 'tt-field-intro-v1';
function introSeen() {
  try {
    return localStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return true;
  }
}
export default function Auth({ w }) {
  // first visit only: the field builds full screen, then the sign-in fades in over it
  const [intro, setIntro] = useState(() => !introSeen());
  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(endIntro, 25000); // never strand someone behind a slow CDN
    return () => clearTimeout(t);
  }, [intro]);
  function endIntro() {
    setIntro(false);
    try {
      localStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* private mode: they will see it again next time */
    }
  }
  const [joinCode, setJoinCode] = useState(() => {
    try {
      return readInvite(location.search, sessionStorage);
    } catch {
      return readInvite(location.search);
    }
  });
  const [mode, setMode] = useState(() =>
      joinCode ||
      new URLSearchParams(location.search).has('auth') ||
      callbackError(location.search, location.hash)
        ? 'login'
        : 'landing',
    ),
    [loading, setLoading] = useState(false),
    [note, setNote] = useState(''),
    [err, setErr] = useState(() => callbackError(location.search, location.hash));
  const [choices, setChoices] = useState([]);
  useEffect(() => {
    if (!w.demo && w.member?.team_id) {
      try {
        clearInvite(sessionStorage);
      } catch {}
      const url = new URL(location.href);
      url.searchParams.delete('invite');
      url.searchParams.delete('auth');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }, [w.member?.team_id, w.demo]);
  async function googleLogin() {
    setErr('');
    setNote('');
    setLoading(true);
    try {
      let storage;
      try {
        storage = sessionStorage;
      } catch {}
      await signInWithGoogle(supabase, { origin: location.origin, invite: joinCode, storage });
    } catch (error) {
      setErr(error.message);
      setLoading(false);
    }
  }
  const step =
    w.user && !w.team
      ? 'team'
      : w.member?.status === 'pending'
        ? 'pending'
        : w.member?.status === 'denied'
          ? 'denied'
          : mode;
  async function submit(e) {
    e.preventDefault();
    setErr('');
    setNote('');
    if (!supabase) {
      setErr(
        'Shared accounts need Supabase configuration. Use Explore demo to test the workspace.',
      );
      return;
    }
    setLoading(true);
    const v = Object.fromEntries(new FormData(e.target));
    try {
      if (step === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: v.email,
          password: v.password,
          options: {
            emailRedirectTo: new URL(
              `/?auth=login${joinCode ? `&invite=${encodeURIComponent(joinCode)}` : ''}`,
              location.origin,
            ).toString(),
          },
        });
        if (error) throw error;
        setNote('Account created. Check your inbox to confirm your email, then sign in.');
        setMode('login');
      } else if (step === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: v.email,
          password: v.password,
        });
        if (error) throw error;
        await w.refresh();
      } else if (step === 'team') {
        if (v.flow === 'join')
          await w.rpc('request_join', {
            code: v.code,
            full_name: v.fullName,
            grade_value: v.grade,
            desired_role: v.role,
            teams_value: choices,
          });
        else
          await w.rpc('create_team', {
            profile: {
              name: v.name,
              number: v.number,
              school: v.school,
              season: v.season,
              location: v.location,
              logo: v.logo,
            },
            full_name: v.fullName,
            grade_value: v.grade,
          });
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }
  const [flow, setFlow] = useState('join');
  return (
    <div className={`entry ${intro ? 'intro' : ''}`}>
      <FieldBackdrop centered={intro} onBuilt={endIntro} />
      {intro && (
        <p className="intro-caption" role="status">
          Building the BIOBUZZ field…
        </p>
      )}
      <nav className="entry-nav">
        <Brand onHome={() => setMode('landing')} />
        <div>
          <span className="season-label">FTC / TEAM TRACKER</span>
          <MotionToggle />
          <button className="outline" onClick={() => (w.user ? w.logout() : setMode('login'))}>
            {w.user ? 'Switch account' : 'Team sign in'} <ArrowUpRight size={15} />
          </button>
        </div>
      </nav>
      {step === 'landing' ? (
        <>
          <section className="landing-hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="dot" /> THE WORK STARTS HERE
              </div>
              <h1>
                BUILT TO
                <br />
                MAKE <em>MOVES.</em>
              </h1>
              <p>
                Sign in or sign up to start tracking your team.
                <br />
                Keep your work, people, and progress together,
                <br />
                from the workshop to the field.
              </p>
              <div className="hero-actions">
                <button className="primary" onClick={() => setMode('login')}>
                  Sign in to track your team <ArrowUpRight size={18} />
                </button>
                <button className="text-button" onClick={() => setMode('signup')}>
                  Sign up to start a team <ArrowRight size={16} />
                </button>
              </div>
              <small className="muted">Interactive demo · Sample data · No account needed</small>
              <button className="text-button demo-entry" onClick={w.enterDemo}>
                Explore demo workspace <ArrowRight size={15} />
              </button>
            </div>
          </section>
          <section className="landing-bottom">
            <div>
              <Layers />
              <h3>Every system. In sync.</h3>
              <p>Engineering, code, and competition in one place.</p>
            </div>
            <div>
              <Users />
              <h3>A workspace for the whole crew.</h3>
              <p>Built around your team, sub-teams, and roles.</p>
            </div>
            <div>
              <ShieldCheck />
              <h3>Ready for the next inspection.</h3>
              <p>Track the details. Bring the evidence.</p>
            </div>
          </section>
          <footer>
            FTC TEAM TRACKER <span>BUILD. TEST. ITERATE. REPEAT.</span>
          </footer>
        </>
      ) : (
        <main className="auth-main">
          <div className="auth-aside">
            <div className="eyebrow">TEAM ACCESS / SIGN IN OR SIGN UP</div>
            <h1>
              GREAT ROBOTS.
              <br />
              <em>BETTER TEAMS.</em>
            </h1>
            <div className="shared-team-promise">
              <ShieldCheck size={18} />
              <p>
                Your Google account. Your team’s shared workspace.
                <small>Sign in, join with an invite, and build together.</small>
              </p>
            </div>
            <button className="text-button" onClick={w.enterDemo}>
              Just looking? Explore the demo <ArrowRight size={16} />
            </button>
          </div>
          <section className="auth-card panel">
            {w.authLoading ? (
              <div className="auth-checking" role="status">
                <LoaderCircle className="spin" size={26} />
                <h2>Opening your workspace…</h2>
                <p>Checking your sign-in and team membership.</p>
              </div>
            ) : ['pending', 'denied'].includes(step) ? (
              <>
                <div className="eyebrow">MEMBERSHIP REQUEST</div>
                <h2>{step === 'pending' ? 'You’re on the list.' : 'Request not approved.'}</h2>
                <p>
                  {step === 'pending'
                    ? 'A captain or coach needs to approve your request. Your workspace will open after approval.'
                    : 'Contact a captain or coach to discuss your membership.'}
                </p>
                <button className="primary" onClick={w.refresh}>
                  Check status
                </button>
                <button className="outline" onClick={w.logout}>
                  Sign out
                </button>
              </>
            ) : (
              <form onSubmit={submit}>
                <div className="eyebrow">WELCOME TO THE WORKSHOP</div>
                <h2>
                  {step === 'team'
                    ? 'Find your crew.'
                    : step === 'signup'
                      ? 'Join the build.'
                      : 'Back to building.'}
                </h2>
                <p className="muted">
                  {step === 'team'
                    ? 'Create a team or request access with an invite.'
                    : 'Your team’s work, all in one place.'}
                </p>
                {step !== 'team' && (
                  <div className="google-login-block">
                    {joinCode && (
                      <div className="join-intent">
                        <Users size={17} />
                        <span>
                          You have a team invite.
                          <small>
                            Sign in to join with code <b>{joinCode}</b>.
                          </small>
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="google-signin"
                      disabled={loading}
                      onClick={googleLogin}
                    >
                      {loading ? <LoaderCircle className="spin" size={20} /> : <GoogleMark />}
                      <span>{loading ? 'Connecting…' : 'Continue with Google'}</span>
                    </button>
                    <p className="google-login-caption">
                      Use your own Google account to access your team.
                    </p>
                    <div className="auth-divider">
                      <span />
                      or continue with email
                      <span />
                    </div>
                  </div>
                )}
                {step === 'team' ? (
                  <>
                    <div className="tabs">
                      <button
                        type="button"
                        className={flow === 'create' ? 'active' : ''}
                        onClick={() => setFlow('create')}
                      >
                        Create team
                      </button>
                      <button
                        type="button"
                        className={flow === 'join' ? 'active' : ''}
                        onClick={() => setFlow('join')}
                      >
                        Join team
                      </button>
                    </div>
                    <input type="hidden" name="flow" value={flow} />
                    <label>
                      Full name
                      <input
                        required
                        name="fullName"
                        autoComplete="name"
                        defaultValue={
                          w.user?.user_metadata?.full_name || w.user?.user_metadata?.name || ''
                        }
                      />
                    </label>
                    <label>
                      Grade
                      <input name="grade" />
                    </label>
                    {flow === 'create' ? (
                      <>
                        <label>
                          Team name
                          <input required name="name" placeholder="Your team name" />
                        </label>
                        <div className="form-grid">
                          <label>
                            Team number
                            <input required name="number" placeholder="Your FTC team number" />
                          </label>
                          <label>
                            Season
                            <input name="season" defaultValue="2026–27 BIOBUZZ" />
                          </label>
                        </div>
                        <label>
                          School / organization
                          <input name="school" />
                        </label>
                        <label>
                          Location
                          <input name="location" />
                        </label>
                        <label>
                          Logo URL
                          <input type="url" name="logo" />
                        </label>
                      </>
                    ) : (
                      <>
                        <label>
                          Join code
                          <input
                            required
                            name="code"
                            value={joinCode}
                            onChange={(event) => setJoinCode(event.target.value)}
                          />
                        </label>
                        <label>
                          Requested role
                          <select name="role" defaultValue="Member">
                            {roles.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </label>
                        <fieldset>
                          <legend>Sub-teams</legend>
                          <div className="choice-grid">
                            {subteams.map((s) => (
                              <label key={s}>
                                <input
                                  type="checkbox"
                                  checked={choices.includes(s)}
                                  onChange={() =>
                                    setChoices((c) =>
                                      c.includes(s) ? c.filter((v) => v !== s) : [...c, s],
                                    )
                                  }
                                />
                                {s}
                              </label>
                            ))}
                          </div>
                          <p className="note">
                            Use the email address your captain invited. The code in that email works
                            once and expires after 7 days. Your captain or coach approves your
                            request.
                          </p>
                        </fieldset>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <label>
                      Email
                      <input
                        required
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@team.org"
                      />
                    </label>
                    <label>
                      Password
                      <input
                        required
                        minLength={8}
                        name="password"
                        type="password"
                        autoComplete={step === 'signup' ? 'new-password' : 'current-password'}
                        placeholder="At least 8 characters"
                      />
                    </label>
                  </>
                )}
                {err && (
                  <p role="alert" className="error">
                    {err}
                  </p>
                )}
                {note && (
                  <p role="status" className="success">
                    {note}
                  </p>
                )}
                <button className="primary full" disabled={loading}>
                  {loading ? <LoaderCircle className="spin" size={18} /> : null}
                  {step === 'team'
                    ? flow === 'create'
                      ? 'Create team'
                      : 'Request to join'
                    : step === 'signup'
                      ? 'Create account'
                      : 'Sign in'}
                  <ArrowRight size={16} />
                </button>
                {step === 'team' && (
                  <button className="text-button full" type="button" onClick={w.logout}>
                    Use a different account
                  </button>
                )}
                {step !== 'team' && (
                  <button
                    className="text-button full"
                    type="button"
                    onClick={() => setMode(step === 'signup' ? 'login' : 'signup')}
                  >
                    {step === 'signup'
                      ? 'Already a member? Sign in'
                      : 'New here? Create an account'}
                  </button>
                )}
                {!supabase && (
                  <p className="note">
                    Live accounts are not connected yet. The demo is available now.
                  </p>
                )}
              </form>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
