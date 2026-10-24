import express from 'express';
import { executeRequest } from '../controllers/executeController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', executeRequest);

export default router;
