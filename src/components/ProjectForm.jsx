import { useState } from 'react';

function makeDots(count = 8) {
  return Array(8).fill(null).map(() => ({ member: '', responsibilities: [] }));
}

export default function ProjectForm({ initial, team = [], onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const raw = initial ?? {};
    const leads = Array.isArray(raw.leads)
      ? raw.leads
      : raw.leads ? raw.leads.split(',').map(s => s.trim()).filter(Boolean) : [];
    return initial
      ? { ...initial, dotCount: initial.dotCount || 8, leads }
      : { name: '', date: '', leads: [], blessed: false, dotCount: 8, id: crypto.randomUUID(), dots: makeDots() };
  });
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: false }));
  }

  function toggleLead(name) {
    const next = form.leads.includes(name)
      ? form.leads.filter(l => l !== name)
      : [...form.leads, name];
    set('leads', next);
  }

  function handleSave() {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.leads.length) e.leads = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{form.name.trim() || (initial ? 'Edit Project' : 'New Project')}</h1>
          <p className="page-subtitle">Set up the event details</p>
        </div>
      </div>

      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="form-group">
          <label className="form-label">Event or Project Name</label>
          <input
            className="form-input"
            placeholder="e.g. Spring Gala"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            autoFocus
            style={errors.name ? { borderColor: 'var(--yellow)' } : {}}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Date or Deadline</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Event Lead(s)</label>
            {team.length > 0 ? (
              <>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2,
                  padding: '8px 10px', borderRadius: 8, minHeight: 44,
                  border: `1.5px solid ${errors.leads ? 'var(--yellow)' : 'var(--border)'}`,
                  background: 'var(--surface)',
                }}>
                  {team.map(m => {
                    const selected = form.leads.includes(m.name);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleLead(m.name)}
                        style={{
                          padding: '4px 12px', borderRadius: 20,
                          border: `1.5px solid ${selected ? 'var(--blue)' : 'var(--border)'}`,
                          background: selected ? 'var(--blue)' : 'var(--cream)',
                          color: selected ? '#fff' : 'var(--muted)',
                          fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
                          fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
                {form.leads.length === 0 && !errors.leads && (
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'Montserrat, sans-serif' }}>
                    Select one or more leads.
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  className="form-input"
                  placeholder="Name(s), comma separated"
                  value={form.leads.join(', ')}
                  onChange={e => set('leads', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  style={errors.leads ? { borderColor: 'var(--yellow)' } : {}}
                />
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'Montserrat, sans-serif' }}>
                  No team members yet — go to the <strong>Team</strong> tab to build your roster first.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Team member count picker */}
        <div className="form-group">
          <label className="form-label">How many team members?</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <button
                key={n}
                onClick={() => set('dotCount', n)}
                style={{
                  width: 40, height: 40, borderRadius: 8, border: '1.5px solid',
                  borderColor: form.dotCount === n ? 'var(--green)' : 'var(--border)',
                  background: form.dotCount === n ? 'var(--green)' : 'var(--surface)',
                  color: form.dotCount === n ? '#fff' : 'var(--text)',
                  fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}>
            You can change this later in the project.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            className="btn-primary"
            onClick={handleSave}
          >
            {initial ? 'Save Changes' : 'Create Project'}
          </button>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
