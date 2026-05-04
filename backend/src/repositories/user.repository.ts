import { User, IUser } from '../models/user.model';
import { Types } from 'mongoose';

export const userRepository = {
  async findByOrg(organizationId: string) {
    return User.find({ organizationId }).select('-passwordHash').sort({ createdAt: -1 }).lean();
  },

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'member';
    organizationId: Types.ObjectId | string;
    status?: 'active' | 'inactive';
  }) {
    return User.create(data);
  },

  async update(id: string, organizationId: string, data: Partial<Pick<IUser, 'name' | 'role' | 'status'>>) {
    return User.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).select('-passwordHash').lean();
  },

  async findByEmail(email: string) {
    return User.findOne({ email }).lean();
  },

  async countAdmins(organizationId: string) {
    return User.countDocuments({ organizationId, role: 'admin', status: 'active' });
  },
};
