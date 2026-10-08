/** Indian Rupee formatting, e.g. ₹12,499 */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatPrice = (n) => inr.format(Math.round(Number(n) || 0));

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const truncate = (str, n = 60) =>
  String(str || '').length > n ? `${String(str).slice(0, n - 1)}…` : str;
