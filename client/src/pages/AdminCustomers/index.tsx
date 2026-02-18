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
        <Link to="/admin" className="text-violet-600 hover:text-violet-500">&larr;</Link>
        <h1 className="text-xl font-bold text-gray-900">Клиенты</h1>
      </div>

      <input
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 mb-4"
      />

      <div className="space-y-3">
        {customers.map((c) => (
          <div key={c.id} className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-900 font-medium">{c.firstName} {c.lastName || ''}</p>
                <p className="text-gray-500 text-sm">@{c.username || c.telegramId}</p>
              </div>
              <div className="text-right">
                <p className="text-amber-600 font-bold">{c.stampCount}/6</p>
                <p className="text-gray-500 text-xs">Получено: {c.totalRedeemed}</p>
              </div>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-center text-gray-400 py-8">Нет клиентов</p>
        )}
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-white shadow-sm border border-gray-200 text-gray-700 rounded-lg disabled:opacity-40"
        >
          &larr;
        </button>
        <span className="text-gray-500 py-2">Стр. {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={customers.length < 20}
          className="px-4 py-2 bg-white shadow-sm border border-gray-200 text-gray-700 rounded-lg disabled:opacity-40"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
