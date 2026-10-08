import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/hooks.js';
import ProductArt from '../../components/ProductArt.jsx';
import { Spinner, ErrorState } from '../../components/Feedback.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiError } from '../../services/api.js';
import { CATEGORIES } from '../../utils/constants.js';

const EMPTY = {
  name: '',
  brand: 'NEXORA',
  category: 'Keyboards',
  price: '',
  discount: 0,
  stock: '',
  description: '',
  image: '',
  rating: 0,
  numReviews: 0,
  featured: false,
  specs: [{ key: '', value: '' }],
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useApi(isEdit ? `/products/${id}` : '/products', { skip: !isEdit });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);

  useEffect(() => {
    if (isEdit && existing.data?.product) {
      const p = existing.data.product;
      setForm({
        name: p.name,
        brand: p.brand || '',
        category: p.category,
        price: p.price,
        discount: p.discount || 0,
        stock: p.stock,
        description: p.description,
        image: p.image || '',
        rating: p.rating || 0,
        numReviews: p.numReviews || 0,
        featured: Boolean(p.featured),
        specs: p.specs?.length ? p.specs.map((s) => ({ ...s })) : [{ key: '', value: '' }],
      });
      setLoaded(true);
    }
  }, [isEdit, existing.data]);

  if (isEdit && existing.loading && !loaded) return <div className="page-center"><Spinner label="Loading product" /></div>;
  if (isEdit && existing.error) return <ErrorState error={existing.error} onRetry={existing.refetch} />;

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  const setSpec = (i, k) => (e) =>
    setForm((f) => {
      const specs = f.specs.map((s, idx) => (idx === i ? { ...s, [k]: e.target.value } : s));
      return { ...f, specs };
    });

  const addSpec = () => setForm((f) => ({ ...f, specs: [...f.specs, { key: '', value: '' }] }));
  const removeSpec = (i) =>
    setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i).concat(f.specs.length === 1 ? [{ key: '', value: '' }] : []) }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discount: Number(form.discount || 0),
        stock: Number(form.stock || 0),
        rating: Number(form.rating || 0),
        numReviews: Number(form.numReviews || 0),
        specs: form.specs.filter((s) => s.key.trim() && s.value.trim()),
      };
      if (isEdit) {
        await api.put(`/admin/products/${id}`, payload);
        toast.success(`"${payload.name}" updated.`);
      } else {
        await api.post('/admin/products', payload);
        toast.success(`"${payload.name}" added to the store.`);
      }
      navigate('/admin/products');
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors || {}).length) {
        setErrors(err.errors);
        setFormError(err.message);
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const err = (k) => errors[k];

  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <span className="eyebrow">{isEdit ? 'Edit product' : 'New product'}</span>
          <h1 className="page-title">{isEdit ? form.name || 'Edit product' : 'Add a product'}</h1>
        </div>
        <Link to="/admin/products" className="btn btn--ghost btn--sm">← Back to products</Link>
      </header>

      <form className="product-form" onSubmit={submit} noValidate>
        {formError && <div className="form-banner form-banner--error" role="alert">{formError}</div>}

        <div className="product-form__grid">
          <div className="panel">
            <h2 className="panel__title">Basics</h2>
            <div className="field">
              <label htmlFor="pf-name">Product name *</label>
              <input id="pf-name" value={form.name} onChange={set('name')} placeholder="e.g. VX-9 TKL Mechanical Keyboard" />
              {err('name') && <span className="field-error">{err('name')}</span>}
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="pf-brand">Brand</label>
                <input id="pf-brand" value={form.brand} onChange={set('brand')} placeholder="NEXORA" />
                {err('brand') && <span className="field-error">{err('brand')}</span>}
              </div>
              <div className="field">
                <label htmlFor="pf-category">Category *</label>
                <select id="pf-category" value={form.category} onChange={set('category')}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {err('category') && <span className="field-error">{err('category')}</span>}
              </div>
              <div className="field">
                <label htmlFor="pf-price">Price (₹) *</label>
                <input id="pf-price" type="number" min="1" value={form.price} onChange={set('price')} placeholder="8999" />
                {err('price') && <span className="field-error">{err('price')}</span>}
              </div>
              <div className="field">
                <label htmlFor="pf-discount">Discount (% off)</label>
                <input id="pf-discount" type="number" min="0" max="90" value={form.discount} onChange={set('discount')} />
                {err('discount') && <span className="field-error">{err('discount')}</span>}
              </div>
              <div className="field">
                <label htmlFor="pf-stock">Stock *</label>
                <input id="pf-stock" type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="25" />
                {err('stock') && <span className="field-error">{err('stock')}</span>}
              </div>
              <div className="field">
                <label htmlFor="pf-rating">Rating (0–5)</label>
                <input id="pf-rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={set('rating')} />
                {err('rating') && <span className="field-error">{err('rating')}</span>}
              </div>
              <div className="field">
                <label htmlFor="pf-numReviews">Number of reviews</label>
                <input id="pf-numReviews" type="number" min="0" value={form.numReviews} onChange={set('numReviews')} />
                {err('numReviews') && <span className="field-error">{err('numReviews')}</span>}
              </div>
            </div>
            <div className="field">
              <label htmlFor="pf-desc">Description *</label>
              <textarea id="pf-desc" rows="5" value={form.description} onChange={set('description')} placeholder="What makes this product great for gamers?" />
              {err('description') && <span className="field-error">{err('description')}</span>}
            </div>
            <label className="check-inline">
              <input type="checkbox" checked={form.featured} onChange={set('featured')} />
              Show in “Featured gear” on the homepage
            </label>
          </div>

          <div className="product-form__side">
            <div className="panel">
              <h2 className="panel__title">Image</h2>
              <div className="pf-preview">
                {form.image ? <img src={form.image} alt="Product preview" onError={(e) => { e.currentTarget.style.opacity = '0.2'; }} /> : null}
                <ProductArt
                  product={{ id: form.name || 'draft', name: form.name || 'New product', category: form.category }}
                  className={form.image ? 'product-art--backup' : ''}
                />
              </div>
              <div className="field">
                <label htmlFor="pf-image">Image URL or path (optional)</label>
                <input id="pf-image" value={form.image} onChange={set('image')} placeholder="/images/products/my-product.png" />
                {err('image') && <span className="field-error">{err('image')}</span>}
              </div>
              <p className="muted">
                Leave empty to use the built-in NEXORA artwork for the selected category.
                Serve files from <code>client/public/images/products/</code> for local paths.
              </p>
            </div>

            <div className="panel">
              <div className="panel__head-row">
                <h2 className="panel__title">Specifications</h2>
                <button type="button" className="btn btn--ghost btn--xs" onClick={addSpec}>+ Row</button>
              </div>
              {form.specs.map((s, i) => (
                <div className="spec-edit-row" key={i}>
                  <input value={s.key} onChange={setSpec(i, 'key')} placeholder="Label (e.g. Weight)" aria-label={`Specification ${i + 1} label`} />
                  <input value={s.value} onChange={setSpec(i, 'value')} placeholder="Value (e.g. 39 g)" aria-label={`Specification ${i + 1} value`} />
                  <button type="button" className="spec-edit-row__remove" onClick={() => removeSpec(i)} aria-label="Remove row">×</button>
                </div>
              ))}
              {err('specs') && <span className="field-error">{err('specs')}</span>}
            </div>
          </div>
        </div>

        <div className="product-form__actions">
          <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
          <Link to="/admin/products" className="btn btn--ghost btn--lg">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
