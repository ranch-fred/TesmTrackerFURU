import React, { useState } from 'react';
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
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <Hexagon size={26} />
        <b>C</b>
      </span>
      <div>
        <strong>
          COOL NAME PENDING<span className="orange">.</span>
        </strong>
        <small>FTC #30439 / TEAM CONSOLE</small>
      </div>
    </div>
  );
}
export function Blueprint() {
  return (
    <div className="blueprint-art" aria-label="Abstract technical blueprint">
      <div className="orbital orbit-one" />
      <div className="orbital orbit-two" />
      <div className="blueprint-core">
        <Hexagon size={145} strokeWidth={0.7} />
        <strong>30439</strong>
        <small>BUILT TOGETHER</small>
      </div>
      <span className="crosshair c1">+</span>
      <span className="crosshair c2">+</span>
      <span className="blueprint-label">ENGINEERING IN PROGRESS</span>
    </div>
  );
}
export default function Auth({ w }) {
  const [mode, setMode] = useState('landing'),
    [loading, setLoading] = useState(false),
    [note, setNote] = useState(''),
    [err, setErr] = useState('');
  const [choices, setChoices] = useState([]);
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
          options: { emailRedirectTo: window.location.origin },
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
  const [flow, setFlow] = useState(
    new URLSearchParams(location.search).has('invite') ? 'join' : 'create',
  );
  return (
    <div className="entry">
      <nav className="entry-nav">
        <Brand />
        <div>
          <span className="season-label">2026—27 / BIOBUZZ</span>
          <MotionToggle />
          <button className="outline" onClick={() => setMode('login')}>
            Team sign in <ArrowUpRight size={15} />
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
                One crew. Every moving part.
                <br />
                The command center for everything we build,
                <br />
                learn, and bring to the field.
              </p>
              <div className="hero-actions">
                <button className="primary" onClick={w.enterDemo}>
                  Explore team console <ArrowUpRight size={18} />
                </button>
                <button className="text-button" onClick={() => setMode('signup')}>
                  Create your team <ArrowRight size={16} />
                </button>
              </div>
              <small className="muted">Interactive demo · Sample data · No account needed</small>
            </div>
            <div className="hero-art">
              <Blueprint />
              <span className="art-tag">TEAM 30439 / BUILD TOGETHER</span>
              <div className="art-coordinates">
                17.5 × 17.5 × 16.8 IN
                <br />
                ENGINEERED TO EVOLVE
              </div>
            </div>
          </section>
          <div className="hazard" />
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
            COOL NAME PENDING #30439 <span>BUILD. TEST. ITERATE. REPEAT.</span>
          </footer>
        </>
      ) : (
        <main className="auth-main">
          <div className="auth-aside">
            <div className="eyebrow">TEAM ACCESS / 30439</div>
            <h1>
              GREAT ROBOTS.
              <br />
              <em>BETTER TEAMS.</em>
            </h1>
            <Blueprint />
            <button className="text-button" onClick={w.enterDemo}>
              Just looking? Explore the demo <ArrowRight size={16} />
            </button>
          </div>
          <section className="auth-card panel">
            {['pending', 'denied'].includes(step) ? (
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
                      <input required name="fullName" autoComplete="name" />
                    </label>
                    <label>
                      Grade
                      <input name="grade" />
                    </label>
                    {flow === 'create' ? (
                      <>
                        <label>
                          Team name
                          <input required name="name" defaultValue="Cool Name Pending" />
                        </label>
                        <div className="form-grid">
                          <label>
                            Team number
                            <input required name="number" defaultValue="30439" />
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
                            defaultValue={new URLSearchParams(location.search).get('invite') || ''}
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
