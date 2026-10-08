import { Link } from 'react-router-dom';
import { useApi } from '../hooks/hooks.js';
import { Spinner, EmptyState, ErrorState } from '../components/Feedback.jsx';
import { OrderStatusBadge } from '../components/StatusBadge.jsx';
import { formatPrice, formatDate } from '../utils/format.js';

export default function MyOrders() {
  const { data, loading, error, refetch } = useApi('/orders/my-orders');
  const orders = data?.orders || [];

  if (loading) return <div className="page-center container"><Spinner label="Loading your orders" /></div>;
  if (error) return <div className="container"><ErrorState error={error} onRetry={refetch} /></div>;

  return (
    <div className="container orders-page">
      <span className="eyebrow">Account</span>
      <h1 className="page-title">My orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon="⬓"
          title="No orders yet"
          message="When you place an order it will appear here with live status."
          action={<Link to="/products" className="btn btn--primary">Start shopping</Link>}
        />
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <Link to={`/my-orders/${o.id}`} className="order-card" key={o.id}>
              <div className="order-card__head">
                <span className="mono order-card__num">{o.orderNumber}</span>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="order-card__meta">
                <span>{formatDate(o.createdAt)}</span>
                <span>·</span>
                <span>{o.items.reduce((n, i) => n + i.quantity, 0)} item(s)</span>
                <span>·</span>
                <span>Cash on Delivery</span>
              </div>
              <div className="order-card__items">
                {o.items.slice(0, 5).map((i, idx) => (
                  <span className="order-card__item" key={idx}>
                    {i.name} <em>× {i.quantity}</em>
                  </span>
                ))}
                {o.items.length > 5 && <span className="order-card__item">+{o.items.length - 5} more</span>}
              </div>
              <div className="order-card__foot">
                <strong>{formatPrice(o.total)}</strong>
                <span className="order-card__view">Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
