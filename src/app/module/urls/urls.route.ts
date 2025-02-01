import express from 'express';
import { urlsController } from './urls.controller';

const router = express.Router();

router.post('/', urlsController.createUrls );

export const urlsRoutes = router;