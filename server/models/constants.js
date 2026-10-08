/** Shared domain constants (single source of truth for API + admin forms). */

export const CATEGORIES = [
  'Keyboards',
  'Mice',
  'Headsets',
  'Controllers',
  'Monitors',
  'Microphones',
  'Mousepads',
  'Accessories',
];

export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
];

/** Shipping fee model: free shipping above this items total, flat fee otherwise. */
export const FREE_SHIPPING_THRESHOLD = 4999;
export const SHIPPING_FEE = 99;

/** Stock at or below this level is flagged as "low stock" for the admin dashboard. */
export const LOW_STOCK_THRESHOLD = 5;
