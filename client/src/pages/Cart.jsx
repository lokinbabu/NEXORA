import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductArt from '../components/ProductArt.jsx';
import QuantityStepper from '../components/QuantityStepper.jsx';
import { EmptyState } from '../components/Feedback.jsx';
import { formatPrice } from '../utils/format.js';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../utils/constants.js';

export default function Cart() {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  // Re-validate prices and stock against the server whenever the cart is opened.
  useEffect(() => {
    if (cart.items.length === 0) return;
    setSyncing(true);
    cart
      .refresh()
      .then((problems) => {
        problems.forEach((p) =>
          p.removed ? toast.error(`${p.name} ${p.reason}. Removed from cart.`) : toast.info(`${p.name}: ${p.reason}.`)
        );
      })
      .catch(() => toast.error('Could not sync cart with the store.'))
      .finally(() => setSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <EmptyState
          icon="▣"
          title="Your cart is empty"
          message="Browse the store and gear up — your picks will show up here."
          action={<Link to="/products" className="btn btn--primary">Start shopping</Link>}
        />
      </div>
    );
  }

  const shipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  return (
    <div className="container cart-page">
      <h1 className="page-title">Your cart <span className="muted">({cart.count} item{cart.count === 1 ? '' : 's'})</span></h1>

      {syncing && <div className="sync-note">Syncing prices &amp; stock with the store…</div>}

      <div className="cart-page__grid">
        <div className="cart-lines">
          {cart.items.map((item) => (
            <div className="cart-line" key={item.id}>
              <Link to={`/products/${item.id}`} className="cart-line__art" aria-label={item.name}>
                {item.image ? <img src={item.image} alt="" /> : null}
                <ProductArt product={item} className={item.image ? 'product-art--backup' : ''} />
              </Link>
              <div className="cart-line__info">
                <span className="cart-line__brand">{item.brand || item.category}</span>
                <Link to={`/products/${item.id}`} className="cart-line__name">{item.name}</Link>
                <span className="cart-line__price">{formatPrice(item.price)} each</span>
                {item.qty >= (item.stock || 99) && <span className="cart-line__max">Max available: {item.stock}</span>}
              </div>
              <div className="cart-line__controls">
                <QuantityStepper
                  small
                  value={item.qty}
                  max={item.stock || 99}
                  onChange={(q) => cart.setQty(item.id, q)}
                />
                <button
                  type="button"
                  className="cart-line__remove"
                  onClick={() => {
                    cart.remove(item.id);
                    toast.info(`${item.name} removed from cart.`);
                  }}
                >
                  Remove
                </button>
              </div>
              <div className="cart-line__total">{formatPrice(item.price * item.qty)}</div>
            </div>
          ))}
          <Link to="/products" className="btn btn--ghost btn--sm">← Continue shopping</Link>
        </div>

        <aside className="cart-summary" aria-label="Order summary">
          <h2>Summary</h2>
          <div className="cart-summary__row"><span>Items ({cart.count})</span><span>{formatPrice(cart.subtotal)}</span></div>
          <div className="cart-summary__row">
            <span>Shipping</span>
            <span>{shipping === 0 ? <span className="free-tag">FREE</span> : formatPrice(shipping)}</span>
          </div>
          {shipping > 0 && (
            <p className="cart-summary__hint">
              Add {formatPrice(FREE_SHIPPING_THRESHOLD - cart.subtotal)} more for free shipping.
            </p>
          )}
          <div className="cart-summary__row cart-summary__row--total">
            <span>Total</span><span>{formatPrice(cart.subtotal + shipping)}</span>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--lg btn--block"
            onClick={() => navigate('/checkout')}
          >
            Proceed to checkout
          </button>
          <p className="cart-summary__note">🔒 Final prices &amp; stock are verified at checkout.</p>
        </aside>
      </div>
    </div>
  );
}
