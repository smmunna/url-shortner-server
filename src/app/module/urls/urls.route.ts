import express from 'express';
import { urlsController } from './urls.controller';

const router = express.Router();

router.post('/', urlsController.createUrls);
router.get('/', urlsController.redirectUrl);
router.get('/my-urls', urlsController.myShortendUrl);
export const urlsRoutes = router;