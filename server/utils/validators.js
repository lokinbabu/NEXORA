import { CATEGORIES } from '../models/constants.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[+\d][\d\s\-()]{6,17}$/;

export function isNonEmptyString(v, min = 1, max = 100000) {
  return typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
}

export function isNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isInt(v, min = -Infinity, max = Infinity) {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

/* ---------------- Auth ---------------- */

export function validateRegister(body = {}) {
  const errors = {};
  if (!isNonEmptyString(body.name, 2, 60)) errors.name = 'Please enter your full name (2–60 characters).';
  if (!isNonEmptyString(body.email, 5, 120) || !EMAIL_RE.test(body.email.trim()))
    errors.email = 'Please enter a valid email address.';
  if (!isNonEmptyString(body.password, 6, 100))
    errors.password = 'Password must be at least 6 characters.';
  return errors;
}

export function validateLogin(body = {}) {
  const errors = {};
  if (!isNonEmptyString(body.email, 5, 120) || !EMAIL_RE.test(body.email.trim()))
    errors.email = 'Please enter a valid email address.';
  if (!isNonEmptyString(body.password, 1, 100)) errors.password = 'Please enter your password.';
  return errors;
}

export function validateProfile(body = {}) {
  const errors = {};
  if (body.name !== undefined && !isNonEmptyString(body.name, 2, 60))
    errors.name = 'Name must be 2–60 characters.';
  if (body.phone !== undefined && body.phone !== '' && !PHONE_RE.test(String(body.phone).trim()))
    errors.phone = 'Please enter a valid phone number.';
  const a = body.address || {};
  for (const key of ['fullName', 'line1', 'city', 'state', 'postalCode', 'country']) {
    if (a[key] !== undefined && a[key] !== null && !isNonEmptyString(String(a[key]), 1, 120))
      errors[`address.${key}`] = 'This field cannot be empty.';
  }
  return errors;
}

/* ---------------- Products ---------------- */

export function validateProduct(body = {}) {
  const errors = {};
  if (!isNonEmptyString(body.name, 3, 120)) errors.name = 'Product name must be 3–120 characters.';
  if (!CATEGORIES.includes(body.category)) errors.category = 'Please choose a valid category.';
  if (!isNumber(body.price) || body.price < 1) errors.price = 'Price must be a number of at least 1.';
  if (body.discount !== undefined && (!isNumber(body.discount) || body.discount < 0 || body.discount > 90))
    errors.discount = 'Discount must be between 0 and 90 (%).';
  if (body.stock !== undefined && !isInt(body.stock, 0, 1000000))
    errors.stock = 'Stock must be a whole number of 0 or more.';
  if (!isNonEmptyString(body.description, 10, 4000))
    errors.description = 'Description must be at least 10 characters.';
  if (!isNonEmptyString(body.brand ?? '', 0, 60)) errors.brand = 'Brand must be at most 60 characters.';
  if (body.image !== undefined && body.image !== null && String(body.image).length > 600)
    errors.image = 'Image path/URL is too long.';
  if (body.rating !== undefined && (!isNumber(body.rating) || body.rating < 0 || body.rating > 5))
    errors.rating = 'Rating must be between 0 and 5.';
  if (body.numReviews !== undefined && !isInt(body.numReviews, 0, 10_000_000))
    errors.numReviews = 'Number of reviews must be 0 or more.';
  if (body.specs !== undefined) {
    if (!Array.isArray(body.specs) || body.specs.length > 14) {
      errors.specs = 'Specifications must be a list of at most 14 rows.';
    } else {
      body.specs.forEach((s, i) => {
        if (!s || !isNonEmptyString(String(s.key ?? ''), 1, 60) || !isNonEmptyString(String(s.value ?? ''), 1, 120))
          errors.specs = `Specification row ${i + 1} needs both a label and a value.`;
      });
    }
  }
  return errors;
}

/* ---------------- Orders / checkout ---------------- */

const ADDRESS_FIELDS = [
  ['fullName', 2, 80],
  ['line1', 5, 160],
  ['city', 2, 80],
  ['state', 2, 80],
  ['postalCode', 3, 12],
  ['country', 2, 60],
];

export function validateShippingAddress(addr = {}) {
  const errors = {};
  for (const [key, min, max] of ADDRESS_FIELDS) {
    const v = addr[key];
    if (!isNonEmptyString(String(v ?? ''), min, max))
      errors[`shippingAddress.${key}`] =
        key === 'postalCode' ? 'Please enter a valid postal code.' : `Please enter a valid ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
  }
  if (!PHONE_RE.test(String(addr.phone ?? '').trim()))
    errors['shippingAddress.phone'] = 'Please enter a valid phone number.';
  return errors;
}

export function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0)
    return { items: 'Your cart is empty. Add some products first.' };
  if (items.length > 40) return { items: 'Too many distinct items in one order.' };
  for (const it of items) {
    if (!it || typeof it !== 'object' || typeof it.productId !== 'string' || !isInt(it.quantity, 1, 99))
      return { items: 'Cart contains an invalid item or quantity.' };
  }
  return null;
}

export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
