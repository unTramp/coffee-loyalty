import { create } from 'zustand';

const API = import.meta.env.VITE_API_URL || '/api';

interface CardData {
  customer: { id: string; firstName: string };
  card: { stampCount: number; totalRedeemed: number } | null;
  stampGoal: number;
}

interface StampsState {
  cardData: CardData | null;
  loading: boolean;
  error: string | null;
  fetchCard: (customerId: string) => Promise<void>;
  fetchQr: (customerId: string) => Promise<string>;
}

export const useStampsStore = create<StampsState>((set) => ({
  cardData: null,
  loading: false,
  error: null,

  fetchCard: async (customerId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/customers/${customerId}/card`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch card');
      const data = await res.json();
      set({ cardData: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchQr: async (customerId) => {
    const res = await fetch(`${API}/customers/${customerId}/qr`);
    if (!res.ok) throw new Error('Failed to generate QR');
    const data = await res.json();
    return data.qrPayload;
  },
}));
