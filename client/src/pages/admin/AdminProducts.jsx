import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useDebounce } from '../../hooks/hooks.js';
import ProductArt from '../../components/ProductArt.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { Spinner, EmptyState, ErrorState } from '../../components/Feedback.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import { CATEGORIES } from '../../utils/constants.js';

export default function AdminProducts() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const stockFilter = params.get('stock') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));

  const [searchInput, setSearchInput] = useState(search);
  const debounced = useDebounce(searchInput);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const query = new URLSearchParams({ search: debounced, category, stock: stockFilter, page: String(page), limit: '12' }).toString();
  const { data, loading, error, refetch } = useApi(`/admin/products?${query}`);
  const products = data?.products || [];

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, String(v)) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    if (debounced !== search) {
      const next = new URLSearchParams(params);
      if (debounced) next.set('search', debounced);
      else next.delete('search');
      next.delete('page');
      setParams(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const d = await api.del(`/admin/products/${deleting.id}`);
      toast.success(d.message);
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1 className="page-title">Products</h1>
        </div>
        <Link to="/admin/products/new" className="btn btn--primary btn--sm">+ Add product</Link>
      </header>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar__search"
          placeholder="Search name, brand, category…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search products"
        />
        <select value={category} onChange={(e) => update({ category: e.target.value })} aria-label="Filter category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => update({ stock: e.target.value })} aria-label="Filter stock">
          <option value="">All stock levels</option>
          <option value="low">Low stock (≤5)</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {loading ? (
        <div className="page-center"><Spinner label="Loading products" /></div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="▤"
          title="No products found"
          message={search || category || stockFilter ? 'Try clearing the filters.' : 'Add your first product to open the store.'}
          action={<Link to="/admin/products/new" className="btn btn--primary">+ Add product</Link>}
        />
      ) : (
        <>
          <div className="table-wrap panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Featured</th><th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={p.stock === 0 ? 'row-muted' : ''}>
                    <td>
                      <div className="cell-product">
                        <div className="cell-product__art">
                          {p.image ? <img src={p.image} alt="" /> : null}
                          <ProductArt product={p} className={p.image ? 'product-art--backup' : ''} />
                        </div>
                        <div>
                          <Link to={`/admin/products/${p.id}/edit`} className="table-link">{p.name}</Link>
                          <span className="muted cell-product__brand">{p.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td className="num">
                      {p.discount > 0 ? (
                        <>
                          <s className="muted">{formatPrice(p.price)}</s> {formatPrice(p.finalPrice ?? p.price)}
                        </>
                      ) : formatPrice(p.price)}
                    </td>
                    <td className="num">
                      <span className={`badge ${p.stock === 0 ? 'badge--danger' : p.stock <= 5 ? 'badge--warning' : 'badge--success'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>{p.featured ? '★' : '—'}</td>
                    <td className="num">
                      <div className="row-actions">
                        <Link to={`/admin/products/${p.id}/edit`} className="btn btn--ghost btn--xs">Edit</Link>
                        <button type="button" className="btn btn--ghost btn--xs btn--danger-text" onClick={() => setDeleting(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>← Prev</button>
              <span className="pagination__info">Page {page} of {data.pages} · {data.total} products</span>
              <button type="button" className="btn btn--ghost btn--sm" disabled={page >= data.pages} onClick={() => update({ page: page + 1 })}>Next →</button>
            </nav>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product?"
        message={deleting ? `"${deleting.name}" will be permanently removed from the store. This cannot be undone.` : ''}
        confirmLabel="Delete product"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
