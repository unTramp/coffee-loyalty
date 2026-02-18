import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

const API = import.meta.env.VITE_API_URL || '/api';

interface Stats {
  customers: number;
  totalStamps: number;
  totalRedeemed: number;
  staffCount: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { staff, logout, getToken } = useAuthStore();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    })();
  }, []);

  const cards = [
    { label: 'Клиенты', value: stats?.customers ?? '—', link: '/admin/customers', color: 'from-violet-600 to-purple-700' },
    { label: 'Штампы', value: stats?.totalStamps ?? '—', link: '/admin/logs', color: 'from-amber-600 to-orange-700' },
    { label: 'Бесплатных кофе', value: stats?.totalRedeemed ?? '—', link: '/admin/logs', color: 'from-green-600 to-emerald-700' },
    { label: 'Персонал', value: stats?.staffCount ?? '—', link: '/admin/staff', color: 'from-blue-600 to-cyan-700' },
  ];

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
          <p className="text-gray-500 text-sm">{staff?.name}</p>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">
          Выйти
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.link}
            className={`bg-gradient-to-br ${c.color} rounded-xl p-4 shadow-lg hover:scale-105 transition-transform`}
          >
            <p className="text-white/70 text-sm">{c.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        <Link to="/admin/customers" className="block w-full py-3 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-center transition-colors">
          Клиенты
        </Link>
        <Link to="/admin/staff" className="block w-full py-3 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-center transition-colors">
          Персонал
        </Link>
        <Link to="/admin/logs" className="block w-full py-3 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-center transition-colors">
          Логи транзакций
        </Link>
      </div>
    </div>
  );
}
