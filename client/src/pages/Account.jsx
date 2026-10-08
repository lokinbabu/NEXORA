import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, ApiError } from '../services/api.js';

export default function Account() {
  const { user, refreshCached, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || user?.address?.phone || '',
    fullName: user?.address?.fullName || user?.name || '',
    line1: user?.address?.line1 || '',
    line2: user?.address?.line2 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'India',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        address: {
          fullName: form.fullName,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          phone: form.phone,
        },
      };
      const d = await api.put('/auth/profile', payload);
      refreshCached(d.user);
      toast.success('Profile saved.');
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors || {}).length) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k.split('.').pop(), v])));
        toast.error('Please fix the highlighted fields.');
      } else {
        toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const doLogout = async () => {
    await logout();
    toast.info('You have been logged out.');
    navigate('/');
  };

  const Field = ({ id, label, ...rest }) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={form[id]} onChange={set(id)} {...rest} />
      {errors[id] && <span className="field-error">{errors[id]}</span>}
    </div>
  );

  return (
    <div className="container account-page">
      <div className="account-head">
        <div>
          <span className="eyebrow">Account</span>
          <h1 className="page-title">Hey, {user.name.split(' ')[0]}</h1>
          <p className="muted">{user.email} · member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="account-head__actions">
          {user.role === 'admin' && <Link to="/admin" className="btn btn--secondary btn--sm">Admin Panel →</Link>}
          <button type="button" className="btn btn--ghost btn--sm" onClick={doLogout}>Log out</button>
        </div>
      </div>

      <div className="account-links">
        <Link to="/my-orders" className="quick-tile"><strong>My Orders</strong><span>Track &amp; review purchases</span></Link>
        <Link to="/cart" className="quick-tile"><strong>Cart</strong><span>{'Your current picks'}</span></Link>
      </div>

      <form className="panel account-form" onSubmit={save}>
        <h2 className="panel__title">Profile</h2>
        <div className="form-grid">
          <Field id="name" label="Full name" required />
          <Field id="phone" label="Phone" type="tel" />
        </div>

        <h2 className="panel__title">Default shipping address</h2>
        <div className="form-grid">
          <Field id="fullName" label="Recipient name" />
          <div />
          <div className="field field--wide">
            <label htmlFor="line1">Address (house no, street)</label>
            <input id="line1" value={form.line1} onChange={set('line1')} />
            {errors.line1 && <span className="field-error">{errors.line1}</span>}
          </div>
          <div className="field field--wide">
            <label htmlFor="line2">Landmark / area (optional)</label>
            <input id="line2" value={form.line2} onChange={set('line2')} />
          </div>
          <Field id="city" label="City" />
          <Field id="state" label="State" />
          <Field id="postalCode" label="PIN / postal code" />
          <Field id="country" label="Country" />
        </div>

        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
