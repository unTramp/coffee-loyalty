import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth';
import { Scanner } from '../../components/Scanner';
import QRCode from 'qrcode';

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
  const [showJoinQr, setShowJoinQr] = useState(false);
  const joinQrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { staff, logout, getToken } = useAuthStore();

  useEffect(() => {
    if (showJoinQr && joinQrCanvasRef.current) {
      const joinUrl = `${window.location.origin}/join`;
      QRCode.toCanvas(joinQrCanvasRef.current, joinUrl, {
        width: 480,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      joinQrCanvasRef.current.style.width = '240px';
      joinQrCanvasRef.current.style.height = '240px';
    }
  }, [showJoinQr]);

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
          <h1 className="text-xl font-bold text-gray-900">Бариста</h1>
          <p className="text-gray-500 text-sm">{staff?.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Выйти
        </button>
      </div>

      {result && (
        <div className={`rounded-xl p-4 mb-6 text-center ${
          result.redeemed
            ? 'bg-green-50 border border-green-200'
            : 'bg-violet-50 border border-violet-200'
        }`}>
          {result.redeemed ? (
            <>
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-green-700 font-bold text-lg">Бесплатный кофе!</p>
              <p className="text-green-600 text-sm mt-1">
                Всего бесплатных: {result.totalRedeemed}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl mb-2">☕</p>
              <p className="text-violet-700 font-bold">Штамп начислен!</p>
              <p className="text-violet-600 text-sm mt-1">
                {result.stampsAfter}/{result.stampGoal}
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-center">
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
            className="w-full mt-4 py-3 bg-white shadow-sm border border-gray-200 text-gray-700 rounded-xl"
          >
            Отмена
          </button>
        </div>
      ) : (
        <div className="space-y-3">
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
          <button
            onClick={() => setShowJoinQr(true)}
            className="w-full py-3 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
          >
            QR для клиентов
          </button>
        </div>
      )}

      {/* Join QR modal */}
      {showJoinQr && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowJoinQr(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-gray-900 font-bold text-lg mb-1">Регистрация клиента</h3>
            <p className="text-gray-500 text-sm mb-4">
              Покажите этот QR-код клиенту
            </p>
            <div className="flex justify-center mb-4 bg-white rounded-xl p-3 inline-block mx-auto">
              <canvas ref={joinQrCanvasRef} />
            </div>
            <button
              onClick={() => setShowJoinQr(false)}
              className="w-full py-3 bg-white shadow-sm border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
