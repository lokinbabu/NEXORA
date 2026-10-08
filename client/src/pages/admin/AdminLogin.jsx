import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ApiError } from '../../services/api.js';

export default function AdminLogin() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [notAdmin, setNotAdmin] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setNotAdmin(false);
    if (!form.email.trim() || !form.password) {
      setErrors({
        email: form.email.trim() ? undefined : 'Please enter the admin email.',
        password: form.password ? undefined : 'Please enter the admin password.',
      });
      return;
    }
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        setNotAdmin(true);
        toast.error('This account does not have admin access.');
        return;
      }
      toast.success(`Admin session started — welcome, ${user.name.split(' ')[0]}.`);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors || {}).length) setErrors(err.errors);
      toast.error(err.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <Logo />
          <span className="admin-side__tag">ADMIN CONSOLE</span>
        </div>
        <h1>Admin login</h1>
        <p className="muted">Restricted area — NEXORA staff accounts only.</p>

        {notAdmin && (
          <div className="form-banner form-banner--error" role="alert">
            This account is not an admin. Use the account created by the seed script.
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="admin-email">Admin email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@nexora.gg"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="admin-password">Admin password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
            {busy ? 'Verifying…' : 'Enter admin console'}
          </button>
        </form>

        <p className="auth-card__admin">
          <Link to="/">← Back to store</Link>
          <span> · </span>
          <Link to="/login">Customer login</Link>
        </p>
      </div>
    </div>
  );
}
