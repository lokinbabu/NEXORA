import mongoose from 'mongoose';

/**
 * Connect to MongoDB.
 * The connection string comes ONLY from the MONGODB_URI environment variable
 * (server/.env). It is never hardcoded and never sent to the frontend.
 */
export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri === 'YOUR_MONGODB_CONNECTION_STRING_HERE') {
    console.error(`
──────────────────────────────────────────────────────────────
  ✖  MONGODB_URI is not configured.

  1. Open  server/.env  (copy server/.env.example if missing)
  2. Set:  MONGODB_URI=your-mongodb-atlas-connection-string
     e.g.  MONGODB_URI=mongodb+srv://user:<password>@cluster0.xxx.mongodb.net/nexora
  3. In Atlas: Network Access → allow your IP, and make sure the
     password in the URI is URL-encoded.
──────────────────────────────────────────────────────────────
`);
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log(`✔ MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`
──────────────────────────────────────────────────────────────
  ✖  MongoDB connection failed: ${err.message}

  Checklist:
  • Is MONGODB_URI in server/.env correct and complete?
  • Did you replace <password> with the real password (URL-encoded)?
  • Atlas → Network Access → is your current IP allowed?
  • Is your cluster running (not paused)?
──────────────────────────────────────────────────────────────
`);
    process.exit(1);
  }
}
