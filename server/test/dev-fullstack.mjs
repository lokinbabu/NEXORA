/**
 * DEV-ONLY: boots the REAL Express API against an in-memory MongoDB.
 * Lets the full UI (register → cart → checkout → orders → admin) run against
 * the actual backend without a real MONGODB_URI. Never used in production.
 *
 *   node test/dev-fullstack.mjs        (default port 5400)
 *   PORT=5600 node test/dev-fullstack.mjs
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-not-for-production';
process.env.JWT_EXPIRES_DAYS = process.env.JWT_EXPIRES_DAYS || '7';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri('nexora-dev');
const PORT = Number(process.env.PORT) || 5400;

const { default: createApp } = await import('../app.js');
const { products } = await import('../seed/products.js');
const User = (await import('../models/User.js')).default;
const Product = (await import('../models/Product.js')).default;

await mongoose.connect(process.env.MONGODB_URI);
await Product.insertMany(products);
await User.create({ name: 'Nexora Admin', email: 'admin@nexora.gg', password: 'admin123', role: 'admin' });
console.log(`✔ Seeded ${products.length} products + admin (admin@nexora.gg / admin123)`);

const app = createApp();
app.listen(PORT, () => console.log(`✔ REAL API on http://localhost:${PORT}`));
