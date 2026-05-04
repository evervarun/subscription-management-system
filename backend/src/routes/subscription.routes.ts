import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { validate, createSubscriptionSchema, updateSubscriptionSchema } from '../middlewares/validate.middleware';

const router = Router();

router.get('/', subscriptionController.getAll);
router.get('/:id', subscriptionController.getOne);
router.post('/', validate(createSubscriptionSchema), subscriptionController.create);
router.patch('/:id', validate(updateSubscriptionSchema), subscriptionController.update);
router.delete('/:id', subscriptionController.remove);

export default router;
