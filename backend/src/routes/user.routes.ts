import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', userController.getAll);
router.post('/', adminOnly, userController.add);
router.patch('/:id', adminOnly, userController.update);

export default router;
