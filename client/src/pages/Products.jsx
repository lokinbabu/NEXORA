import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/hooks.js';
import ProductCard from '../components/ProductCard.jsx';
import { Spinner, EmptyState, ErrorState } from '../components/Feedback.jsx';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price: low → high' },
  { value: 'price-desc', label: 'Price: high → low' },
  { value: 'savings', label: 'Biggest savings' },
  { value: 'name', label: 'Name A–Z' },
];

const CATEGORIES = ['Keyboards', 'Mice', 'Headsets', 'Controllers', 'Monitors', 'Microphones', 'Mousepads', 'Accessories'];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'featured';
  const inStock = params.get('inStock') === 'true';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));

  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (category) q.set('category', category);
    if (sort) q.set('sort', sort);
    if (inStock) q.set('inStock', 'true');
    q.set('page', String(page));
    q.set('limit', '12');
    return `/products?${q.toString()}`;
  }, [search, category, sort, inStock, page]);

  const { data, loading, error, refetch } = useApi(path);
  const products = data?.products || [];
  const pages = data?.pages || 1;

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === false || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    if (!('page' in patch)) next.delete('page'); // any filter change resets pagination
    setParams(next, { replace: false });
  };

  // Local text input with debounce → URL param
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== search) update({ search: searchInput.trim() });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const title = search ? `Results for “${search}”` : category || 'All products';

  return (
    <div className="container shop">
      <header className="shop__head">
        <div>
          <span className="eyebrow">Store</span>
          <h1 className="page-title">{title}</h1>
          {!loading && !error && <p className="muted">{data.total} product{data.total === 1 ? '' : 's'} found</p>}
        </div>
        <div className="shop__toolbar">
          <div className="search-field">
            <input
              type="search"
              placeholder="Search products…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search products"
            />
          </div>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort products">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <label className="check-inline">
            <input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked })} />
            In stock only
          </label>
        </div>
      </header>

      <div className="shop__body">
        <aside className="shop__filters" aria-label="Category filters">
          <span className="drawer-label">Categories</span>
          <button
            type="button"
            className={`filter-pill ${category === '' ? 'is-active' : ''}`}
            onClick={() => update({ category: '' })}
          >
            All products
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`filter-pill ${category === c ? 'is-active' : ''}`}
              onClick={() => update({ category: c })}
            >
              {c}
            </button>
          ))}
        </aside>

        <div className="shop__results">
          {loading ? (
            <div className="page-center"><Spinner label="Loading products" /></div>
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : products.length === 0 ? (
            <EmptyState
              icon="⌕"
              title="No products found"
              message="Try a different search term, or clear the filters to see the full catalog."
              action={
                <button type="button" className="btn btn--secondary" onClick={() => setParams({})}>
                  Clear all filters
                </button>
              }
            />
          ) : (
            <>
              <div className="product-grid product-grid--3">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {pages > 1 && (
                <nav className="pagination" aria-label="Pagination">
                  <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>
                    ← Prev
                  </button>
                  <span className="pagination__info">Page {page} of {pages}</span>
                  <button type="button" className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => update({ page: page + 1 })}>
                    Next →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
