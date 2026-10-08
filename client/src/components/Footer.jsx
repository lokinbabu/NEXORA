import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

const SHOP_LINKS = ['Keyboards', 'Mice', 'Headsets', 'Controllers', 'Monitors', 'Microphones', 'Mousepads', 'Accessories'];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo />
          <p>
            Premium gaming hardware engineered for competitive play. Built by players,
            for players — with fast dispatch and Cash on Delivery.
          </p>
          <div className="footer__pay">
            <span className="footer__pay-chip">Cash on Delivery</span>
            <span className="footer__pay-chip">Free shipping over ₹4,999</span>
          </div>
        </div>

        <nav className="footer__col" aria-label="Shop">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/products">All Products</Link></li>
            {SHOP_LINKS.slice(0, 5).map((c) => (
              <li key={c}><Link to={`/products?category=${encodeURIComponent(c)}`}>{c}</Link></li>
            ))}
          </ul>
        </nav>

        <nav className="footer__col" aria-label="More categories">
          <h4>More</h4>
          <ul>
            {SHOP_LINKS.slice(5).map((c) => (
              <li key={c}><Link to={`/products?category=${encodeURIComponent(c)}`}>{c}</Link></li>
            ))}
            <li><Link to="/products?sort=price-asc">Best Budget Gear</Link></li>
          </ul>
        </nav>

        <nav className="footer__col" aria-label="Account">
          <h4>Account</h4>
          <ul>
            <li><Link to="/my-orders">My Orders</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/account">Settings</Link></li>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/register">Create account</Link></li>
          </ul>
        </nav>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>© {new Date().getFullYear()} NEXORA — gaming technology store.</span>
          <span>Cash on Delivery · 7-day replacement · 2-year warranty on NEXORA gear</span>
        </div>
      </div>
    </footer>
  );
}
