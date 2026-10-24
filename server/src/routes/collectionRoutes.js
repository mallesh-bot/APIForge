import express from 'express';
import {
  listCollections,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collectionController.js';
import { importShopKartDemo } from '../controllers/demoCollectionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listCollections);
router.post('/', createCollection);
router.post('/import-shopkart-demo', importShopKartDemo);
router.get('/:id', getCollection);
router.patch('/:id', updateCollection);
router.delete('/:id', deleteCollection);

export default router;
