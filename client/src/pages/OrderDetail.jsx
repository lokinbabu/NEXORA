import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/hooks.js';
import { Spinner, EmptyState, ErrorState } from '../components/Feedback.jsx';
import { OrderStatusBadge } from '../components/StatusBadge.jsx';
import { formatPrice, formatDateTime } from '../utils/format.js';

const TRACK = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

function StatusTimeline({ status }) {
  if (status === 'Cancelled') {
    return (
      <div className="timeline timeline--cancelled">
        <div className="timeline__note">This order was cancelled. Any payments due are void.</div>
      </div>
    );
  }
  const idx = TRACK.indexOf(status);
  return (
    <div className="timeline" role="list">
      {TRACK.map((s, i) => (
        <div key={s} className={`timeline__step ${i <= idx ? 'is-done' : ''}`} role="listitem">
          <span className="timeline__dot" aria-hidden />
          <span className="timeline__label">{s}</span>
          {i < TRACK.length - 1 && <span className="timeline__bar" aria-hidden />}
        </div>
      ))}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useApi(`/orders/${id}`);

  if (loading) return <div className="page-center container"><Spinner label="Loading order" /></div>;
  if (error) {
    return error.status === 404 ? (
      <div className="container"><EmptyState icon="⬓" title="Order not found" message="It may belong to another account." action={<Link to="/my-orders" className="btn btn--primary">Back to My Orders</Link>} /></div>
    ) : (
      <div className="container"><ErrorState error={error} onRetry={refetch} /></div>
    );
  }

  const order = data.order;

  return (
    <div className="container order-detail">
      <Link to="/my-orders" className="btn btn--ghost btn--sm">← My Orders</Link>
      <header className="order-detail__head">
        <div>
          <span className="eyebrow">Order</span>
          <h1 className="page-title mono">{order.orderNumber}</h1>
          <p className="muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="order-detail__status">
          <OrderStatusBadge status={order.status} />
          <span className="muted">Cash on Delivery</span>
        </div>
      </header>

      <StatusTimeline status={order.status} />

      <div className="order-detail__grid">
        <section className="panel">
          <h2 className="panel__title">Items</h2>
          {order.items.map((i, idx) => (
            <div className="order-line" key={idx}>
              <div className="order-line__art">
                {i.image ? <img src={i.image} alt="" /> : null}
                <span className="order-line__fallback" aria-hidden>{i.category || '◇'}</span>
              </div>
              <div className="order-line__info">
                <strong>{i.name}</strong>
                <span className="muted">{formatPrice(i.price)} × {i.quantity}</span>
              </div>
              <strong>{formatPrice(i.price * i.quantity)}</strong>
            </div>
          ))}
          <div className="cart-summary__row"><span>Items subtotal</span><span>{formatPrice(order.itemsTotal)}</span></div>
          <div className="cart-summary__row"><span>Shipping</span><span>{order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}</span></div>
          <div className="cart-summary__row cart-summary__row--total"><span>Total (COD)</span><span>{formatPrice(order.total)}</span></div>
        </section>

        <aside className="panel">
          <h2 className="panel__title">Delivery address</h2>
          <address className="addr">
            <strong>{order.shippingAddress.fullName}</strong>
            <span>{order.shippingAddress.line1}</span>
            {order.shippingAddress.line2 ? <span>{order.shippingAddress.line2}</span> : null}
            <span>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</span>
            <span>{order.shippingAddress.country}</span>
            <span className="muted">Phone: {order.shippingAddress.phone}</span>
          </address>
          {order.notes ? (
            <>
              <h2 className="panel__title">Delivery notes</h2>
              <p className="muted">{order.notes}</p>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
