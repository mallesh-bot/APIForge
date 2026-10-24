import express from 'express';
import { listHistory, clearHistory } from '../controllers/historyController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listHistory);
router.delete('/', clearHistory);

export default router;
