import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

const API = import.meta.env.VITE_API_URL || '/api';

interface Customer {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  stampCount: number;
  totalRedeemed: number;
  createdAt: string;
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { getToken } = useAuthStore();

  const fetchCustomers = async () => {
    const token = await getToken();
    if (!token) return;
    const params = new URLSearchParams({ page: String(page), limit: '20', search });
    const res = await fetch(`${API}/admin/customers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.data);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pt-4">
        <Link to="/admin" className="text-violet-400 hover:text-violet-300">&larr;</Link>
        <h1 className="text-xl font-bold text-white">Клиенты</h1>
      </div>

      <input
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-violet-400 focus:outline-none focus:border-violet-400 mb-4"
      />

      <div className="space-y-3">
        {customers.map((c) => (
          <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-white font-medium">{c.firstName} {c.lastName || ''}</p>
                <p className="text-violet-400 text-sm">@{c.username || c.telegramId}</p>
              </div>
              <div className="text-right">
                <p className="text-amber-400 font-bold">{c.stampCount}/6</p>
                <p className="text-violet-400 text-xs">Получено: {c.totalRedeemed}</p>
              </div>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-center text-violet-400 py-8">Нет клиентов</p>
        )}
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30"
        >
          &larr;
        </button>
        <span className="text-violet-300 py-2">Стр. {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={customers.length < 20}
          className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
