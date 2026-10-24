import express from 'express';
import {
  listEnvironments,
  createEnvironment,
  getEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from '../controllers/environmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listEnvironments);
router.post('/', createEnvironment);
router.get('/:id', getEnvironment);
router.patch('/:id', updateEnvironment);
router.delete('/:id', deleteEnvironment);

export default router;
