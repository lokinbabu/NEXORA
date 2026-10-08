import mongoose from 'mongoose';
import { CATEGORIES } from './constants.js';

const specSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required.'], trim: true, minlength: 3, maxlength: 120, index: true },
    brand: { type: String, trim: true, default: 'NEXORA', maxlength: 60 },
    description: { type: String, required: [true, 'Description is required.'], trim: true, maxlength: 4000 },
    category: { type: String, required: true, enum: CATEGORIES, index: true },
    price: { type: Number, required: [true, 'Price is required.'], min: [1, 'Price must be at least 1.'] },
    discount: { type: Number, default: 0, min: 0, max: 90 }, // percent off
    image: { type: String, default: '' }, // path/URL; empty → client renders generated placeholder art
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative.'], index: true },
    specs: { type: [specSchema], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

/** Price actually charged, computed server-side only (frontend never decides prices). */
productSchema.virtual('finalPrice').get(function () {
  const d = this.discount || 0;
  return Math.round(this.price * (1 - d / 100));
});

productSchema.virtual('savings').get(function () {
  return Math.max(0, Math.round(this.price - this.finalPrice));
});

productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

productSchema.index({ name: 'text', brand: 'text', description: 'text' });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
