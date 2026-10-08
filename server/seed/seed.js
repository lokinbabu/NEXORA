/**
 * NEXORA database seeder.
 *
 *   npm run seed            → inserts the product catalog + admin account (skips if already seeded)
 *   npm run seed -- --reset → DELETES all products, orders and users, then reseeds
 *
 * The admin account is created from environment variables (server/.env):
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { products } from './products.js';

const reset = process.argv.includes('--reset');

async function seed() {
  await connectDB();

  if (reset) {
    console.log('⚠  --reset: deleting ALL products, orders and users…');
    await Promise.all([Product.deleteMany({}), Order.deleteMany({}), User.deleteMany({})]);
  }

  /* ---------------- Products ---------------- */
  const existing = await Product.countDocuments();
  if (existing > 0 && !reset) {
    console.log(`• Products: ${existing} already present — skipping catalog (use "npm run seed -- --reset" to reseed).`);
  } else {
    await Product.insertMany(products);
    console.log(`✔ Inserted ${products.length} products across ${new Set(products.map((p) => p.category)).size} categories.`);
  }

  /* ---------------- Admin account ---------------- */
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const exists = await User.findOne({ email: ADMIN_EMAIL.trim().toLowerCase() });
    if (exists) {
      console.log(`• Admin ${ADMIN_EMAIL} already exists — skipping.`);
    } else {
      await User.create({
        name: ADMIN_NAME || 'Nexora Admin',
        email: ADMIN_EMAIL.trim().toLowerCase(),
        password: ADMIN_PASSWORD,
        role: 'admin',
      });
      console.log(`✔ Admin account created → ${ADMIN_EMAIL} (login at /admin/login)`);
    }
  } else {
    console.log(
      '⚠  No admin created. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env, then run this script again.'
    );
  }

  console.log('\n✔ Seed complete. Start the app with "npm run dev".\n');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('✖ Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
