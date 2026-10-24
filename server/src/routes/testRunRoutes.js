import express from 'express';
import {
  runCollectionTests,
  listTestRuns,
  getTestRun,
} from '../controllers/testRunController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/collection/:collectionId', runCollectionTests);
router.get('/', listTestRuns);
router.get('/:id', getTestRun);

export default router;
