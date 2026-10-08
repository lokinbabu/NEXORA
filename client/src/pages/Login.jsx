import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ApiError } from '../services/api.js';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.email.trim() || !form.password) {
      setErrors({
        email: form.email.trim() ? undefined : 'Please enter your email.',
        password: form.password ? undefined : 'Please enter your password.',
      });
      return;
    }
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const dest = location.state?.from || (user.role === 'admin' ? '/admin' : '/');
      navigate(dest, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors || {}).length) {
        setErrors(err.errors);
        toast.error(err.message);
      } else {
        toast.error(err.message || 'Login failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <span className="eyebrow">Welcome back</span>
      <h1>Log in to NEXORA</h1>
      <p className="muted">Track orders, check out faster, and manage your gear.</p>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} placeholder="••••••••" />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="auth-card__swap">
        New to NEXORA? <Link to="/register">Create an account</Link>
      </p>
      <p className="auth-card__admin">
        Managing the store? <Link to="/admin/login">Go to admin login</Link>
      </p>
    </div>
  );
}
