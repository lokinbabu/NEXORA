import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const CATEGORY_LINKS = [
  'Keyboards',
  'Mice',
  'Headsets',
  'Controllers',
  'Monitors',
  'Microphones',
  'Mousepads',
  'Accessories',
];

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location]);

  useEffect(() => {
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  const doLogout = async () => {
    await logout();
    toast.info('You have been logged out.');
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <button
          type="button"
          className="navbar__burger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>

        <Logo />

        <form className="navbar__search" onSubmit={submitSearch} role="search">
          <svg viewBox="0 0 24 24" className="navbar__search-icon" aria-hidden>
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search keyboards, mice, headsets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
        </form>

        <nav className="navbar__links" aria-label="Shop by category">
          <NavLink to="/products" className="navbar__link" end>
            All
          </NavLink>
          {CATEGORY_LINKS.slice(0, 5).map((c) => (
            <Link key={c} to={`/products?category=${encodeURIComponent(c)}`} className="navbar__link">
              {c}
            </Link>
          ))}
        </nav>

        <div className="navbar__actions">
          <Link to="/cart" className="navbar__cart" aria-label={`Cart, ${cart.count} items`}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h7.8a2 2 0 0 0 2-1.6L21 8H6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="21" r="1.4" fill="currentColor" />
              <circle cx="17.5" cy="21" r="1.4" fill="currentColor" />
            </svg>
            {cart.count > 0 && <span className="navbar__cart-badge">{cart.count > 99 ? '99+' : cart.count}</span>}
          </Link>

          {user ? (
            <div className="navbar__account" ref={accountRef}>
              <button
                type="button"
                className="navbar__user-btn"
                onClick={() => setAccountOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <span className="navbar__avatar">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                <span className="navbar__username">{(user.name || 'User').split(' ')[0]}</span>
              </button>
              {accountOpen && (
                <div className="navbar__dropdown" role="menu">
                  <div className="navbar__dropdown-head">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/my-orders" role="menuitem">My Orders</Link>
                  <Link to="/account" role="menuitem">Account Settings</Link>
                  {isAdmin && <Link to="/admin" role="menuitem">Admin Panel →</Link>}
                  <button type="button" onClick={doLogout} role="menuitem">Log out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__auth-links">
              <Link to="/login" className="btn btn--ghost btn--sm">Log in</Link>
              <Link to="/register" className="btn btn--primary btn--sm">Sign up</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`navbar__drawer ${menuOpen ? 'is-open' : ''}`}>
        <form
          className="drawer-search"
          onSubmit={(e) => {
            submitSearch(e);
            setMenuOpen(false);
          }}
        >
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" className="btn btn--primary btn--sm">Search</button>
        </form>
        <span className="drawer-label">Categories</span>
        <div className="drawer-cats">
          <Link to="/products" className="drawer-cat">All Products</Link>
          {CATEGORY_LINKS.map((c) => (
            <Link key={c} to={`/products?category=${encodeURIComponent(c)}`} className="drawer-cat">
              {c}
            </Link>
          ))}
        </div>
        <div className="drawer-links">
          {user ? (
            <>
              <Link to="/my-orders">My Orders</Link>
              <Link to="/account">Account Settings</Link>
              {isAdmin && <Link to="/admin">Admin Panel</Link>}
              <button type="button" onClick={doLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="accent">Create account</Link>
            </>
          )}
        </div>
      </div>
      {menuOpen && <div className="navbar__scrim" onClick={() => setMenuOpen(false)} aria-hidden />}
    </header>
  );
}
