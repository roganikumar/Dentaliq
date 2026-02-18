// src/components/patients/PatientsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { patientsApi } from '../../services/api';
import { format, parseISO } from 'date-fns';

// ─── Helpers ─────────────────────────────────────────────────
const avatar = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
const fmtDate = (d) => { try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return '—'; } };

// ─── Patient Form Modal ───────────────────────────────────────
function PatientModal({ patient, onClose, onSaved }) {
  const isEdit = !!patient;
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: patient ? {
      name: patient.name,
      email: patient.email || '',
      phone: patient.phone || '',
      dob: patient.dob ? patient.dob.slice(0, 10) : '',
      medical_notes: patient.medical_notes || '',
    } : {},
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await patientsApi.update(patient.id, data);
        toast.success('Patient updated');
      } else {
        await patientsApi.create(data);
        toast.success('Patient created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
            {isEdit ? 'Edit Patient' : 'New Patient'}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="label">Full Name *</label>
              <input className={`input ${errors.name ? 'error' : ''}`}
                {...register('name', { required: 'Name is required', maxLength: { value: 200, message: 'Too long' } })}
              />
              {errors.name && <span className="input-error">{errors.name.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className={`input ${errors.email ? 'error' : ''}`} type="email"
                {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
              />
              {errors.email && <span className="input-error">{errors.email.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="input" {...register('phone')} />
            </div>
            <div className="form-group">
              <label className="label">Date of Birth</label>
              <input className="input" type="date" {...register('dob')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="label">Medical Notes</label>
              <textarea className="input" rows={3}
                placeholder="Allergies, conditions, treatment notes..."
                {...register('medical_notes')}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : (isEdit ? 'Save Changes' : 'Create Patient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────
function DeleteModal({ patient, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    setLoading(true);
    try {
      await patientsApi.delete(patient.id);
      toast.success('Patient archived');
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)' }}>Archive Patient</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--gray-600)', marginBottom: 20 }}>
            Archive <strong>{patient.name}</strong>? Their records will be preserved but the patient will no longer appear in active listings.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger" onClick={confirm} disabled={loading}>
              {loading ? 'Archiving…' : 'Archive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [deletePatient, setDeletePatient] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPatients = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await patientsApi.list({ page, limit: 10, search: debouncedSearch });
      setPatients(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { fetchPatients(1); }, [fetchPatients]);

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Patients</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
            {pagination.total} patient{pagination.total !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          + New Patient
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: 16 }}>⊕</span>
        <input className="input"
          style={{ paddingLeft: 40, width: '100%', maxWidth: 400 }}
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>Date of Birth</th>
                <th>Notes</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div className="spinner spinner-lg" />
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)' }}>
                    {search ? 'No patients match your search.' : 'No patients yet. Create your first one!'}
                  </td>
                </tr>
              ) : patients.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--ink)', color: 'var(--teal-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                      }}>{avatar(p.name)}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{p.phone || '—'}</td>
                  <td style={{ fontSize: 13 }}>{p.dob ? fmtDate(p.dob) : '—'}</td>
                  <td style={{ maxWidth: 220 }}>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.medical_notes || '—'}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{fmtDate(p.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm"
                        title="Chat" onClick={() => navigate(`/chat/${p.id}`)}
                        style={{ color: 'var(--teal)' }}>
                        ✦
                      </button>
                      <button className="btn btn-ghost btn-sm"
                        title="Edit" onClick={() => setEditPatient(p)}>
                        ✎
                      </button>
                      <button className="btn btn-ghost btn-sm"
                        title="Archive" onClick={() => setDeletePatient(p)}
                        style={{ color: 'var(--red)' }}>
                        ⊗
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </span>
            <div className="pagination">
              <button className="page-btn" disabled={pagination.page === 1}
                onClick={() => fetchPatients(pagination.page - 1)}>‹</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(n => Math.abs(n - pagination.page) <= 2)
                .map(n => (
                  <button key={n} className={`page-btn ${n === pagination.page ? 'active' : ''}`}
                    onClick={() => fetchPatients(n)}>{n}</button>
                ))}
              <button className="page-btn" disabled={pagination.page === pagination.pages}
                onClick={() => fetchPatients(pagination.page + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {createOpen && <PatientModal onClose={() => setCreateOpen(false)} onSaved={() => fetchPatients(1)} />}
      {editPatient && <PatientModal patient={editPatient} onClose={() => setEditPatient(null)} onSaved={() => fetchPatients(pagination.page)} />}
      {deletePatient && <DeleteModal patient={deletePatient} onClose={() => setDeletePatient(null)} onDeleted={() => fetchPatients(1)} />}
    </div>
  );
}
