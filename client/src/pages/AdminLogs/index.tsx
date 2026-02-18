import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

const API = import.meta.env.VITE_API_URL || '/api';

interface Transaction {
  id: string;
  type: string;
  stampsBefore: number;
  stampsAfter: number;
  createdAt: string;
  customerName: string;
  staffName: string | null;
}

export function AdminLogs() {
  const [logs, setLogs] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const { getToken } = useAuthStore();

  const fetchLogs = async () => {
    const token = await getToken();
    if (!token) return;
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    const res = await fetch(`${API}/admin/transactions?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.data);
    }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'stamp': return { text: 'Штамп', cls: 'bg-violet-100 text-violet-700' };
      case 'redeem': return { text: 'Бесплатный', cls: 'bg-green-100 text-green-700' };
      case 'void': return { text: 'Отмена', cls: 'bg-red-100 text-red-700' };
      default: return { text: type, cls: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pt-4">
        <Link to="/admin" className="text-violet-600 hover:text-violet-500">&larr;</Link>
        <h1 className="text-xl font-bold text-gray-900">Логи транзакций</h1>
      </div>

      <div className="space-y-2">
        {logs.map((log) => {
          const t = typeLabel(log.type);
          return (
            <div key={log.id} className="bg-white shadow-sm border border-gray-200 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-gray-900 text-sm font-medium">{log.customerName}</p>
                <p className="text-gray-500 text-xs">
                  {log.staffName || '—'} &middot; {new Date(log.createdAt).toLocaleString('ru')}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.cls}`}>{t.text}</span>
                <p className="text-gray-500 text-xs mt-1">{log.stampsBefore} → {log.stampsAfter}</p>
              </div>
            </div>
          );
        })}
        {logs.length === 0 && (
          <p className="text-center text-gray-400 py-8">Нет транзакций</p>
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
          disabled={logs.length < 50}
          className="px-4 py-2 bg-white shadow-sm border border-gray-200 text-gray-700 rounded-lg disabled:opacity-40"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
