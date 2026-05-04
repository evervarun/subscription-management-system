import { Router } from 'express';
import subscriptionRoutes from './subscription.routes';
import auditRoutes from './audit.routes';

const router = Router();

router.use('/subscriptions', subscriptionRoutes);
router.use('/audit', auditRoutes);

export default router;
