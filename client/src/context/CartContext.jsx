import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clamp } from '../utils/format.js';

const CartContext = createContext(null);
const CART_KEY = 'nexora_cart_v1';

/** Cart lives in localStorage (fast, offline-friendly); at checkout the server
 *  re-validates stock and recalculates all prices from MongoDB. */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(raw?.items) ? raw.items : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify({ items }));
  }, [items]);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

    return {
      items,
      count,
      subtotal,
      /** Add a product (client passes the product document). */
      add(product, qty = 1) {
        const stock = Number(product.stock) || 0;
        if (stock <= 0) return { ok: false, message: 'This product is out of stock.' };
        let added = 0;
        setItems((list) => {
          const existing = list.find((i) => i.id === product.id);
          if (existing) {
            added = Math.min(stock - existing.qty, qty);
            if (added <= 0) return list;
            return list.map((i) => (i.id === product.id ? { ...i, qty: clamp(i.qty + added, 1, stock) } : i));
          }
          added = Math.min(qty, stock);
          return [
            ...list,
            {
              id: product.id,
              name: product.name,
              brand: product.brand || '',
              category: product.category,
              price: product.finalPrice ?? product.price,
              image: product.image || '',
              stock,
              qty: added,
            },
          ];
        });
        if (added < qty) return { ok: true, capped: true, message: `Only ${stock} in stock — quantity limited.` };
        return { ok: true };
      },
      setQty(id, qty) {
        setItems((list) =>
          list.map((i) => (i.id === id ? { ...i, qty: clamp(Math.round(qty) || 1, 1, i.stock || 99) } : i))
        );
      },
      remove(id) {
        setItems((list) => list.filter((i) => i.id !== id));
      },
      clear() {
        setItems([]);
      },
      /** Sync prices/stock from the server; drops products that no longer exist. */
      async refresh() {
        if (items.length === 0) return [];
        const ids = items.map((i) => i.id).join(',');
        const d = await fetch(`/api/products?ids=${ids}`).then((r) => r.json());
        const fresh = new Map((d.products || []).map((p) => [p.id, p]));
        const problems = [];
        setItems((list) =>
          list
            .filter((i) => {
              const p = fresh.get(i.id);
              if (!p) {
                problems.push({ name: i.name, reason: 'no longer available', removed: true });
                return false;
              }
              return true;
            })
            .map((i) => {
              const p = fresh.get(i.id);
              const price = p.finalPrice ?? p.price;
              const stock = p.stock;
              if (price !== i.price) problems.push({ name: i.name, reason: `price updated to ₹${price.toLocaleString('en-IN')}` });
              let qty = i.qty;
              if (stock <= 0) {
                problems.push({ name: i.name, reason: 'went out of stock', removed: true });
                return null;
              }
              if (qty > stock) {
                problems.push({ name: i.name, reason: `only ${stock} left in stock` });
                qty = stock;
              }
              return { ...i, price, stock, qty };
            })
            .filter(Boolean)
        );
        return problems;
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
