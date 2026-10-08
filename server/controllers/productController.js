import Product from '../models/Product.js';
import { asyncHandler, notFound } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/validators.js';
import { CATEGORIES } from '../models/constants.js';

const SORTS = {
  featured: { featured: -1, rating: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  'price-asc': { finalPrice: 1, price: 1 },
  'price-desc': { finalPrice: -1, price: -1 },
  savings: { savings: -1, rating: -1 }, // biggest discount first (Deals)
  rating: { rating: -1, numReviews: -1 },
  name: { name: 1 },
};

/**
 * GET /api/products
 * Query: search, category, sort, page, limit, inStock, ids (comma separated)
 */
export const listProducts = asyncHandler(async (req, res) => {
  const { search = '', category = '', sort = 'featured', ids = '', inStock = '' } = req.query;

  // Shortcut used by the cart: fetch a specific set of products by id.
  if (ids) {
    const idList = String(ids)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^[0-9a-fA-F]{24}$/.test(s))
      .slice(0, 40);
    const docs = await Product.find({ _id: { $in: idList } });
    const byId = new Map(docs.map((d) => [d._id.toString(), d]));
    const ordered = idList.map((id) => byId.get(id)).filter(Boolean);
    return res.json({ products: ordered.map((p) => p.toJSON()) });
  }

  const filter = {};
  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { description: rx }, { category: rx }];
  }
  if (category && CATEGORIES.includes(category)) filter.category = category;
  if (inStock === 'true') filter.stock = { $gt: 0 };

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const sortObj = SORTS[sort] || SORTS.featured;

  // finalPrice is computed in the pipeline so price sorting respects discounts.
  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        finalPrice: {
          $round: [{ $multiply: ['$price', { $subtract: [1, { $divide: [{ $ifNull: ['$discount', 0] }, 100] }] }] }, 0],
        },
        savings: {
          $subtract: ['$price', { $round: [{ $multiply: ['$price', { $subtract: [1, { $divide: [{ $ifNull: ['$discount', 0] }, 100] }] }] }, 0] }],
        },
      },
    },
    { $sort: sortObj },
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Product.aggregate(pipeline);
  const total = result?.totalCount?.[0]?.count || 0;

  // Aggregation returns raw docs (no Mongoose toJSON transform) — expose the
  // same shape as Product.toJSON(): `id` instead of `_id`, plus `savings`.
  const items = result.items.map(({ _id, ...rest }) => ({
    ...rest,
    id: String(_id),
    savings: Math.max(0, Math.round(rest.price - rest.finalPrice)),
  }));

  res.json({
    products: items,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  });
});

/** GET /api/products/meta/categories — distinct categories with product counts. */
export const getCategories = asyncHandler(async (_req, res) => {
  const counts = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', count: 1 } },
    { $sort: { name: 1 } },
  ]);
  res.json({ categories: counts });
});

/** GET /api/products/:id */
export const getProduct = asyncHandler(async (req, res) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) throw notFound('Product not found.');
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound('Product not found.');
  res.json({ product: product.toJSON() });
});

/** GET /api/products/:id/related — same category, highest rated, excluding itself. */
export const getRelated = asyncHandler(async (req, res) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) throw notFound('Product not found.');
  const product = await Product.findById(req.params.id).select('category');
  if (!product) throw notFound('Product not found.');
  const related = await Product.find({ category: product.category, _id: { $ne: product._id } })
    .sort({ rating: -1, numReviews: -1 })
    .limit(4);
  res.json({ products: related.map((p) => p.toJSON()) });
});
