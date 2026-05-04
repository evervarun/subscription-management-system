import { apiFetch } from '@/lib/api';

export interface OrgUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  createdAt: string;
}

interface UsersResponse {
  success: boolean;
  data: OrgUser[];
  message: string;
}

interface UserResponse {
  success: boolean;
  data: OrgUser;
  message: string;
}

export const userService = {
  async getAll(): Promise<OrgUser[]> {
    const res = await apiFetch<UsersResponse>('/users');
    return res.data;
  },

  async add(data: { name: string; email: string; password: string; role: 'admin' | 'member' }): Promise<OrgUser> {
    const res = await apiFetch<UserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async update(id: string, data: { name?: string; role?: 'admin' | 'member'; status?: 'active' | 'inactive' }): Promise<OrgUser> {
    const res = await apiFetch<UserResponse>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};
