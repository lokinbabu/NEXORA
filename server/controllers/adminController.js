import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { asyncHandler, notFound, badRequest, conflict } from '../utils/ApiError.js';
import { validateProduct, escapeRegex } from '../utils/validators.js';
import { ORDER_STATUSES, LOW_STOCK_THRESHOLD } from '../models/constants.js';

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

/* ============================ Dashboard ============================ */

/** GET /api/admin/stats */
export const getStats = asyncHandler(async (_req, res) => {
  const [productCount, customerCount, orderCount, revenueAgg, statusAgg] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('user', 'name email');

  const lowStock = await Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
    .sort({ stock: 1, name: 1 })
    .limit(8)
    .select('name brand category stock price discount');

  // Sales for the last 14 days (including empty days) for the dashboard chart.
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13);
  const byDay = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const dayMap = new Map(byDay.map((d) => [d._id, d]));
  const salesByDay = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const hit = dayMap.get(key);
    salesByDay.push({ date: key, orders: hit?.orders || 0, revenue: hit?.revenue || 0 });
  }

  res.json({
    stats: {
      products: productCount,
      customers: customerCount,
      orders: orderCount,
      revenue: revenueAgg[0]?.revenue || 0,
      byStatus: statusAgg.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      lowStockCount: await Product.countDocuments({ stock: { $lte: LOW_STOCK_THRESHOLD } }),
    },
    recentOrders: recentOrders.map((o) => o.toJSON()),
    lowStock: lowStock.map((p) => p.toJSON()),
    salesByDay,
  });
});

/* ============================ Products ============================ */

/** GET /api/admin/products */
export const listProducts = asyncHandler(async (req, res) => {
  const { search = '', category = '', stockFilter = '' } = req.query;
  const filter = {};
  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { category: rx }];
  }
  if (category) filter.category = category;
  if (stockFilter === 'out') filter.stock = 0;
  if (stockFilter === 'low') filter.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    products: products.map((p) => p.toJSON()),
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  });
});

function cleanProductBody(body) {
  return {
    name: body.name.trim(),
    brand: (body.brand || 'NEXORA').trim(),
    description: body.description.trim(),
    category: body.category,
    price: Number(body.price),
    discount: Number(body.discount || 0),
    image: (body.image || '').trim(),
    stock: Number(body.stock ?? 0),
    specs: Array.isArray(body.specs)
      ? body.specs
          .filter((s) => s && String(s.key || '').trim() && String(s.value || '').trim())
          .slice(0, 14)
          .map((s) => ({ key: String(s.key).trim(), value: String(s.value).trim() }))
      : [],
    rating: body.rating !== undefined && body.rating !== '' ? Number(body.rating) : 0,
    numReviews: body.numReviews !== undefined && body.numReviews !== '' ? Number(body.numReviews) : 0,
    featured: Boolean(body.featured),
  };
}

/** POST /api/admin/products */
export const createProduct = asyncHandler(async (req, res) => {
  const errors = validateProduct(req.body);
  if (Object.keys(errors).length) throw badRequest('Please fix the highlighted fields.', errors);
  const product = await Product.create(cleanProductBody(req.body));
  res.status(201).json({ product: product.toJSON() });
});

/** PUT /api/admin/products/:id */
export const updateProduct = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw notFound('Product not found.');
  const errors = validateProduct(req.body);
  if (Object.keys(errors).length) throw badRequest('Please fix the highlighted fields.', errors);

  const product = await Product.findById(req.params.id);
  if (!product) throw notFound('Product not found.');

  Object.assign(product, cleanProductBody(req.body));
  await product.save();
  res.json({ product: product.toJSON() });
});

/** DELETE /api/admin/products/:id */
export const deleteProduct = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw notFound('Product not found.');
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw notFound('Product not found.');
  res.json({ message: `"${product.name}" was deleted.` });
});

/* ============================ Customers ============================ */

/** GET /api/admin/customers — customers with order counts and lifetime value. */
export const listCustomers = asyncHandler(async (req, res) => {
  const { search = '' } = req.query;
  const filter = { role: 'user' };
  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  const ids = customers.map((c) => c._id);
  const orderStats = await Order.aggregate([
    { $match: { user: { $in: ids }, status: { $ne: 'Cancelled' } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, lastOrderAt: { $max: '$createdAt' } } },
  ]);
  const statMap = new Map(orderStats.map((s) => [s._id.toString(), s]));

  res.json({
    customers: customers.map((c) => {
      const s = statMap.get(c._id.toString());
      return {
        ...c.toJSON(),
        orderCount: s?.orders || 0,
        totalSpent: s?.spent || 0,
        lastOrderAt: s?.lastOrderAt || null,
      };
    }),
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  });
});

/** GET /api/admin/customers/:id — profile + their orders. */
export const getCustomer = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw notFound('Customer not found.');
  const customer = await User.findOne({ _id: req.params.id, role: 'user' });
  if (!customer) throw notFound('Customer not found.');

  const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });
  const active = orders.filter((o) => o.status !== 'Cancelled');

  res.json({
    customer: customer.toJSON(),
    orders: orders.map((o) => o.toJSON()),
    summary: {
      orderCount: orders.length,
      totalSpent: active.reduce((sum, o) => sum + o.total, 0),
      lastOrderAt: orders[0]?.createdAt || null,
    },
  });
});

/* ============================ Orders ============================ */

/** GET /api/admin/orders */
export const listOrders = asyncHandler(async (req, res) => {
  const { status = '', search = '' } = req.query;
  const filter = {};
  if (status && ORDER_STATUSES.includes(status)) filter.status = status;
  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id');
    filter.$or = [{ orderNumber: rx }, { user: { $in: users.map((u) => u._id) } }];
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders: orders.map((o) => o.toJSON()),
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  });
});

/** PUT /api/admin/orders/:id/status */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw notFound('Order not found.');
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) throw badRequest('Please choose a valid order status.');

  const order = await Order.findById(req.params.id);
  if (!order) throw notFound('Order not found.');
  if (order.status === status) return res.json({ order: order.toJSON() });

  const wasCancelled = order.status === 'Cancelled';
  const becomesCancelled = status === 'Cancelled';

  // Keep stock consistent with the order lifecycle.
  if (!wasCancelled && becomesCancelled) {
    // Cancelling an order returns its items to inventory.
    await Product.bulkWrite(
      order.items.map((it) => ({
        updateOne: { filter: { _id: it.product }, update: { $inc: { stock: it.quantity } } },
      }))
    );
  } else if (wasCancelled && !becomesCancelled) {
    // Re-activating a cancelled order reserves the stock again.
    const results = await Product.bulkWrite(
      order.items.map((it) => ({
        updateOne: {
          filter: { _id: it.product, stock: { $gte: it.quantity } },
          update: { $inc: { stock: -it.quantity } },
        },
      }))
    );
    if (results.modifiedCount !== order.items.length) {
      throw conflict('Cannot re-activate: one or more products no longer have enough stock.');
    }
  }

  order.status = status;
  await order.save();
  res.json({ order: order.toJSON() });
});
