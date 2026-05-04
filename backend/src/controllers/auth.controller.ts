import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  orgName: z.string().min(1, 'Organization name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
});

export const authController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
        return;
      }
      const { name, email, password, orgName } = result.data;
      const data = await authService.signup(name, email, password, orgName);
      res.status(201).json({ success: true, data, message: 'Account created successfully' });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, message: 'Invalid credentials format', errors: result.error.flatten().fieldErrors });
        return;
      }
      const { email, password } = result.data;
      const data = await authService.login(email, password);
      res.json({ success: true, data, message: 'Login successful' });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.getMe(req.user!.userId);
      res.json({ success: true, data, message: 'OK' });
    } catch (err) {
      next(err);
    }
  },
};
