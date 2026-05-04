import { apiFetch } from '@/lib/api';
import { AuthUser, AuthOrganization } from '@/lib/auth-context';

interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: AuthUser;
    organization: AuthOrganization;
  };
  message: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse['data']> {
    const res = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return res.data;
  },

  async signup(
    name: string,
    email: string,
    password: string,
    orgName: string
  ): Promise<AuthResponse['data']> {
    const res = await apiFetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, orgName }),
    });
    return res.data;
  },
};
