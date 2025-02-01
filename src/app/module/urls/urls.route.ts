import express from 'express';
import { urlsController } from './urls.controller';

const router = express.Router();

router.post('/', urlsController.createUrls );
router.get('/', urlsController.redirectUrl);
export const urlsRoutes = router;