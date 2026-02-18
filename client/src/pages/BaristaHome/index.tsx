import { useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/auth';
import { Scanner } from '../../components/Scanner';

const API = import.meta.env.VITE_API_URL || '/api';

interface StampResult {
  stampsBefore: number;
  stampsAfter: number;
  redeemed: boolean;
  totalRedeemed: number;
  stampGoal: number;
}

export function BaristaHome() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<StampResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { staff, logout, getToken } = useAuthStore();

  const handleScan = useCallback(async (qrPayload: string) => {
    setScanning(false);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('Сессия истекла. Войдите снова.');
        return;
      }

      const res = await fetch(`${API}/stamps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrPayload }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка начисления');
      }

      const data: StampResult = await res.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h1 className="text-xl font-bold text-white">Бариста</h1>
          <p className="text-violet-300 text-sm">{staff?.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-violet-400 hover:text-violet-300"
        >
          Выйти
        </button>
      </div>

      {result && (
        <div className={`rounded-xl p-4 mb-6 text-center ${
          result.redeemed
            ? 'bg-green-500/20 border border-green-500'
            : 'bg-violet-500/20 border border-violet-500'
        }`}>
          {result.redeemed ? (
            <>
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-green-300 font-bold text-lg">Бесплатный кофе!</p>
              <p className="text-green-400 text-sm mt-1">
                Всего бесплатных: {result.totalRedeemed}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl mb-2">☕</p>
              <p className="text-violet-200 font-bold">Штамп начислен!</p>
              <p className="text-violet-300 text-sm mt-1">
                {result.stampsAfter}/{result.stampGoal}
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl p-4 mb-6 text-center">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center mb-6">
          <div className="animate-spin w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full" />
        </div>
      )}

      {scanning ? (
        <div>
          <Scanner onScan={handleScan} active={scanning} />
          <button
            onClick={() => setScanning(false)}
            className="w-full mt-4 py-3 bg-white/10 text-white rounded-xl"
          >
            Отмена
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setScanning(true);
            setResult(null);
            setError(null);
          }}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg rounded-xl transition-colors"
        >
          📷 Сканировать QR
        </button>
      )}
    </div>
  );
}
