import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/hooks.js';
import ProductArt from '../components/ProductArt.jsx';
import ProductCard from '../components/ProductCard.jsx';
import QuantityStepper from '../components/QuantityStepper.jsx';
import Rating from '../components/Rating.jsx';
import { StockBadge } from '../components/StatusBadge.jsx';
import { Spinner, EmptyState, ErrorState } from '../components/Feedback.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/format.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const toast = useToast();

  const { data, loading, error, refetch } = useApi(`/products/${id}`);
  const related = useApi(`/products/${id}/related`);
  const [qty, setQty] = useState(1);
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    setQty(1);
    setImgBroken(false);
  }, [id]);

  if (loading) return <div className="page-center container"><Spinner label="Loading product" /></div>;
  if (error) {
    return error.status === 404 ? (
      <div className="container"><EmptyState icon="⌕" title="Product not found" message="This product may have been removed." action={<Link to="/products" className="btn btn--primary">Browse the store</Link>} /></div>
    ) : (
      <div className="container"><ErrorState error={error} onRetry={refetch} /></div>
    );
  }

  const product = data.product;
  const price = product.finalPrice ?? product.price;
  const hasDiscount = product.discount > 0;
  const out = product.stock <= 0;

  const addToCart = () => {
    const res = cart.add(product, qty);
    if (res.ok) toast.success(res.capped ? res.message : `Added ${qty} × ${product.name} to cart`);
    else toast.error(res.message);
  };

  const buyNow = () => {
    const res = cart.add(product, qty);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="container product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> <span>/</span>
        <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link> <span>/</span>
        <span className="crumb-current">{product.name}</span>
      </nav>

      <div className="product-page__grid">
        <div className="product-page__media">
          {product.image && !imgBroken ? (
            <img src={product.image} alt={product.name} onError={() => setImgBroken(true)} />
          ) : null}
          {(!product.image || imgBroken) && <ProductArt product={product} />}
          {hasDiscount && <span className="badge badge--deal product-page__deal">−{product.discount}% today</span>}
        </div>

        <div className="product-page__info">
          <span className="product-page__brand">{product.brand || 'NEXORA'} · {product.category}</span>
          <h1 className="product-page__name">{product.name}</h1>
          <div className="product-page__rating">
            <Rating value={product.rating} count={product.numReviews} size="md" />
          </div>

          <div className="product-page__price">
            <span className="price price--xl">{formatPrice(price)}</span>
            {hasDiscount && (
              <>
                <span className="price price--mrp price--lg">{formatPrice(product.price)}</span>
                <span className="price price--save">Save {formatPrice(product.price - price)}</span>
              </>
            )}
          </div>
          <p className="muted product-page__tax">Inclusive of all taxes · Cash on Delivery available</p>

          <div className="product-page__stock">
            <StockBadge stock={product.stock} />
          </div>

          <p className="product-page__desc">{product.description}</p>

          <div className="product-page__buy">
            <div className="product-page__qty">
              <span className="drawer-label">Quantity</span>
              <QuantityStepper value={qty} max={Math.max(1, product.stock)} onChange={setQty} />
            </div>
            <div className="product-page__cta">
              <button type="button" className="btn btn--secondary btn--lg" onClick={addToCart} disabled={out}>
                {out ? 'Out of stock' : 'Add to cart'}
              </button>
              <button type="button" className="btn btn--primary btn--lg" onClick={buyNow} disabled={out}>
                Buy now
              </button>
            </div>
          </div>

          <div className="product-page__perks">
            <div><span aria-hidden>🚚</span><div><strong>Fast dispatch</strong><span>Ships in 24–48 h</span></div></div>
            <div><span aria-hidden>💵</span><div><strong>Cash on Delivery</strong><span>Pay when it arrives</span></div></div>
            <div><span aria-hidden>🛡</span><div><strong>2-year warranty</strong><span>On NEXORA gear</span></div></div>
          </div>
        </div>
      </div>

      {product.specs?.length > 0 && (
        <section className="product-specs">
          <h2 className="section-title">Specifications</h2>
          <dl className="spec-table">
            {product.specs.map((s, i) => (
              <div className="spec-row" key={i}>
                <dt>{s.key}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="product-related">
        <div className="section-head">
          <div>
            <span className="eyebrow">Complete the setup</span>
            <h2 className="section-title">Related gear</h2>
          </div>
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="section-link">
            More {product.category.toLowerCase()} →
          </Link>
        </div>
        {related.loading ? (
          <div className="page-center"><Spinner /></div>
        ) : related.data?.products?.length ? (
          <div className="product-grid product-grid--4">
            {related.data.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="muted">No related products in this category yet.</p>
        )}
      </section>
    </div>
  );
}
