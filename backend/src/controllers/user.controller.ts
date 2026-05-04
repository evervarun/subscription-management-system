import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';

const addUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'member']).default('member'),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['admin', 'member']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const userController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getUsers(req.user!.organizationId);
      res.json({ success: true, data: users, message: 'OK' });
    } catch (err) {
      next(err);
    }
  },

  async add(req: Request, res: Response, next: NextFunction) {
    try {
      const result = addUserSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
        return;
      }
      const user = await userService.addUser(req.user!.organizationId, result.data);
      res.status(201).json({ success: true, data: user, message: 'User added successfully' });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
        return;
      }
      const user = await userService.updateUser(req.params.id as string, req.user!.organizationId, result.data);
      res.json({ success: true, data: user, message: 'User updated' });
    } catch (err) {
      next(err);
    }
  },
};
