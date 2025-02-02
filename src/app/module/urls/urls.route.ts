import express from 'express';
import { urlsController } from './urls.controller';
import authenticateJWT from '../../middleware/authenticateJWT';

const router = express.Router();

router.post('/', urlsController.createUrls);
router.get('/:shortCode', urlsController.redirectUrl);
router.get('/my-urls', authenticateJWT, urlsController.myShortendUrl);
export const urlsRoutes = router;