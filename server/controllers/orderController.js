import Order, { generateOrderNumber } from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { asyncHandler, badRequest, notFound, conflict } from '../utils/ApiError.js';
import { validateCartItems, validateShippingAddress } from '../utils/validators.js';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../models/constants.js';

/**
 * POST /api/orders  (auth required)
 * Body: { items: [{ productId, quantity }], shippingAddress, notes? , saveAddress? }
 *
 * Security rules enforced here:
 *  • Prices are ALWAYS recalculated from MongoDB — the client's prices are ignored.
 *  • Stock is verified server-side before the order is created.
 *  • Stock is decremented atomically (guard on remaining stock), preventing
 *    two customers from buying the last unit at the same time.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const itemError = validateCartItems(body.items);
  const addressErrors = validateShippingAddress(body.shippingAddress || {});
  const errors = { ...(itemError ? { items: itemError.items } : {}), ...addressErrors };
  if (Object.keys(errors).length) throw badRequest('Please fix the highlighted fields.', errors);

  // Merge duplicate product lines defensively.
  const wanted = new Map();
  for (const it of body.items) {
    const prev = wanted.get(it.productId) || 0;
    wanted.set(it.productId, Math.min(99, prev + it.quantity));
  }

  const products = await Product.find({ _id: { $in: [...wanted.keys()] } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = [];
  let itemsTotal = 0;
  const stockIssues = [];

  for (const [productId, quantity] of wanted) {
    const product = byId.get(productId);
    if (!product) {
      stockIssues.push({ productId, name: 'This product', reason: 'no longer available' });
      continue;
    }
    if (product.stock < quantity) {
      stockIssues.push({
        productId,
        name: product.name,
        reason: product.stock === 0 ? 'is out of stock' : `has only ${product.stock} left in stock`,
      });
      continue;
    }
    const unitPrice = product.finalPrice; // computed server-side from DB values
    itemsTotal += unitPrice * quantity;
    items.push({
      product: product._id,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: unitPrice,
      quantity,
    });
  }

  if (stockIssues.length) {
    throw conflict('Some items in your cart are unavailable:', { items: JSON.stringify(stockIssues) });
  }

  const shippingFee = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = itemsTotal + shippingFee;

  // Atomic stock decrement — each update only succeeds if enough stock remains.
  const bulk = items.map((it) => ({
    updateOne: {
      filter: { _id: it.product, stock: { $gte: it.quantity } },
      update: { $inc: { stock: -it.quantity } },
    },
  }));
  const decremented = await Product.bulkWrite(bulk);
  if (decremented.modifiedCount !== items.length) {
    throw conflict('Stock changed while placing your order. Please review your cart and try again.');
  }

  const shippingAddress = {
    fullName: body.shippingAddress.fullName.trim(),
    phone: body.shippingAddress.phone.trim(),
    line1: body.shippingAddress.line1.trim(),
    line2: (body.shippingAddress.line2 || '').trim(),
    city: body.shippingAddress.city.trim(),
    state: body.shippingAddress.state.trim(),
    postalCode: body.shippingAddress.postalCode.trim(),
    country: body.shippingAddress.country.trim() || 'India',
  };

  try {
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user._id,
      items,
      itemsTotal,
      shippingFee,
      total,
      shippingAddress,
      paymentMethod: 'cod',
      notes: (body.notes || '').trim().slice(0, 500),
      status: 'Pending',
    });

    // Optionally remember the address on the user's profile for next time.
    if (body.saveAddress) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.phone = shippingAddress.phone;
        user.address = shippingAddress;
        await user.save();
      }
    }

    res.status(201).json({ order: order.toJSON() });
  } catch (err) {
    // Compensate: give the reserved stock back so it isn't lost.
    await Product.bulkWrite(
      items.map((it) => ({ updateOne: { filter: { _id: it.product }, update: { $inc: { stock: it.quantity } } } }))
    );
    throw err;
  }
});

/** GET /api/orders/my-orders (auth required) */
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders: orders.map((o) => o.toJSON()) });
});

/** GET /api/orders/:id (owner or admin only) */
export const getOrderById = asyncHandler(async (req, res) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) throw notFound('Order not found.');
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw notFound('Order not found.');
  const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw notFound('Order not found.');
  res.json({ order: order.toJSON() });
});
