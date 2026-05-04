import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { AppError } from './subscription.service';

export const userService = {
  async getUsers(organizationId: string) {
    return userRepository.findByOrg(organizationId);
  },

  async addUser(
    organizationId: string,
    data: { name: string; email: string; password: string; role?: 'admin' | 'member' }
  ) {
    const existing = await userRepository.findByEmail(data.email.toLowerCase());
    if (existing) throw new AppError(409, 'An account with this email already exists');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role ?? 'member',
      organizationId,
    });

    return {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  },

  async updateUser(
    id: string,
    organizationId: string,
    data: { name?: string; role?: 'admin' | 'member'; status?: 'active' | 'inactive' }
  ) {
    // Prevent removing last admin
    if (data.role === 'member' || data.status === 'inactive') {
      const adminCount = await userRepository.countAdmins(organizationId);
      if (adminCount <= 1) {
        const users = await userRepository.findByOrg(organizationId);
        const target = users.find((u) => String(u._id) === id);
        if (target?.role === 'admin') {
          throw new AppError(400, 'Cannot demote or deactivate the last admin of the organization');
        }
      }
    }
    const updated = await userRepository.update(id, organizationId, data);
    if (!updated) throw new AppError(404, 'User not found');
    return updated;
  },
};
