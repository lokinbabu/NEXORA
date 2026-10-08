const ORDER_CLASSES = {
  Pending: 'badge--pending',
  Confirmed: 'badge--info',
  Packed: 'badge--info',
  Shipped: 'badge--accent',
  Delivered: 'badge--success',
  Cancelled: 'badge--danger',
};

export function OrderStatusBadge({ status }) {
  return <span className={`badge ${ORDER_CLASSES[status] || 'badge--pending'}`}>{status}</span>;
}

export function StockBadge({ stock }) {
  const s = Number(stock) || 0;
  if (s <= 0) return <span className="badge badge--danger">Out of stock</span>;
  if (s <= 5) return <span className="badge badge--warning">Only {s} left</span>;
  return <span className="badge badge--success">In stock</span>;
}
