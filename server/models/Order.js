import mongoose from 'mongoose';
import { ORDER_STATUSES } from './constants.js';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot at purchase time
    brand: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 }, // final unit price paid
    quantity: { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    itemsTotal: { type: Number, required: true, min: 0 }, // sum of line subtotals
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 }, // itemsTotal + shippingFee
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
    notes: { type: String, trim: true, default: '', maxlength: 500 },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending', index: true },
  },
  { timestamps: true }
);

orderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

/** Human-friendly, collision-resistant order id, e.g. NX-M4X9K2Q7. */
export function generateOrderNumber() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `NX-${t}${r}`;
}

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
