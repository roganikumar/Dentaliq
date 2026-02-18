// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV = [
  { to: '/patients', label: 'Patients', icon: '⊞' },
  { to: '/chat', label: 'AI Chat', icon: '✦' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '28px 24px 22px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 22, fontWeight: 700 }}>
          <span style={{ color: 'var(--teal-light)' }}>Dental</span>IQ
        </div>
        <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, marginTop: 2, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Clinic OS
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '18px 12px' }}>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--teal-light)' : 'rgba(255,255,255,.55)',
              background: isActive ? 'rgba(20,184,166,.12)' : 'transparent',
              marginBottom: 4, transition: 'all var(--transition)',
            })}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
              {user?.name || 'User'}
            </div>
            <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 11 }}>
              {user?.role || 'staff'}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '7px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
          color: 'rgba(255,255,255,.5)', fontSize: 13, fontFamily: 'var(--font-body)',
          cursor: 'pointer', transition: 'all var(--transition)',
        }}
          onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,.15)'; e.target.style.color = '#fca5a5'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,.06)'; e.target.style.color = 'rgba(255,255,255,.5)'; }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
