import React, { useEffect, useState } from 'react';
import { canEdit } from './domain';
import { emptyPractice, FLOWERS, flowerPoints, practiceScore, timerStage } from './practice-score';
import { localDate } from './logs';
import './practice.css';

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function Counter({ label, value, points, onChange }) {
  return (
    <div className="practice-counter">
      <div><strong>{label}</strong><small>{points}</small></div>
      <div className="practice-counter-actions">
        <button type="button" aria-label={`Remove ${label}`} disabled={!value} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <b>{value}</b>
        <button type="button" aria-label={`Add ${label}`} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export default function PracticeMatches({ w }) {
  const [mode, setMode] = useState('both');
  const [alliance, setAlliance] = useState('Red');
  const [values, setValues] = useState(emptyPractice);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const editable = canEdit(w.member.role, w.member.mentor_edit);
  const matches = (w.data.matches || []).filter((match) => match.practiceScore).slice().reverse();
  const score = practiceScore(values, mode, alliance);
  const stage = timerStage(mode, elapsed);
  const mean = matches.length
    ? (matches.reduce((total, match) => total + (Number(match.points) || 0), 0) / matches.length).toFixed(1)
    : '—';
  const best = matches.length ? Math.max(...matches.map((match) => Number(match.points) || 0)) : '—';

  useEffect(() => {
    if (!running || startedAt === null) return undefined;
    const tick = () => {
      const next = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(next);
      if (timerStage(mode, next).done) setRunning(false);
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [running, startedAt, mode]);

  function changeMode(next) {
    setMode(next);
    setRunning(false);
    setElapsed(0);
    setStartedAt(null);
  }

  function toggleTimer() {
    if (running) {
      setRunning(false);
      return;
    }
    if (stage.done) return;
    setStartedAt(Date.now() - elapsed * 1000);
    setRunning(true);
  }

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function addFlower(key, item) {
    setValues((current) => ({
      ...current,
      flowers: { ...current.flowers, [key]: [...current.flowers[key], item] },
    }));
  }

  function removeFlower(key, index) {
    setValues((current) => ({
      ...current,
      flowers: { ...current.flowers, [key]: current.flowers[key].filter((_, i) => i !== index) },
    }));
  }

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      await w.save('matches', {
        event: title.trim() || 'Practice match',
        number: matches.length + 1,
        type: 'Practice',
        alliance,
        date: localDate(),
        points: score.total,
        notes: notes.trim(),
        practiceScore: { season: '2026–27 BIOBUZZ', mode, alliance, ...values, ...score, elapsedSeconds: elapsed, recordedBy: w.member.name, savedAt: new Date().toISOString() },
      });
      setValues(emptyPractice());
      setNotes('');
      setTitle('');
      setRunning(false);
      setElapsed(0);
      setStartedAt(null);
      setMessage('Practice match saved for the team.');
    } catch (error) {
      setMessage(error.message || 'Could not save this practice match.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="practice-page">
      <div className="practice-topline">
        <div><div className="eyebrow">BIOBUZZ / ONE ROBOT</div><h2>Practice match scorer</h2><p>Count what your robot scores. Save each run to your team’s match data.</p></div>
        <div className="practice-total"><span>YOUR SCORE</span><strong>{score.total}</strong><small>{score.autoPoints} auto · {score.telePoints} teleop</small></div>
      </div>

      <div className="practice-setup panel">
        <label>Practice name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Saturday drive practice" maxLength={100} /></label>
        <label>Period<select value={mode} onChange={(event) => changeMode(event.target.value)}><option value="both">Auto + Teleop</option><option value="auto">Auto only</option><option value="tele">Teleop only</option></select></label>
        <label>Alliance color<select value={alliance} onChange={(event) => setAlliance(event.target.value)}><option>Red</option><option>Blue</option></select></label>
      </div>

      <div className="practice-timer panel" role="timer" aria-label="Practice match timer">
        <div><span className="eyebrow">MATCH TIMER</span><strong>{stage.name}</strong><small>{mode === 'both' ? '30s auto · 8s wait · 1:30 teleop · 30s end game' : mode === 'auto' ? '30s autonomous' : '1:30 teleop · 30s end game'}</small></div>
        <b>{formatTime(stage.seconds)}</b>
        <div className="practice-timer-actions"><button className="primary" type="button" disabled={stage.done} onClick={toggleTimer}>{running ? 'Pause' : elapsed ? 'Resume' : 'Start'}</button><button className="outline" type="button" onClick={() => { setRunning(false); setElapsed(0); setStartedAt(null); }}>Reset timer</button></div>
      </div>

      {mode !== 'tele' && <section className="panel practice-section"><div className="panel-heading"><h3>Autonomous</h3><b>{score.autoPoints} pts</b></div><div className="practice-fields"><Counter label="HIVE tips" value={values.autoHiveTips} points="20 points each" onChange={(value) => update('autoHiveTips', value)} /><label className="practice-check"><input type="checkbox" checked={values.autoLeave} onChange={(event) => update('autoLeave', event.target.checked)} /> Left the starting wall <small>+3 points</small></label><label className="practice-check"><input type="checkbox" checked={values.autoPark} onChange={(event) => update('autoPark', event.target.checked)} /> Parked in loading zone <small>+5 points</small></label></div></section>}

      {mode !== 'auto' && <><section className="panel practice-section"><div className="panel-heading"><h3>Teleop & end game</h3><b>{score.telePoints} pts</b></div><div className="practice-fields"><Counter label="HIVE tips" value={values.teleHiveTips} points="20 points each" onChange={(value) => update('teleHiveTips', value)} /><Counter label="Pollen or nectar left in upward CELL" value={values.cellElements} points="2 points each at match end" onChange={(value) => update('cellElements', value)} /><Counter label="Pollen or nectar in your GARDEN" value={values.gardenElements} points="1 point each at match end" onChange={(value) => update('gardenElements', value)} /><label className="practice-check"><input type="checkbox" checked={values.telePark} onChange={(event) => update('telePark', event.target.checked)} /> Parked in loading zone <small>+5 points at match end</small></label></div></section>
      <section className="panel practice-section"><div className="panel-heading"><div><h3>Flowers</h3><p className="muted">Add elements bottom to top. The top nectar owns the flower; your bottom nectar adds 5 points.</p></div></div><div className="practice-flowers">{FLOWERS.map(([key, label]) => { const stack = values.flowers[key]; const result = flowerPoints(stack, alliance); return <div className="practice-flower" key={key}><div className="practice-flower-head"><strong>{label}</strong><b>{result.points} pts</b></div><small>{result.owned ? `${alliance} owns it` : 'Not owned by your color'}</small><div className="practice-flower-stack">{stack.length ? stack.map((item, index) => <button type="button" title="Remove element" className={`flower-piece ${item}`} key={`${index}-${item}`} onClick={() => removeFlower(key, index)}>{item === 'pollen' ? 'P' : item === 'red' ? 'R' : 'B'} ×</button>) : <span>Empty flower</span>}</div><div className="practice-flower-add"><button type="button" onClick={() => addFlower(key, 'pollen')}>+ Pollen</button><button type="button" onClick={() => addFlower(key, 'red')}>+ Red nectar</button><button type="button" onClick={() => addFlower(key, 'blue')}>+ Blue nectar</button></div></div>; })}</div></section></>}

      <section className="panel practice-save"><label>Notes from this run<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What worked? What should you change next time?" rows={3} /></label><button className="primary" type="button" onClick={save} disabled={!editable || saving}>{saving ? 'Saving…' : 'Save practice match'}</button>{!editable && <small>Your role can view practice matches but cannot add them.</small>}{message && <p role="status">{message}</p>}</section>

      <section className="panel practice-history"><div className="panel-heading"><div><h3>Team practice history</h3><p className="muted">Every saved run is shared with approved teammates and included in match analytics.</p></div></div><div className="practice-stats"><div><small>RUNS</small><strong>{matches.length}</strong></div><div><small>AVERAGE SCORE</small><strong>{mean}</strong></div><div><small>BEST SCORE</small><strong>{best}</strong></div></div>{matches.length ? <div className="practice-history-list">{matches.map((match) => <details key={match.id}><summary><strong>{match.event}</strong><span>{match.date} · {match.practiceScore.mode === 'both' ? 'Auto + Teleop' : match.practiceScore.mode === 'auto' ? 'Auto' : 'Teleop'}</span><b>{match.points} pts</b></summary><div><p>{match.practiceScore.autoPoints} auto · {match.practiceScore.telePoints} teleop · {match.practiceScore.alliance} alliance</p><p>Recorded by {match.practiceScore.recordedBy} · Timer {formatTime(match.practiceScore.elapsedSeconds || 0)}</p><p>Auto: {match.practiceScore.autoHiveTips || 0} HIVE tips · Leave {match.practiceScore.autoLeave ? 'yes' : 'no'} · Park {match.practiceScore.autoPark ? 'yes' : 'no'}</p><p>Teleop: {match.practiceScore.teleHiveTips || 0} HIVE tips · CELL {match.practiceScore.cellElements || 0} · GARDEN {match.practiceScore.gardenElements || 0} · Park {match.practiceScore.telePark ? 'yes' : 'no'}</p>{FLOWERS.map(([key, label]) => <p key={key}>{label}: {(match.practiceScore.flowers?.[key] || []).join(' → ') || 'empty'} ({match.practiceScore.flowerBreakdown?.[key]?.points || 0} pts)</p>)}{match.notes && <p>Notes: {match.notes}</p>}</div></details>)}</div> : <p className="practice-empty">No practice matches saved yet. Start a run above.</p>}</section>
      <p className="practice-source">Point values: <a href="https://ftc-resources.firstinspires.org/ftc/archive/2027/game/manual-10" target="_blank" rel="noreferrer">FIRST BIOBUZZ Competition Manual §10.5</a>. This is a one-robot practice estimate; official match scores include alliance play.</p>
    </div>
  );
}
