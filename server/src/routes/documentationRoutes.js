import express from 'express';
import {
  getCollectionDocumentation,
  exportDocumentationMarkdown,
} from '../controllers/documentationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/:id/documentation', getCollectionDocumentation);
router.get('/:id/documentation/markdown', exportDocumentationMarkdown);

export default router;
