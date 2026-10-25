import React, { useState } from 'react';
import { ArrowUpRight, Upload } from 'lucide-react';
import { canEdit } from './domain';
import { validateCadFile } from './cad';
import Records from './Records';

export default function DesignLibrary({ w }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const editable = canEdit(w.member.role, w.member.mentor_edit);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setNote('');
    try {
      validateCadFile(file);
      if (!title.trim()) throw Error('Add a title for this CAD file.');
      setBusy(true);
      const cadFile = await w.upload(file, { cad: true });
      await w.save('designs', {
        title: title.trim(),
        cadFile,
        cadName: file.name,
        description: 'Shared CAD file',
        stage: 'Prototype',
      });
      setFile(null);
      setTitle('');
      form.reset();
      setNote('CAD file shared with the team.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">ROBOT / ENGINEERING DESIGN</div>
        <h1>
          DESIGN. <span>SHARE. BUILD.</span>
        </h1>
        <p>Keep sketches, STEP exports, and SolidWorks files together for your team.</p>
      </div>
      <section className="panel cad-panel">
        <div className="panel-heading">
          <h2>Team CAD files</h2>
          <Upload size={19} />
        </div>
        <p>
          Upload .step or .stp for a portable 3D model. Native SolidWorks .sldprt, .sldasm, and
          .slddrw files also work. For an assembly with linked parts, upload a .zip containing all
          related files. Files can be up to 50 MB and are available to approved team members.
        </p>
        {w.demo ? (
          <p className="note">
            Sign in to a live team to share files. Demo mode has no shared file storage.
          </p>
        ) : editable ? (
          <form onSubmit={submit} className="cad-upload-form">
            <label>
              File title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="2026 drivetrain assembly"
              />
            </label>
            <label>
              STEP, SolidWorks, or ZIP file
              <input
                type="file"
                accept=".step,.stp,.sldprt,.sldasm,.slddrw,.zip"
                required
                onChange={(event) => setFile(event.target.files[0] || null)}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {note && (
              <p className="success" role="status">
                {note}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? 'Uploading…' : 'Upload for team'} <ArrowUpRight size={15} />
            </button>
          </form>
        ) : (
          <p className="note">Your role can download shared CAD files.</p>
        )}
      </section>
      <Records kind="designs" w={w} />
    </>
  );
}
