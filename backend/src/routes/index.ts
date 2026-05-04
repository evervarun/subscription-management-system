import { Router } from 'express';
import subscriptionRoutes from './subscription.routes';
import auditRoutes from './audit.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/subscriptions', authMiddleware, subscriptionRoutes);
router.use('/audit', authMiddleware, auditRoutes);

export default router;
