import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page-center-narrow notfound">
      <span className="notfound__code mono">404</span>
      <h1>Respawn point not found</h1>
      <p className="muted">The page you're looking for doesn't exist or was moved.</p>
      <div className="hero__cta">
        <Link to="/" className="btn btn--primary">Back to home</Link>
        <Link to="/products" className="btn btn--ghost">Browse gear</Link>
      </div>
    </div>
  );
}
