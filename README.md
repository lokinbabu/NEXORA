# NEXORA — Premium Gaming Hardware Store

A complete, production-minded full-stack e-commerce application: **React + Vite** frontend, **Express + MongoDB (Mongoose)** backend, JWT authentication, real cart & checkout with **Cash on Delivery**, and a separate **admin panel** with product, order and customer management.

---

## ✨ Features

**Customer store**
- Browse, search, filter by category, sort (price / rating / newest / featured), paginate
- Product pages with specifications, discount pricing, stock status and related items
- Persistent cart (quantity +/−, remove, live price & stock re-sync from the server)
- Checkout with saved address + **Cash on Delivery** — totals are **recalculated on the server** and stock is **verified & atomically decremented**
- Order confirmation screen, order history, per-order status timeline
- Register / login / logout / account settings (profile + default address)

**Admin panel** (`/admin`, separate login)
- Dashboard: revenue, orders, customers, products, 14-day sales chart, recent orders, low-stock alerts
- Product management: create / edit / delete, price, discount, stock, category, description, specs, image, featured flag
- Order management: filter & search, open any order, update status (Pending → Confirmed → Packed → Shipped → Delivered / Cancelled — cancelling **restores stock**)
- Customer management: list with order counts & lifetime spend, per-customer detail

**Security**
- Passwords hashed with bcrypt (never stored or returned in plain text)
- JWT sessions in **httpOnly cookies** (Bearer-token fallback supported)
- `protect` + `adminOnly` middleware on every private/admin route
- Server-side validation everywhere; regex-escaped search; ObjectId checks
- Rate limiting (general + stricter on auth), Helmet, configured CORS
- Client prices are never trusted — everything is recomputed from MongoDB
- All secrets via environment variables; `.env` is git-ignored

---

## 🗂 Project structure

```
nexora/
├── client/                     # React frontend (Vite)
│   ├── index.html
│   └── src/
│       ├── components/         # Navbar, Footer, ProductCard, ProductArt, guards…
│       ├── layouts/            # Store / Auth / Admin shells
│       ├── pages/              # Home, Products, ProductDetail, Cart, Checkout,
│       │   └── admin/          # Orders, MyOrders, Account, Login/Register + Admin pages
│       ├── context/            # AuthContext, CartContext, ToastContext
│       ├── hooks/              # useApi, useDebounce
│       ├── services/           # api.js (fetch wrapper)
│       ├── styles/             # base / layout / store / admin CSS
│       └── utils/
└── server/                     # Express + Mongoose API
    ├── app.js                  # Express app factory
    ├── server.js               # entry — connects DB, then listens
    ├── config/db.js
    ├── models/                 # User, Product, Order + shared constants
    ├── controllers/            # auth, products, orders, admin
    ├── routes/                 # /api/auth, /api/products, /api/orders, /api/admin
    ├── middleware/             # protect (JWT), adminOnly, error handler
    ├── seed/                   # 20-product catalog + seeder script
    ├── test/smoke.mjs          # full end-to-end API test suite
    └── utils/                  # ApiError, validators, JWT cookie helpers
```

## 🧰 Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18, Vite 5, React Router 6, hand-crafted modern CSS |
| Backend   | Node.js 18+, Express 4, Mongoose 8 |
| Database  | MongoDB (Atlas or local) |
| Auth      | JWT (httpOnly cookie) + bcryptjs |
| Hardening | helmet, cors, express-rate-limit, server-side validation |

---

## 🚀 Run it locally (3 steps)

**Prerequisite:** Node.js 18+ and a MongoDB database (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works perfectly).

```bash
# 1. Install everything (server + client)
npm install          # in the project root (installs the dev orchestrator)
npm run install-all  # installs /server and /client dependencies

# 2. Configure environment — THE ONLY PLACE YOU ADD YOUR MONGODB URI
cp server/.env.example server/.env
#    → open server/.env and set:
#      MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/nexora
#    → also change JWT_SECRET and the ADMIN_* values

# 3. Seed the catalog + admin account, then run
npm run seed         # inserts 20 products; creates the admin from your .env
npm run dev          # API on :5000  +  frontend on :5173 (proxied)
```

Open **http://localhost:5173** — the store is live. Admin console: **http://localhost:5173/admin/login** (log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `server/.env`).

> Atlas checklist: allow your IP under **Network Access**, and URL-encode the password inside the URI.

---

## 🔐 Environment variables

**`server/.env`** (copy from `server/.env.example`) — never committed:

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | ✅ | **Your MongoDB Atlas connection string — the one secret you provide** |
| `JWT_SECRET` | ✅ | Long random string used to sign sessions |
| `JWT_EXPIRES_DAYS` | – | Session lifetime (default `7`) |
| `PORT` | – | API port (default `5000`) |
| `NODE_ENV` | – | `development` / `production` |
| `CLIENT_ORIGIN` | – | Frontend origin(s) for CORS when deployed on a separate domain (comma-separated) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | – | Used by `npm run seed` to create the first admin |

**`client/.env`** (optional): set `VITE_API_URL=https://your-api-host` **only** when frontend and backend are deployed to different domains. For same-domain deploys leave it unset — the app calls `/api` relatively. No secrets ever live in the frontend.

---

## 🌱 Seed / demo data

```bash
npm run seed              # catalog + admin (skips anything already present)
npm run seed -- --reset   # ⚠ wipes products, orders and users, then reseeds
```

- **20 realistic products** across 8 categories (Keyboards, Mice, Headsets, Controllers, Monitors, Microphones, Mousepads, Accessories), with prices in ₹, discounts, specs, ratings and stock levels.
- Products use built-in NEXORA artwork until you set an image (via the admin form) — no external image hosts involved.
- The **admin account** comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`. Never reuse a personal password; change these before seeding.

---

## 🏗 Production build & run

```bash
npm run build            # builds the React app into client/dist
npm start                # Express serves the API + the built frontend on :5000
```

With `NODE_ENV=production`, the server automatically serves `client/dist` and falls back to `index.html` for SPA routes — a **single-service deployment** (Render, Railway, Fly, a VPS, etc.). Just set:

```
NODE_ENV=production
MONGODB_URI=<your atlas uri>
JWT_SECRET=<long random string>
```

**Split deployment** (e.g. Vercel frontend + Render backend): set `VITE_API_URL` on the frontend build and `CLIENT_ORIGIN=https://your-frontend-domain` on the backend. Auth uses `SameSite=None; Secure` cookies in production, so both domains must be HTTPS.

---

## ✅ Testing

```bash
npm run smoke            # end-to-end API suite (downloads a test MongoDB on first run)
```

The smoke suite boots the real Express app against an in-memory MongoDB and walks the entire flow: health → catalog/search/sort → register/login/logout → checkout with server-side totals → stock decrement & over-stock rejection → admin authorization (403 for users) → product CRUD → order status transitions with stock restore → customer analytics.

Dev-only helpers in `server/test/` (never used in production):

```bash
node test/dev-fullstack.mjs   # real API + seeded in-memory DB on :5400 (UI QA without a MONGODB_URI)
MOCK_PORT=5399 node test/mock-api.mjs   # lightweight fixture API for frontend-only work
```

## 🧭 API overview

```
GET  /api/health
POST /api/auth/register | /api/auth/login | /api/auth/logout
GET  /api/auth/me            PUT /api/auth/profile

GET  /api/products           ?search &category &sort &page &limit &inStock &ids
GET  /api/products/meta/categories
GET  /api/products/:id       GET /api/products/:id/related

POST /api/orders             (auth) — COD checkout, server-validated
GET  /api/orders/my-orders   (auth)
GET  /api/orders/:id         (owner or admin)

GET  /api/admin/stats                    (admin)
GET|POST /api/admin/products             (admin)
PUT|DELETE /api/admin/products/:id       (admin)
GET  /api/admin/customers | /:id         (admin)
GET  /api/admin/orders                   (admin)
PUT  /api/admin/orders/:id/status        (admin)
```
