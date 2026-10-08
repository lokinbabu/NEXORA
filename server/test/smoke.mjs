/**
 * NEXORA end-to-end smoke test.
 * Boots a real Express app against an in-memory MongoDB (downloaded on first
 * run by mongodb-memory-server) and walks the complete customer + admin flows.
 *
 *   npm run smoke   (from /server)
 */
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'smoke-test-secret-not-for-production';
process.env.JWT_EXPIRES_DAYS = '1';

const { default: createApp } = await import('../app.js');
const { products: seedProducts } = await import('../seed/products.js');
const User = (await import('../models/User.js')).default;
const Product = (await import('../models/Product.js')).default;

let passed = 0;
const ok = (name) => { passed++; console.log(`  ✔ ${name}`); };

function makeClient(base) {
  let cookie = '';
  return async function call(method, path, body) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const setCookie = res.headers.getSetCookie?.() || [];
    for (const c of setCookie) {
      if (c.startsWith('token=')) cookie = c.split(';')[0];
      if (c.includes('token=;')) cookie = '';
    }
    let data = null;
    try { data = await res.json(); } catch { /* no body */ }
    return { status: res.status, data };
  };
}

async function main() {
  console.log('▸ Starting in-memory MongoDB…');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('nexora-smoke');
  await mongoose.connect(uri);
  console.log(`  ✔ MongoDB running at ${uri}`);

  // Seed catalog + admin directly (same models the seed script uses).
  await Product.insertMany(seedProducts);
  await User.create({ name: 'Smoke Admin', email: 'admin@nexora.test', password: 'adminpass123', role: 'admin' });

  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const anon = makeClient(base);

  console.log('\n▸ Health & public catalog');
  {
    const health = await anon('GET', '/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.data.db, 'connected');
    ok('GET /api/health → connected');

    const list = await anon('GET', '/api/products?limit=48');
    assert.equal(list.status, 200);
    assert.equal(list.data.total, seedProducts.length);
    ok(`GET /api/products → ${list.data.total} products`);

    const search = await anon('GET', '/api/products?search=ghost&category=Mice');
    assert.equal(search.data.total, 1);
    assert.ok(search.data.products[0].name.includes('Ghost'));
    ok('Search + category filter works');

    const sorted = await anon('GET', '/api/products?sort=price-asc&limit=5');
    const prices = sorted.data.products.map((p) => p.finalPrice ?? p.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
    ok('Price sort respects discounts');

    const id = list.data.products[0].id;
    const one = await anon('GET', `/api/products/${id}`);
    assert.equal(one.status, 200);
    assert.ok(one.data.product.finalPrice > 0);
    ok('Product detail with computed finalPrice');

    const rel = await anon('GET', `/api/products/${id}/related`);
    assert.equal(rel.status, 200);
    ok('Related products endpoint');

    const cats = await anon('GET', '/api/products/meta/categories');
    assert.equal(cats.data.categories.length, 8);
    ok('8 categories with counts');

    const missing = await anon('GET', '/api/products/507f1f77bcf86cd799439011');
    assert.equal(missing.status, 404);
    ok('404 for unknown product');
  }

  console.log('\n▸ Customer: register → browse → order');
  const user = makeClient(base);
  let orderId, firstProductId, orderedQty = 2;
  {
    const badReg = await user('POST', '/api/auth/register', { name: 'X', email: 'not-an-email', password: '123' });
    assert.equal(badReg.status, 400);
    ok('Registration validation rejects bad input');

    const reg = await user('POST', '/api/auth/register', { name: 'Riya Sharma', email: 'riya@test.dev', password: 'secret123' });
    assert.equal(reg.status, 201);
    assert.equal(reg.data.user.role, 'user');
    assert.ok(!reg.data.user.password);
    ok('Register → 201, no password leak');

    const me = await user('GET', '/api/auth/me');
    assert.equal(me.data.user.email, 'riya@test.dev');
    ok('Session persists via httpOnly cookie');

    const wrongLogin = await anon('POST', '/api/auth/login', { email: 'riya@test.dev', password: 'wrongpass' });
    assert.equal(wrongLogin.status, 401);
    ok('Wrong password → 401');

    const list = await anon('GET', '/api/products?limit=48');
    firstProductId = list.data.products[0].id;
    const p = list.data.products[0];

    const noAuth = await anon('POST', '/api/orders', { items: [{ productId: firstProductId, quantity: 1 }], shippingAddress: {} });
    assert.equal(noAuth.status, 401);
    ok('Placing an order without login → 401');

    const badAddr = await user('POST', '/api/orders', {
      items: [{ productId: firstProductId, quantity: 1 }],
      shippingAddress: { fullName: 'R', phone: '12', line1: 'x', city: '', state: '', postalCode: '', country: '' },
    });
    assert.equal(badAddr.status, 400);
    ok('Checkout validates the shipping address');

    const order = await user('POST', '/api/orders', {
      items: [{ productId: firstProductId, quantity: orderedQty }],
      shippingAddress: {
        fullName: 'Riya Sharma', phone: '9876543210', line1: '12 MG Road',
        line2: '', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India',
      },
      saveAddress: true,
    });
    assert.equal(order.status, 201);
    orderId = order.data.order.id;
    const expectedTotal = p.finalPrice * orderedQty + (p.finalPrice * orderedQty >= 4999 ? 0 : 99);
    assert.equal(order.data.order.total, expectedTotal);
    assert.equal(order.data.order.status, 'Pending');
    assert.equal(order.data.order.paymentMethod, 'cod');
    ok(`Order created — server-calculated total ₹${order.data.order.total} (COD)`);

    const fresh = await Product.findById(firstProductId);
    assert.equal(fresh.stock, p.stock - orderedQty);
    ok('Stock decremented in MongoDB');

    const mine = await user('GET', '/api/orders/my-orders');
    assert.equal(mine.data.orders.length, 1);
    assert.equal(mine.data.orders[0].orderNumber.startsWith('NX-'), true);
    ok('My Orders lists the order');

    const detail = await user('GET', `/api/orders/${orderId}`);
    assert.equal(detail.status, 200);

    const stranger = await anon('GET', `/api/orders/${orderId}`);
    assert.equal(stranger.status, 401);
    ok('Strangers cannot open someone else’s order');

    // Over-stock order must be rejected and must not change stock.
    // Use a quantity inside the valid per-line range (1–99) that still exceeds
    // what is available, so the request reaches the stock check (409 conflict).
    const stockBefore = (await Product.findById(firstProductId)).stock;
    const overQty = Math.min(99, stockBefore + 1);
    const over = await user('POST', '/api/orders', {
      items: [{ productId: firstProductId, quantity: overQty }],
      shippingAddress: {
        fullName: 'Riya Sharma', phone: '9876543210', line1: '12 MG Road',
        city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India',
      },
    });
    assert.equal(over.status, 409);
    const stockAfter = (await Product.findById(firstProductId)).stock;
    assert.equal(stockAfter, stockBefore);
    ok('Ordering more than stock → 409, stock untouched');

    const addrSaved = await user('GET', '/api/auth/me');
    assert.equal(addrSaved.data.user.address.city, 'Bengaluru');
    ok('“Save address” wrote to the user profile');

    await user('POST', '/api/auth/logout');
    const afterLogout = await user('GET', '/api/auth/me');
    assert.equal(afterLogout.status, 401);
    ok('Logout clears the session');
  }

  console.log('\n▸ Admin: authorize → manage products → orders → customers');
  {
    const userCookie = makeClient(base);
    await userCookie('POST', '/api/auth/login', { email: 'riya@test.dev', password: 'secret123' });
    const denied = await userCookie('GET', '/api/admin/stats');
    assert.equal(denied.status, 403);
    ok('Non-admin hitting /api/admin → 403');

    const admin = makeClient(base);
    const login = await admin('POST', '/api/auth/login', { email: 'admin@nexora.test', password: 'adminpass123' });
    assert.equal(login.data.user.role, 'admin');
    ok('Admin login works');

    const stats = await admin('GET', '/api/admin/stats');
    assert.equal(stats.status, 200);
    assert.equal(stats.data.stats.products, seedProducts.length);
    assert.equal(stats.data.stats.customers, 1);
    assert.equal(stats.data.stats.orders, 1);
    assert.ok(stats.data.recentOrders.length === 1);
    assert.equal(stats.data.salesByDay.length, 14);
    ok(`Dashboard stats: ₹${stats.data.stats.revenue} revenue, 14-day chart`);

    const created = await admin('POST', '/api/admin/products', {
      name: 'Smoke Test RGB Fan', brand: 'NEXORA', category: 'Accessories',
      price: 1499, discount: 10, stock: 7, description: 'A test product created by the smoke suite.',
      specs: [{ key: 'Size', value: '120 mm' }], rating: 4.5, numReviews: 10, featured: false,
    });
    assert.equal(created.status, 201);
    const pid = created.data.product.id;
    assert.equal(created.data.product.finalPrice, 1349);
    ok('Admin created a product (server computed finalPrice)');

    const badProduct = await admin('POST', '/api/admin/products', { name: 'x', category: 'Nope', price: -5 });
    assert.equal(badProduct.status, 400);
    ok('Product validation rejects bad payloads');

    const updated = await admin('PUT', `/api/admin/products/${pid}`, {
      ...created.data.product, price: 1999, stock: 3,
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.product.price, 1999);
    ok('Admin edited price & stock');

    const low = await admin('GET', '/api/admin/products?stock=low');
    assert.ok(low.data.products.some((p) => p.id === pid));
    ok('Low-stock filter finds the edited product');

    const customers = await admin('GET', '/api/admin/customers');
    assert.equal(customers.status, 200);
    assert.equal(customers.data.customers[0].orderCount, 1);
    assert.ok(customers.data.customers[0].totalSpent > 0);
    ok('Customers list with order counts and spend');

    const custDetail = await admin('GET', `/api/admin/customers/${customers.data.customers[0].id}`);
    assert.equal(custDetail.data.orders.length, 1);
    ok('Customer detail shows their orders');

    const orders = await admin('GET', '/api/admin/orders?status=Pending');
    assert.equal(orders.data.total, 1);
    ok('Order list filtered by status');

    const shipped = await admin('PUT', `/api/admin/orders/${orderId}/status`, { status: 'Shipped' });
    assert.equal(shipped.data.order.status, 'Shipped');
    ok('Order status → Shipped');

    const beforeStock = (await Product.findById(firstProductId)).stock;
    const cancelled = await admin('PUT', `/api/admin/orders/${orderId}/status`, { status: 'Cancelled' });
    assert.equal(cancelled.data.order.status, 'Cancelled');
    const afterStock = (await Product.findById(firstProductId)).stock;
    assert.equal(afterStock, beforeStock + orderedQty);
    ok('Cancelling the order restored stock');

    const del = await admin('DELETE', `/api/admin/products/${pid}`);
    assert.equal(del.status, 200);
    ok('Admin deleted a product');
  }

  console.log(`\n✅ All ${passed} smoke checks passed.\n`);
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n❌ Smoke test failed:', err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(0, 6).join('\n'));
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
