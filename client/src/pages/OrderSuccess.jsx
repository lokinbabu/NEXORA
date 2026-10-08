import { Link, useLocation, useParams } from 'react-router-dom';
import { useApi } from '../hooks/hooks.js';
import { Spinner } from '../components/Feedback.jsx';
import { formatPrice, formatDateTime } from '../utils/format.js';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  // Prefer the order passed from checkout (instant), fall back to fetching.
  const cached = location.state?.order;
  const { data, loading, error } = useApi(`/orders/${id}`, { skip: Boolean(cached) });
  const order = cached || data?.order;

  if (!order && loading) return <div className="page-center container"><Spinner label="Confirming your order" /></div>;
  if (!order && error) {
    return (
      <div className="container page-center-narrow">
        <div className="error-state" role="alert">
          <h3>Order confirmation unavailable</h3>
          <p>{error.message}</p>
          <Link to="/my-orders" className="btn btn--primary btn--sm">View My Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-center-narrow">
      <div className="success-card">
        <div className="success-card__check" aria-hidden>
          <svg viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(52,211,153,0.35)" strokeWidth="2" />
            <path className="success-card__tick" d="M20 33 l9 9 16-18" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="eyebrow">Order confirmed</span>
        <h1>Thank you — your gear is on its way!</h1>
        <p className="muted">
          Order <strong className="mono">{order.orderNumber}</strong> was placed successfully on {formatDateTime(order.createdAt)}.
          Keep the exact cash amount ready for delivery.
        </p>

        <div className="success-card__box">
          <div className="cart-summary__row"><span>Amount payable (COD)</span><span><strong>{formatPrice(order.total)}</strong></span></div>
          <div className="cart-summary__row"><span>Items</span><span>{order.items.reduce((n, i) => n + i.quantity, 0)}</span></div>
          <div className="cart-summary__row"><span>Payment method</span><span>Cash on Delivery</span></div>
          <div className="cart-summary__row"><span>Deliver to</span><span className="right-align">{order.shippingAddress.fullName}, {order.shippingAddress.city}</span></div>
        </div>

        <div className="success-card__actions">
          <Link to={`/my-orders/${order.id}`} className="btn btn--primary">View order details</Link>
          <Link to="/products" className="btn btn--ghost">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
