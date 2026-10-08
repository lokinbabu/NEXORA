import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/hooks.js';
import { Spinner, ErrorState } from '../../components/Feedback.jsx';
import { OrderStatusBadge } from '../../components/StatusBadge.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';

function SalesChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="chart" role="img" aria-label="Revenue over the last 14 days">
      {data.map((d) => (
        <div key={d.date} className="chart__col" title={`${d.date}: ${formatPrice(d.revenue)} (${d.orders} orders)`}>
          <div className="chart__bar" style={{ height: `${Math.max(3, (d.revenue / max) * 100)}%` }} />
          <span className="chart__day">{new Date(d.date + 'T00:00:00').getDate()}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, refetch } = useApi('/admin/stats');

  if (loading) return <div className="page-center"><Spinner label="Loading dashboard" /></div>;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const { stats, recentOrders, lowStock, salesByDay } = data;

  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <span className="eyebrow">Overview</span>
          <h1 className="page-title">Store dashboard</h1>
        </div>
        <Link to="/admin/products/new" className="btn btn--primary btn--sm">+ Add product</Link>
      </header>

      <div className="kpi-grid">
        <div className="kpi"><span className="kpi__label">Total revenue</span><strong className="kpi__value">{formatPrice(stats.revenue)}</strong><span className="kpi__hint">Excludes cancelled orders</span></div>
        <div className="kpi"><span className="kpi__label">Orders</span><strong className="kpi__value">{stats.orders}</strong><span className="kpi__hint">{stats.byStatus.Pending || 0} pending · {stats.byStatus.Delivered || 0} delivered</span></div>
        <div className="kpi"><span className="kpi__label">Customers</span><strong className="kpi__value">{stats.customers}</strong><span className="kpi__hint">Registered accounts</span></div>
        <div className="kpi"><span className="kpi__label">Products</span><strong className="kpi__value">{stats.products}</strong><span className="kpi__hint">{stats.lowStockCount} low on stock</span></div>
      </div>

      <div className="dash__panels">
        <section className="panel">
          <h2 className="panel__title">Revenue · last 14 days</h2>
          <SalesChart data={salesByDay} />
        </section>

        <section className="panel">
          <div className="panel__head-row">
            <h2 className="panel__title">Recent orders</h2>
            <Link to="/admin/orders" className="section-link">All orders →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="muted">No orders yet — they will appear here as customers check out.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="num">Total</th></tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td><Link className="mono table-link" to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                      <td>{o.user?.name || '—'}</td>
                      <td>{formatDate(o.createdAt)}</td>
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
          <div className="panel__head-row">
            <h2 className="panel__title">Low stock alerts</h2>
            <Link to="/admin/products?stock=low" className="section-link">Manage stock →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="muted">Everything is well stocked. 🎉</p>
          ) : (
            <ul className="stock-list">
              {lowStock.map((p) => (
                <li key={p.id} className={`stock-item ${p.stock === 0 ? 'stock-item--out' : ''}`}>
                  <Link to={`/admin/products/${p.id}/edit`} className="stock-item__name">{p.name}</Link>
                  <span className="muted">{p.category}</span>
                  <span className={`badge ${p.stock === 0 ? 'badge--danger' : 'badge--warning'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
