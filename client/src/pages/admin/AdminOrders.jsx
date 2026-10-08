import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useDebounce } from '../../hooks/hooks.js';
import { Spinner, EmptyState, ErrorState } from '../../components/Feedback.jsx';
import { OrderStatusBadge } from '../../components/StatusBadge.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';
import { ORDER_STATUSES } from '../../utils/constants.js';

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));

  const [searchInput, setSearchInput] = useState(params.get('search') || '');
  const debounced = useDebounce(searchInput);

  useEffect(() => {
    if (debounced !== (params.get('search') || '')) {
      const next = new URLSearchParams(params);
      if (debounced) next.set('search', debounced);
      else next.delete('search');
      next.delete('page');
      setParams(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = new URLSearchParams({ status, search: debounced, page: String(page), limit: '12' }).toString();
  const { data, loading, error, refetch } = useApi(`/admin/orders?${query}`);
  const orders = data?.orders || [];

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, String(v)) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <span className="eyebrow">Fulfilment</span>
          <h1 className="page-title">Orders</h1>
        </div>
      </header>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar__search"
          placeholder="Search order number or customer…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search orders"
        />
        <select value={status} onChange={(e) => update({ status: e.target.value })} aria-label="Filter by status">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="page-center"><Spinner label="Loading orders" /></div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : orders.length === 0 ? (
        <EmptyState icon="⬓" title="No orders found" message={status || debounced ? 'Try clearing the filters.' : 'Orders will appear here once customers check out.'} />
      ) : (
        <>
          <div className="table-wrap panel">
            <table className="table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Status</th><th className="num">Total</th><th /></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link className="mono table-link" to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                    <td>
                      <div className="cell-stack">
                        <span>{o.user?.name || 'Deleted user'}</span>
                        <span className="muted">{o.user?.email || '—'}</span>
                      </div>
                    </td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                    <td><OrderStatusBadge status={o.status} /></td>
                    <td className="num">{formatPrice(o.total)}</td>
                    <td className="num"><Link to={`/admin/orders/${o.id}`} className="btn btn--ghost btn--xs">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>← Prev</button>
              <span className="pagination__info">Page {page} of {data.pages} · {data.total} orders</span>
              <button type="button" className="btn btn--ghost btn--sm" disabled={page >= data.pages} onClick={() => update({ page: page + 1 })}>Next →</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
