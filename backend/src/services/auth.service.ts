import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Organization } from '../models/org.model';
import { User } from '../models/user.model';
import { AppError } from './subscription.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

function signToken(userId: string, organizationId: string, role: string, name: string, email: string) {
  return jwt.sign({ userId, organizationId, role, name, email }, JWT_SECRET, { expiresIn: '7d' });
}

export const authService = {
  async signup(name: string, email: string, password: string, orgName: string) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError(409, 'An account with this email already exists');

    const org = await Organization.create({ name: orgName });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      organizationId: org._id,
    });

    const token = signToken(String(user._id), String(org._id), user.role, user.name, user.email);
    return {
      token,
      user: { _id: String(user._id), name: user.name, email: user.email, role: user.role },
      organization: { _id: String(org._id), name: org.name, planType: org.planType },
    };
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new AppError(401, 'Invalid email or password');
    if (user.status === 'inactive') throw new AppError(403, 'Your account has been deactivated. Contact your admin.');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid email or password');

    const org = await Organization.findById(user.organizationId).lean();
    const token = signToken(String(user._id), String(user.organizationId), user.role, user.name, user.email);
    return {
      token,
      user: { _id: String(user._id), name: user.name, email: user.email, role: user.role },
      organization: { _id: String(org?._id), name: org?.name ?? '', planType: org?.planType },
    };
  },

  async getMe(userId: string) {
    const user = await User.findById(userId).select('-passwordHash').lean();
    if (!user) throw new AppError(404, 'User not found');
    const org = await Organization.findById(user.organizationId).lean();
    return {
      user: { _id: String(user._id), name: user.name, email: user.email, role: user.role, status: user.status },
      organization: { _id: String(org?._id), name: org?.name ?? '', planType: org?.planType },
    };
  },
};
