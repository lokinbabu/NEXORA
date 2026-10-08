import { Router } from 'express';
import { listProducts, getProduct, getCategories, getRelated } from '../controllers/productController.js';

const router = Router();

router.get('/', listProducts);
router.get('/meta/categories', getCategories);
router.get('/:id', getProduct);
router.get('/:id/related', getRelated);

export default router;
