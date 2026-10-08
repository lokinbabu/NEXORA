/**
 * DEV-ONLY mock API for frontend development/screenshots without a database.
 * Start on port 5000:  node test/mock-api.mjs
 * It is NEVER used in production and is safe to delete.
 */
import http from 'node:http';
import { products } from '../seed/products.js';

const withIds = products.map((p, i) => ({
  ...p,
  id: String(100000 + i).padEnd(24, '0'),
  finalPrice: Math.round(p.price * (1 - (p.discount || 0) / 100)),
  image: '',
}));
const cats = [...new Set(products.map((p) => p.category))].map((name) => ({
  name,
  count: products.filter((p) => p.category === name).length,
}));

const ADMIN = { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Nexora Admin', email: 'admin@nexora.gg', role: 'admin', createdAt: new Date().toISOString(), address: {}, phone: '' };
const USER = { id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Riya Sharma', email: 'riya@test.dev', role: 'user', createdAt: new Date().toISOString(), address: { fullName: 'Riya Sharma', phone: '9876543210', line1: '12 MG Road', line2: '', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India' }, phone: '9876543210' };

function makeOrder(n) {
  const items = withIds.slice(0, 2).map((p) => ({ product: p.id, name: p.name, brand: p.brand, image: '', price: p.finalPrice, quantity: 1 }));
  const itemsTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = itemsTotal >= 4999 ? 0 : 99;
  return {
    id: String(900000 + n).padEnd(24, '0'),
    orderNumber: `NX-MOCK0${n}`,
    user: { name: USER.name, email: USER.email },
    items,
    itemsTotal,
    shippingFee,
    total: itemsTotal + shippingFee,
    shippingAddress: USER.address,
    paymentMethod: 'cod',
    status: ['Pending', 'Confirmed', 'Shipped', 'Delivered'][n % 4],
    createdAt: new Date(Date.now() - n * 86400000).toISOString(),
  };
}
const orders = [makeOrder(1), makeOrder(2), makeOrder(3)];

function json(res, code, data, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie !== undefined) headers['Set-Cookie'] = `token=${cookie}; Path=/; HttpOnly; SameSite=Lax`;
  res.writeHead(code, headers);
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const cookie = req.headers.cookie || '';
  const isAdmin = cookie.includes('token=admin');
  const isUser = isAdmin || cookie.includes('token=user');

  if (p === '/api/health') return json(res, 200, { ok: true, db: 'connected', service: 'mock' });

  if (p === '/api/products') {
    const ids = url.searchParams.get('ids');
    if (ids) return json(res, 200, { products: withIds.filter((x) => ids.split(',').includes(x.id)) });
    let list = withIds;
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const category = url.searchParams.get('category');
    if (category) list = list.filter((x) => x.category === category);
    if (search) list = list.filter((x) => `${x.name} ${x.brand} ${x.description} ${x.category}`.toLowerCase().includes(search));
    if (url.searchParams.get('inStock') === 'true') list = list.filter((x) => x.stock > 0);
    const sort = url.searchParams.get('sort') || 'featured';
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.finalPrice - b.finalPrice);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.finalPrice - a.finalPrice);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'featured') list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
    if (sort === 'newest') list = [...list].reverse();
    const limit = Number(url.searchParams.get('limit') || 12);
    const page = Number(url.searchParams.get('page') || 1);
    return json(res, 200, { products: list.slice((page - 1) * limit, page * limit), page, pages: Math.max(1, Math.ceil(list.length / limit)), total: list.length });
  }
  if (p === '/api/products/meta/categories') return json(res, 200, { categories: cats });
  let m = p.match(/^\/api\/products\/([a-z0-9]+)\/related$/);
  if (m) {
    const prod = withIds.find((x) => x.id === m[1]);
    return json(res, 200, { products: withIds.filter((x) => x.category === prod?.category && x.id !== prod?.id).slice(0, 4) });
  }
  m = p.match(/^\/api\/products\/([a-z0-9]+)$/);
  if (m) {
    const prod = withIds.find((x) => x.id === m[1]);
    return prod ? json(res, 200, { product: prod }) : json(res, 404, { message: 'Product not found.' });
  }

  if (p === '/api/auth/login' || p === '/api/auth/register') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      let parsed = {};
      try { parsed = JSON.parse(body || '{}'); } catch { /* ignore */ }
      const asAdmin = p === '/api/auth/login' && String(parsed.email || '').trim().toLowerCase() === ADMIN.email;
      const u = asAdmin ? ADMIN : USER;
      json(res, p === '/api/auth/register' ? 201 : 200, { user: u }, asAdmin ? 'admin' : 'user');
    });
    return;
  }
  if (p === '/api/auth/me') return isUser ? json(res, 200, { user: isAdmin ? ADMIN : USER }) : json(res, 401, { message: 'Not authenticated.' });
  if (p === '/api/auth/logout') return json(res, 200, { message: 'ok' }, '');
  if (p === '/api/auth/profile') return json(res, 200, { user: USER });

  if (p === '/api/orders/my-orders') return json(res, 200, { orders });
  m = p.match(/^\/api\/orders\/([a-z0-9]+)$/);
  if (m) {
    const o = orders.find((x) => x.id === m[1]);
    return o ? json(res, 200, { order: o }) : json(res, 404, { message: 'Order not found.' });
  }
  if (p === '/api/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}');
      const items = (parsed.items || [])
        .map((it) => {
          const prod = withIds.find((x) => x.id === it.productId);
          return prod ? { product: prod.id, name: prod.name, brand: prod.brand, image: '', price: prod.finalPrice, quantity: it.quantity } : null;
        })
        .filter(Boolean);
      const itemsTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const shippingFee = itemsTotal >= 4999 ? 0 : 99;
      return json(res, 201, {
        order: {
          id: String(Date.now()).padEnd(24, '0'),
          orderNumber: `NX-LIVE${Math.floor(Math.random() * 1000)}`,
          user: { name: USER.name, email: USER.email },
          items,
          itemsTotal,
          shippingFee,
          total: itemsTotal + shippingFee,
          shippingAddress: parsed.shippingAddress,
          paymentMethod: 'cod',
          status: 'Pending',
          createdAt: new Date().toISOString(),
        },
      });
    });
    return;
  }

  if (p === '/api/admin/stats') {
    const salesByDay = Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
      orders: [0, 1, 0, 2, 1, 0, 3, 2, 1, 0, 1, 2, 4, 3][i],
      revenue: [0, 3499, 0, 8998, 5499, 0, 16497, 11249, 3499, 0, 5499, 8998, 24999, 15998][i],
    }));
    return json(res, 200, {
      stats: { products: withIds.length, customers: 128, orders: 341, revenue: 1846500, byStatus: { Pending: 4, Confirmed: 6, Shipped: 12, Delivered: 315, Cancelled: 4 }, lowStockCount: 4 },
      recentOrders: orders,
      lowStock: withIds.filter((x) => x.stock <= 5),
      salesByDay,
    });
  }
  if (p === '/api/admin/customers') return json(res, 200, { customers: [{ ...USER, orderCount: 4, totalSpent: 41597, lastOrderAt: new Date().toISOString() }], page: 1, pages: 1, total: 1 });
  m = p.match(/^\/api\/admin\/customers\/([a-z0-9]+)$/);
  if (m) return json(res, 200, { customer: USER, orders, summary: { orderCount: 4, totalSpent: 41597, lastOrderAt: new Date().toISOString() } });
  if (p === '/api/admin/orders') return json(res, 200, { orders, page: 1, pages: 1, total: orders.length });
  if (p === '/api/admin/products') return json(res, 200, { products: withIds, page: 1, pages: 1, total: withIds.length });
  m = p.match(/^\/api\/admin\/orders\/([a-z0-9]+)\/status$/);
  if (m) return json(res, 200, { order: orders.find((x) => x.id === m[1]) || orders[0] });
  if (p === '/api/admin/products' && req.method === 'POST') return json(res, 201, { product: withIds[0] });
  m = p.match(/^\/api\/admin\/products\/([a-z0-9]+)$/);
  if (m && req.method === 'PUT') return json(res, 200, { product: withIds[0] });
  if (m && req.method === 'DELETE') return json(res, 200, { message: 'deleted (mock)' });

  json(res, 404, { message: `mock: not implemented ${p}` });
});

const PORT = Number(process.env.MOCK_PORT) || 5000;
server.listen(PORT, () => console.log(`MOCK API on :${PORT}`));
