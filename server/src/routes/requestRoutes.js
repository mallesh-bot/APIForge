import express from 'express';
import {
  listRequests,
  createRequest,
  getRequest,
  updateRequest,
  deleteRequest,
  duplicateRequest,
} from '../controllers/requestController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listRequests);
router.post('/', createRequest);
router.get('/:id', getRequest);
router.patch('/:id', updateRequest);
router.delete('/:id', deleteRequest);
router.post('/:id/duplicate', duplicateRequest);

export default router;
