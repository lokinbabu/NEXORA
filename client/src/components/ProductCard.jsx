import { Link, useNavigate } from 'react-router-dom';
import ProductArt from './ProductArt.jsx';
import Rating from './Rating.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/format.js';

export default function ProductCard({ product }) {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const price = product.finalPrice ?? product.price;
  const hasDiscount = product.discount > 0;
  const out = product.stock <= 0;

  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = cart.add(product, 1);
    if (res.ok) toast.success(res.capped ? res.message : `${product.name} added to cart`);
    else toast.error(res.message);
  };

  const openProduct = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${product.id}`);
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card__media">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : null}
        <ProductArt product={product} className={product.image ? 'product-art--backup' : ''} />
        {hasDiscount ? <span className="badge badge--deal product-card__deal">−{product.discount}%</span> : null}
        {out ? (
          <span className="product-card__out">Out of stock</span>
        ) : (
          <button type="button" className="product-card__quick-add" onClick={addToCart} aria-label={`Add ${product.name} to cart`}>
            + Add
          </button>
        )}
      </div>
      <div className="product-card__body">
        <span className="product-card__brand">{product.brand || 'NEXORA'}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <Rating value={product.rating} count={product.numReviews} />
        <div className="product-card__price-row">
          <span className="price">{formatPrice(price)}</span>
          {hasDiscount ? <span className="price price--mrp">{formatPrice(product.price)}</span> : null}
        </div>
        <button type="button" className="btn btn--secondary btn--block btn--sm" onClick={openProduct}>
          View details
        </button>
      </div>
    </Link>
  );
}
