import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';

const router = Router();

router.get('/', auditController.getRecent);
router.get('/:subscriptionId', auditController.getBySubscription);

export default router;
