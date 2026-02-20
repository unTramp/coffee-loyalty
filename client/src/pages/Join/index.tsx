import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '/api';

export function Join() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Введите имя');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/customers/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка');
      }

      const data = await res.json();
      localStorage.setItem('coffee-customerId', data.customerId);
      navigate(`/customer/${data.customerId}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">☕</h1>
          <h2 className="text-xl font-semibold text-gray-900">Coffee Loyalty</h2>
          <p className="text-gray-500 text-sm mt-1">Карта лояльности</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-center text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-500 text-sm mb-1">Ваше имя</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Как вас зовут?"
              autoFocus
              disabled={loading}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Создаём карту...' : 'Получить карту'}
          </button>
        </form>
      </div>
    </div>
  );
}
