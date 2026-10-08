import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/hooks.js';
import { Spinner, EmptyState, ErrorState } from '../../components/Feedback.jsx';
import { OrderStatusBadge } from '../../components/StatusBadge.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useApi(`/admin/customers/${id}`);

  if (loading) return <div className="page-center"><Spinner label="Loading customer" /></div>;
  if (error) {
    return error.status === 404 ? (
      <div><EmptyState icon="◭" title="Customer not found" action={<Link to="/admin/customers" className="btn btn--primary">Back to customers</Link>} /></div>
    ) : (
      <ErrorState error={error} onRetry={refetch} />
    );
  }

  const { customer, orders, summary } = data;

  return (
    <div className="dash">
      <Link to="/admin/customers" className="btn btn--ghost btn--sm">← All customers</Link>
      <header className="dash__head">
        <div>
          <span className="eyebrow">Customer</span>
          <h1 className="page-title">{customer.name}</h1>
          <p className="muted">{customer.email}{customer.phone ? ` · ${customer.phone}` : ''} · joined {formatDate(customer.createdAt)}</p>
        </div>
      </header>

      <div className="kpi-grid kpi-grid--3">
        <div className="kpi"><span className="kpi__label">Lifetime value</span><strong className="kpi__value">{formatPrice(summary.totalSpent)}</strong><span className="kpi__hint">Excludes cancelled orders</span></div>
        <div className="kpi"><span className="kpi__label">Orders</span><strong className="kpi__value">{summary.orderCount}</strong><span className="kpi__hint">All time</span></div>
        <div className="kpi"><span className="kpi__label">Last order</span><strong className="kpi__value kpi__value--sm">{summary.lastOrderAt ? formatDate(summary.lastOrderAt) : '—'}</strong><span className="kpi__hint">Most recent purchase</span></div>
      </div>

      <div className="dash__panels">
        <section className="panel">
          <h2 className="panel__title">Order history</h2>
          {orders.length === 0 ? (
            <p className="muted">This customer hasn't ordered yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td><Link className="mono table-link" to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                      <td>{formatDate(o.createdAt)}</td>
                      <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                      <td><OrderStatusBadge status={o.status} /></td>
                      <td className="num">{formatPrice(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="panel__title">Saved address</h2>
          {customer.address?.line1 ? (
            <address className="addr">
              <strong>{customer.address.fullName || customer.name}</strong>
              <span>{customer.address.line1}</span>
              {customer.address.line2 ? <span>{customer.address.line2}</span> : null}
              <span>{customer.address.city}, {customer.address.state} {customer.address.postalCode}</span>
              <span>{customer.address.country}</span>
            </address>
          ) : (
            <p className="muted">No address saved yet — it will appear after their first checkout.</p>
          )}
        </section>
      </div>
    </div>
  );
}
