import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/hooks.js';
import { Spinner, EmptyState, ErrorState } from '../../components/Feedback.jsx';
import { OrderStatusBadge } from '../../components/StatusBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiError } from '../../services/api.js';
import { formatPrice, formatDateTime } from '../../utils/format.js';
import { ORDER_STATUSES } from '../../utils/constants.js';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, refetch } = useApi(`/orders/${id}`);
  // Uses the owner-or-admin order endpoint — admins may open any order.
  const order = data?.order;
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <div className="page-center"><Spinner label="Loading order" /></div>;
  if (error) {
    return error.status === 404 ? (
      <div><EmptyState icon="⬓" title="Order not found" action={<Link to="/admin/orders" className="btn btn--primary">Back to orders</Link>} /></div>
    ) : (
      <ErrorState error={error} onRetry={refetch} />
    );
  }
  if (!order) return null;

  const currentStatus = status || order.status;

  const updateStatus = async () => {
    if (currentStatus === order.status) return;
    setSaving(true);
    try {
      await api.put(`/admin/orders/${order.id}/status`, { status: currentStatus });
      toast.success(`Order ${order.orderNumber} → ${currentStatus}`);
      refetch();
      setStatus('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dash">
      <Link to="/admin/orders" className="btn btn--ghost btn--sm">← All orders</Link>
      <header className="dash__head">
        <div>
          <span className="eyebrow">Order</span>
          <h1 className="page-title mono">{order.orderNumber}</h1>
          <p className="muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="status-editor">
          <OrderStatusBadge status={order.status} />
          <select value={currentStatus} onChange={(e) => setStatus(e.target.value)} aria-label="Update status">
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" className="btn btn--primary btn--sm" onClick={updateStatus} disabled={saving || currentStatus === order.status}>
            {saving ? 'Updating…' : 'Update status'}
          </button>
        </div>
      </header>

      <div className="dash__panels dash__panels--order">
        <section className="panel">
          <h2 className="panel__title">Items</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product</th><th className="num">Unit price</th><th className="num">Qty</th><th className="num">Subtotal</th></tr></thead>
              <tbody>
                {order.items.map((i, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="cell-stack">
                        <span>{i.name}</span>
                        <span className="muted">{i.brand}</span>
                      </div>
                    </td>
                    <td className="num">{formatPrice(i.price)}</td>
                    <td className="num">{i.quantity}</td>
                    <td className="num">{formatPrice(i.price * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cart-summary__row"><span>Items subtotal</span><span>{formatPrice(order.itemsTotal)}</span></div>
          <div className="cart-summary__row"><span>Shipping</span><span>{order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}</span></div>
          <div className="cart-summary__row cart-summary__row--total"><span>Total (COD)</span><span>{formatPrice(order.total)}</span></div>
          {order.notes ? <p className="muted order-notes">Customer note: “{order.notes}”</p> : null}
        </section>

        <section className="panel">
          <h2 className="panel__title">Customer</h2>
          <div className="cell-stack">
            <strong>{order.user?.name || 'Deleted user'}</strong>
            <span className="muted">{order.user?.email || '—'}</span>
          </div>

          <h2 className="panel__title">Shipping address</h2>
          <address className="addr">
            <strong>{order.shippingAddress.fullName}</strong>
            <span>{order.shippingAddress.line1}</span>
            {order.shippingAddress.line2 ? <span>{order.shippingAddress.line2}</span> : null}
            <span>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</span>
            <span>{order.shippingAddress.country}</span>
            <span className="muted">Phone: {order.shippingAddress.phone}</span>
          </address>

          <h2 className="panel__title">Payment</h2>
          <p className="muted">Cash on Delivery — collect {formatPrice(order.total)} at the door.</p>
          {order.status === 'Cancelled' && <p className="muted">Stock for this order was returned to inventory.</p>}
        </section>
      </div>
    </div>
  );
}
