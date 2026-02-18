// src/components/auth/AuthPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { register: reg, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
      } else {
        await register(data.name, data.email, data.password);
      }
      navigate('/patients');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, var(--ink) 0%, #1a3549 60%, #0e2a1f 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px', color: '#fff',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700, marginBottom: 16 }}>
          <span style={{ color: 'var(--teal-light)' }}>Dental</span>IQ
        </div>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,.6)', maxWidth: 420, lineHeight: 1.6, marginBottom: 40 }}>
          AI-powered patient management for modern dental clinics.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {['Patient CRUD with search & pagination', 'AI-powered chat per patient', 'JWT authentication & secure sessions', 'HIPAA-aware data handling'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,.7)', fontSize: 15 }}>
              <span style={{ color: 'var(--teal-light)', fontSize: 14 }}>✓</span>
              {f}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, padding: '14px 18px', background: 'rgba(255,255,255,.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', maxWidth: 320 }}>
          <div style={{ fontSize: 11, color: 'var(--teal-light)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Demo credentials</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>admin@dentaliq.com</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-mono)' }}>password123</div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--white)', padding: 40,
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 6 }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 28 }}>
            {mode === 'login' ? 'Welcome back to DentalIQ' : 'Start managing your clinic'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input className={`input ${errors.name ? 'error' : ''}`}
                    placeholder="Dr. Your Name"
                    {...reg('name', { required: 'Name is required' })}
                  />
                  {errors.name && <span className="input-error">{errors.name.message}</span>}
                </div>
              )}
              <div className="form-group">
                <label className="label">Email</label>
                <input className={`input ${errors.email ? 'error' : ''}`}
                  type="email" placeholder="admin@clinic.com"
                  {...reg('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
                />
                {errors.email && <span className="input-error">{errors.email.message}</span>}
              </div>
              <div className="form-group">
                <label className="label">Password</label>
                <input className={`input ${errors.password ? 'error' : ''}`}
                  type="password" placeholder="••••••••"
                  {...reg('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
                />
                {errors.password && <span className="input-error">{errors.password.message}</span>}
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}
                style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 4 }}>
                {isSubmitting
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> {mode === 'login' ? 'Signing in…' : 'Creating…'}</>
                  : mode === 'login' ? 'Sign In →' : 'Create Account →'
                }
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--gray-500)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={{ color: 'var(--teal)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
