import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, ApiError } from '../services/api.js';
import ProductArt from '../components/ProductArt.jsx';
import { EmptyState } from '../components/Feedback.jsx';
import { formatPrice } from '../utils/format.js';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../utils/constants.js';

const FIELDS = [
  ['fullName', 'Full name', 'text'],
  ['phone', 'Phone number', 'tel'],
  ['line1', 'Address (house no, street)', 'text'],
  ['line2', 'Landmark / area (optional)', 'text'],
  ['city', 'City', 'text'],
  ['state', 'State', 'text'],
  ['postalCode', 'PIN / postal code', 'text'],
  ['country', 'Country', 'text'],
];

export default function Checkout() {
  const cart = useCart();
  const { user, refreshCached } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({
    fullName: user?.address?.fullName || user?.name || '',
    phone: user?.address?.phone || user?.phone || '',
    line1: user?.address?.line1 || '',
    line2: user?.address?.line2 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'India',
    notes: '',
    saveAddress: true,
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    if (cart.items.length === 0) return;
    let alive = true;
    cart.refresh().then((problems) => {
      if (alive) problems.forEach((p) => toast.info(`${p.name}: ${p.reason}.`));
    }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <EmptyState
          icon="▣"
          title="Nothing to check out"
          message="Your cart is empty. Add some gear first."
          action={<Link to="/products" className="btn btn--primary">Browse products</Link>}
        />
      </div>
    );
  }

  const shipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = cart.subtotal + shipping;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const placeOrder = async (e) => {
    e.preventDefault();
    setOrderError('');
    setFieldErrors({});
    setPlacing(true);
    try {
      const payload = {
        items: cart.items.map((i) => ({ productId: i.id, quantity: i.qty })),
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
        notes: form.notes,
        saveAddress: form.saveAddress,
      };
      const d = await api.post('/orders', payload);
      cart.clear();
      toast.success('Order placed! Pay cash when it arrives.');
      if (form.saveAddress && user) {
        refreshCached({
          ...user,
          phone: payload.shippingAddress.phone,
          address: payload.shippingAddress,
        });
      }
      navigate(`/order-success/${d.order.id}`, { replace: true, state: { order: d.order } });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors || {}).length) {
        setFieldErrors(err.errors);
        try {
          if (err.errors.items) setOrderError(JSON.parse(err.errors.items).map((i) => `${i.name} ${i.reason}.`).join(' '));
        } catch {
          setOrderError(err.errors.items || '');
        }
      } else {
        setOrderError(err.message);
      }
      // Prices/stock may have changed — resync the cart.
      cart.refresh().catch(() => {});
    } finally {
      setPlacing(false);
    }
  };

  const err = (name) => fieldErrors[`shippingAddress.${name}`] || fieldErrors[name];

  return (
    <div className="container checkout">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout__grid">
        <form className="checkout__form" onSubmit={placeOrder} noValidate>
          <section className="panel">
            <h2 className="panel__title">1 · Delivery details</h2>
            {user && <p className="muted checkout__who">Ordering as <strong>{user.email}</strong></p>}
            <div className="form-grid">
              {FIELDS.map(([name, label, type]) => (
                <div className={`field ${name === 'line1' ? 'field--wide' : ''}`} key={name}>
                  <label htmlFor={name}>{label}</label>
                  <input
                    id={name}
                    name={name}
                    type={type}
                    value={form[name]}
                    onChange={set(name)}
                    autoComplete={name === 'line1' ? 'address-line1' : name === 'postalCode' ? 'postal-code' : name}
                    required={name !== 'line2'}
                  />
                  {err(name) && <span className="field-error">{err(name)}</span>}
                </div>
              ))}
              <div className="field field--wide">
                <label htmlFor="notes">Delivery notes (optional)</label>
                <input id="notes" value={form.notes} onChange={set('notes')} placeholder="e.g. Call before delivery" />
              </div>
            </div>
            <label className="check-inline">
              <input
                type="checkbox"
                checked={form.saveAddress}
                onChange={(e) => setForm((f) => ({ ...f, saveAddress: e.target.checked }))}
              />
              Save this address to my account for next time
            </label>
          </section>

          <section className="panel">
            <h2 className="panel__title">2 · Payment method</h2>
            <label className="pay-option pay-option--selected">
              <input type="radio" name="payment" value="cod" defaultChecked />
              <div>
                <strong>Cash on Delivery</strong>
                <span>Pay in cash when your order arrives at your door. No advance payment needed.</span>
              </div>
              <span className="pay-option__tag">Selected</span>
            </label>
            <p className="muted pay-note">Online payments (UPI / cards) are not required for this store — COD keeps checkout simple and secure.</p>
          </section>

          {orderError && <div className="form-banner form-banner--error" role="alert">{orderError}</div>}

          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={placing}>
            {placing ? 'Placing your order…' : `Place order · ${formatPrice(total)}`}
          </button>
          <p className="muted checkout__fine">
            By placing the order you agree to keep the exact cash amount ready at delivery.
          </p>
        </form>

        <aside className="cart-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <div className="checkout__items">
            {cart.items.map((i) => (
              <div className="checkout__item" key={i.id}>
                <div className="checkout__item-art">
                  {i.image ? <img src={i.image} alt="" /> : null}
                  <ProductArt product={i} className={i.image ? 'product-art--backup' : ''} />
                </div>
                <div className="checkout__item-info">
                  <span>{i.name}</span>
                  <span className="muted">{formatPrice(i.price)} × {i.qty}</span>
                </div>
                <strong>{formatPrice(i.price * i.qty)}</strong>
              </div>
            ))}
          </div>
          <div className="cart-summary__row"><span>Items subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
          <div className="cart-summary__row">
            <span>Shipping</span>
            <span>{shipping === 0 ? <span className="free-tag">FREE</span> : formatPrice(shipping)}</span>
          </div>
          <div className="cart-summary__row cart-summary__row--total">
            <span>Total (COD)</span><span>{formatPrice(total)}</span>
          </div>
          <Link to="/cart" className="btn btn--ghost btn--sm btn--block">← Edit cart</Link>
        </aside>
      </div>
    </div>
  );
}
