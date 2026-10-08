import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect); // every order route requires a logged-in user

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

export default router;
