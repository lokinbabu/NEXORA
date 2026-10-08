import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const NAV = [
  { to: '/admin', end: true, label: 'Dashboard', icon: '▦' },
  { to: '/admin/products', label: 'Products', icon: '▤' },
  { to: '/admin/orders', label: 'Orders', icon: '⬓' },
  { to: '/admin/customers', label: 'Customers', icon: '◭' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    toast.info('Admin session ended.');
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-side ${open ? 'is-open' : ''}`}>
        <div className="admin-side__head">
          <Logo compact />
          <span className="admin-side__tag">ADMIN</span>
        </div>
        <nav className="admin-side__nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-side__link ${isActive ? 'is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="admin-side__icon" aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side__foot">
          <Link to="/" className="admin-side__store-link">← View store</Link>
          <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={doLogout}>
            Log out
          </button>
        </div>
      </aside>

      {open && <div className="navbar__scrim" onClick={() => setOpen(false)} aria-hidden />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle admin menu">
            <span /><span /><span />
          </button>
          <div className="admin-topbar__spacer" />
          <div className="admin-topbar__user">
            <span className="navbar__avatar">{(user?.name || 'A').charAt(0)}</span>
            <span>{user?.name}</span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
