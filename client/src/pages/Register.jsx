import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ApiError } from '../services/api.js';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = 'Please enter a valid email address.';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const user = await register(form.name, form.email, form.password);
      toast.success(`Welcome to NEXORA, ${user.name.split(' ')[0]}!`);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors || {}).length) {
        setErrors(err.errors);
        toast.error(err.message);
      } else {
        toast.error(err.message || 'Registration failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <span className="eyebrow">Join NEXORA</span>
      <h1>Create your account</h1>
      <p className="muted">Free forever. Pay cash on delivery when your gear arrives.</p>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" autoComplete="name" value={form.name} onChange={set('name')} placeholder="Alex Sharma" />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="6+ characters" />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </div>
        </div>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-card__swap">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
