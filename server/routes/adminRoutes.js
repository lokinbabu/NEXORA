import { Router } from 'express';
import {
  getStats,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listCustomers,
  getCustomer,
  listOrders,
  updateOrderStatus,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect, adminOnly); // every admin route requires an admin account

router.get('/stats', getStats);

router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/customers', listCustomers);
router.get('/customers/:id', getCustomer);

router.get('/orders', listOrders);
router.put('/orders/:id/status', updateOrderStatus);

export default router;
