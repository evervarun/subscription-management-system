import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';

const router = Router();

router.get('/:subscriptionId', auditController.getBySubscription);

export default router;
