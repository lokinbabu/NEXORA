import { Link } from 'react-router-dom';

export function Spinner({ size = 'md', label }) {
  return (
    <div className={`spinner spinner--${size}`} role="status" aria-label={label || 'Loading'}>
      <span className="spinner__ring" />
      {label ? <span className="spinner__label">{label}</span> : null}
    </div>
  );
}

export function EmptyState({ icon = '◇', title, message, action }) {
  return (
    <div className="empty">
      <div className="empty__icon" aria-hidden>{icon}</div>
      <h3 className="empty__title">{title}</h3>
      {message ? <p className="empty__msg">{message}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const msg = error?.message || 'Something went wrong. Please try again.';
  return (
    <div className="error-state" role="alert">
      <div className="error-state__icon" aria-hidden>!</div>
      <h3 className="error-state__title">{error?.status === 0 ? 'Connection problem' : 'Something went wrong'}</h3>
      <p className="error-state__msg">{msg}</p>
      {onRetry ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          Try again
        </button>
      ) : (
        <Link to="/" className="btn btn--ghost btn--sm">Back to home</Link>
      )}
    </div>
  );
}
