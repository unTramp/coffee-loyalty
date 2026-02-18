import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API = import.meta.env.VITE_API_URL || '/api';

interface StaffInfo {
  id: string;
  name: string;
  role: string;
}

export interface StaffListItem {
  id: string;
  name: string;
  role: string;
  emailMasked: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  staff: StaffInfo | null;
  fetchStaff: () => Promise<StaffListItem[]>;
  requestCode: (staffId: string) => Promise<void>;
  verifyCode: (staffId: string, code: string) => Promise<void>;
  logout: () => void;
  getToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      staff: null,

      fetchStaff: async () => {
        const res = await fetch(`${API}/auth/staff`);
        if (!res.ok) throw new Error('Failed to fetch staff');
        return res.json();
      },

      requestCode: async (staffId) => {
        const res = await fetch(`${API}/auth/request-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId }),
        });
        if (!res.ok) throw new Error('Failed to request code');
      },

      verifyCode: async (staffId, code) => {
        const res = await fetch(`${API}/auth/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId, code }),
        });
        if (!res.ok) throw new Error('Invalid code');
        const data = await res.json();
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          staff: data.staff,
        });
      },

      logout: () => set({ accessToken: null, refreshToken: null, staff: null }),

      getToken: async () => {
        const { accessToken, refreshToken } = get();
        if (!accessToken) return null;

        // Try to use access token, refresh if expired
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          if (payload.exp * 1000 > Date.now() + 60000) return accessToken;
        } catch { /* token is invalid, try refresh */ }

        if (!refreshToken) return null;

        try {
          const res = await fetch(`${API}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (!res.ok) throw new Error('Refresh failed');
          const data = await res.json();
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
          return data.accessToken;
        } catch {
          set({ accessToken: null, refreshToken: null, staff: null });
          return null;
        }
      },
    }),
    { name: 'coffee-auth' }
  )
);
