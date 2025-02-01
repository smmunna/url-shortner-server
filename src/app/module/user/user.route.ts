import express from 'express';
import { userController } from './user.controller';

const router = express.Router();

router.post('/', userController.createUser);
router.post('/login', userController.signInUser);
export const userRoutes = router;