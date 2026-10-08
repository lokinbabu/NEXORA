export default function Rating({ value, count, size = 'sm' }) {
  const v = Number(value) || 0;
  const full = Math.floor(v);
  const half = v - full >= 0.4;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let cls = 'star';
    if (i <= full) cls += ' star--full';
    else if (i === full + 1 && half) cls += ' star--half';
    else cls += ' star--empty';
    stars.push(<span key={i} className={cls} aria-hidden>★</span>);
  }
  return (
    <span className={`rating rating--${size}`} aria-label={`Rated ${v.toFixed(1)} out of 5`}>
      <span className="rating__stars">{stars}</span>
      <span className="rating__num">{v > 0 ? v.toFixed(1) : 'New'}</span>
      {count !== undefined && count > 0 ? <span className="rating__count">({count})</span> : null}
    </span>
  );
}
