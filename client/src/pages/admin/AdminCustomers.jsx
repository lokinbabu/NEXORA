import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useDebounce } from '../../hooks/hooks.js';
import { Spinner, EmptyState, ErrorState } from '../../components/Feedback.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';

export default function AdminCustomers() {
  const [params, setParams] = useSearchParams();
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

  const query = new URLSearchParams({ search: debounced, page: String(page), limit: '12' }).toString();
  const { data, loading, error, refetch } = useApi(`/admin/customers?${query}`);
  const customers = data?.customers || [];

  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <span className="eyebrow">Community</span>
          <h1 className="page-title">Customers</h1>
        </div>
      </header>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar__search"
          placeholder="Search name, email or phone…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search customers"
        />
      </div>

      {loading ? (
        <div className="page-center"><Spinner label="Loading customers" /></div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon="◭"
          title={debounced ? 'No customers match that search' : 'No customers yet'}
          message={debounced ? 'Try a different name or email.' : 'Registered accounts will appear here.'}
        />
      ) : (
        <>
          <div className="table-wrap panel">
            <table className="table">
              <thead>
                <tr><th>Customer</th><th>Joined</th><th className="num">Orders</th><th className="num">Total spent</th><th>Last order</th><th /></tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-stack">
                        <span className="table-strong">{c.name}</span>
                        <span className="muted">{c.email}</span>
                      </div>
                    </td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td className="num">{c.orderCount}</td>
                    <td className="num">{formatPrice(c.totalSpent)}</td>
                    <td>{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</td>
                    <td className="num"><Link to={`/admin/customers/${c.id}`} className="btn btn--ghost btn--xs">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => { const n = new URLSearchParams(params); n.set('page', String(page - 1)); setParams(n); }}>← Prev</button>
              <span className="pagination__info">Page {page} of {data.pages} · {data.total} customers</span>
              <button type="button" className="btn btn--ghost btn--sm" disabled={page >= data.pages} onClick={() => { const n = new URLSearchParams(params); n.set('page', String(page + 1)); setParams(n); }}>Next →</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
