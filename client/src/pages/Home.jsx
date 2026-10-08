import { Link } from 'react-router-dom';
import { useApi } from '../hooks/hooks.js';
import ProductCard from '../components/ProductCard.jsx';
import ProductArt from '../components/ProductArt.jsx';
import { Spinner, ErrorState } from '../components/Feedback.jsx';
import { formatPrice } from '../utils/format.js';

const CATEGORY_META = {
  Keyboards: { icon: '⌨', blurb: 'Hall-effect & mechanical' },
  Mice: { icon: '🖱', blurb: 'Ultralight, 8K wireless' },
  Headsets: { icon: '🎧', blurb: 'ANC & spatial audio' },
  Controllers: { icon: '🎮', blurb: 'Anti-drift sticks' },
  Monitors: { icon: '🖥', blurb: '240Hz esports panels' },
  Microphones: { icon: '🎙', blurb: 'Broadcast quality' },
  Mousepads: { icon: '▰', blurb: 'Control & speed surfaces' },
  Accessories: { icon: '✦', blurb: 'RGB & desk upgrades' },
};

function Section({ eyebrow, title, link, children, tone = '' }) {
  return (
    <section className={`home-section container ${tone}`}>
      <div className="section-head">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="section-title">{title}</h2>
        </div>
        {link ? <Link to={link} className="section-link">View all →</Link> : null}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const categories = useApi('/products/meta/categories');
  const featured = useApi('/products?sort=featured&limit=8');
  const deals = useApi('/products?sort=savings&limit=4');
  const trending = useApi('/products?sort=rating&limit=4');

  const loading = categories.loading || featured.loading;

  return (
    <div className="home">
      {/* ------------------------------ HERO ------------------------------ */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__pill">New · Flare 65 Hall-Effect just landed</span>
            <h1 className="hero__title">
              Gear that keeps up
              <br />
              with <span className="grad-text">your game.</span>
            </h1>
            <p className="hero__sub">
              Tournament-grade keyboards, 8K wireless mice, ANC headsets and 240Hz panels —
              hand-picked hardware for players who take their setup seriously.
            </p>
            <div className="hero__cta">
              <Link to="/products" className="btn btn--primary btn--lg">Shop all gear</Link>                <Link to="/products?sort=savings" className="btn btn--ghost btn--lg">Explore deals</Link>
            </div>
            <div className="hero__stats">
              <div><strong>20+</strong><span>Curated products</span></div>
              <div><strong>8</strong><span>Gear categories</span></div>
              <div><strong>COD</strong><span>Pay on delivery</span></div>
            </div>
          </div>
          <div className="hero__visual" aria-hidden>
            <div className="hero__card hero__card--main">
              <ProductArt product={{ id: 'hero-flare', name: 'Flare 65', category: 'Keyboards' }} />
              <div className="hero__card-info">
                <span>Flare 65 Hall-Effect</span>
                <strong>{formatPrice(11249)} <s>{formatPrice(12499)}</s></strong>
              </div>
            </div>
            <div className="hero__card hero__card--float1">
              <ProductArt product={{ id: 'hero-ghost', name: 'Ghost 8K', category: 'Mice' }} />
              <div className="hero__card-info">
                <span>Ghost 8K Wireless</span>
                <strong>39 g · 8,000 Hz</strong>
              </div>
            </div>
            <div className="hero__chip hero__chip--1">0.8 ms latency</div>
            <div className="hero__chip hero__chip--2">30,000 DPI</div>
          </div>
        </div>
      </section>

      {/* --------------------------- CATEGORIES --------------------------- */}
      <Section eyebrow="Browse" title="Shop by category" link="/products">
        {categories.error ? <ErrorState error={categories.error} onRetry={categories.refetch} /> : (
          <div className="cat-grid">
            {(categories.data?.categories || []).map((c) => (
              <Link
                key={c.name}
                to={`/products?category=${encodeURIComponent(c.name)}`}
                className="cat-tile"
              >
                <span className="cat-tile__icon" aria-hidden>{CATEGORY_META[c.name]?.icon || '◇'}</span>
                <span className="cat-tile__name">{c.name}</span>
                <span className="cat-tile__blurb">{CATEGORY_META[c.name]?.blurb || 'Gaming gear'}</span>
                <span className="cat-tile__count">{c.count} products</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* ---------------------------- FEATURED ---------------------------- */}
      <Section eyebrow="Hand-picked" title="Featured gear" link="/products?sort=featured">
        {featured.loading ? (
          <div className="page-center"><Spinner label="Loading featured products" /></div>
        ) : featured.error ? (
          <ErrorState error={featured.error} onRetry={featured.refetch} />
        ) : (
          <div className="product-grid product-grid--4">
            {featured.data.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </Section>

      {/* ------------------------------ DEALS ------------------------------ */}
      <section className="deals-band">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow eyebrow--hot">Save big</span>
              <h2 className="section-title">Deals of the week</h2>
            </div>
            <Link to="/products?sort=savings" className="section-link">All deals →</Link>
          </div>
          {deals.loading ? (
            <div className="page-center"><Spinner label="Loading deals" /></div>
          ) : deals.error ? (
            <ErrorState error={deals.error} onRetry={deals.refetch} />
          ) : (
            <div className="deals-grid">
              {deals.data.products.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="deal-tile">
                  <div className="deal-tile__art">
                    {p.image ? <img src={p.image} alt="" loading="lazy" /> : null}
                    <ProductArt product={p} className={p.image ? 'product-art--backup' : ''} />
                  </div>
                  <div className="deal-tile__info">
                    <span className="badge badge--deal">Save {formatPrice((p.price || 0) - (p.finalPrice ?? p.price))}</span>
                    <strong className="deal-tile__name">{p.name}</strong>
                    <span className="deal-tile__price">
                      {formatPrice(p.finalPrice ?? p.price)} <s>{formatPrice(p.price)}</s>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------- TRENDING ---------------------------- */}
      <Section eyebrow="Community favourites" title="Trending now" link="/products?sort=rating">
        {trending.loading ? (
          <div className="page-center"><Spinner label="Loading trending products" /></div>
        ) : trending.error ? (
          <ErrorState error={trending.error} onRetry={trending.refetch} />
        ) : (
          <div className="product-grid product-grid--4">
            {trending.data.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </Section>

      {/* ------------------------------- CTA ------------------------------- */}
      <section className="container">
        <div className="cta-band">
          <div>
            <h2>Ready to level up your setup?</h2>
            <p>Create an account to check out in seconds, track orders, and pay cash on delivery.</p>
          </div>
          <div className="cta-band__actions">
            <Link to="/register" className="btn btn--primary btn--lg">Create free account</Link>
            <Link to="/products" className="btn btn--ghost btn--lg">Keep browsing</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
