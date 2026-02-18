import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '/api';
const CODE_LENGTH = 4;
const COOLDOWN_SECONDS = 60;

type Step = 'email' | 'name' | 'code';

export function Join() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendJoin = async (name?: string) => {
    setError('');
    setLoading(true);
    try {
      const body: Record<string, string> = { email: email.trim() };
      if (name) body.firstName = name;

      const res = await fetch(`${API}/customers/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка');
      }

      const data = await res.json();

      if (data.needsName) {
        setStep('name');
      } else {
        setStep('code');
        setCooldown(COOLDOWN_SECONDS);
        setCode(Array(CODE_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Введите корректный email');
      return;
    }
    sendJoin();
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Введите имя');
      return;
    }
    sendJoin(firstName.trim());
  };

  const handleVerify = useCallback(async (fullCode: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/customers/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: fullCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error === 'Code expired' ? 'Код истёк' : 'Неверный код');
      }

      const data = await res.json();
      localStorage.setItem('coffee-customerId', data.customerId);
      navigate(`/customer/${data.customerId}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setCode(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }, [email, navigate]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];

    if (value.length > 1) {
      const digits = value.slice(0, CODE_LENGTH).split('');
      digits.forEach((d, i) => {
        if (i < CODE_LENGTH) newCode[i] = d;
      });
      setCode(newCode);
      const full = newCode.join('');
      if (full.length === CODE_LENGTH) handleVerify(full);
      else inputRefs.current[Math.min(digits.length, CODE_LENGTH - 1)]?.focus();
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const full = newCode.join('');
    if (full.length === CODE_LENGTH) handleVerify(full);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    sendJoin(firstName.trim() || undefined);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">☕</h1>
          <h2 className="text-xl font-semibold text-white">Coffee Loyalty</h2>
          <p className="text-violet-300 text-sm mt-1">Карта лояльности</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl p-3 text-center text-sm mb-4">
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-violet-300 text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-violet-400/50 focus:outline-none focus:border-violet-400 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Продолжить'}
            </button>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <p className="text-violet-300 text-sm text-center">
              Вы у нас впервые! Как вас зовут?
            </p>
            <div>
              <label className="block text-violet-300 text-sm mb-1">Имя</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ваше имя"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-violet-400/50 focus:outline-none focus:border-violet-400 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Продолжить'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); }}
              className="w-full text-sm text-violet-500 hover:text-violet-400 transition-colors"
            >
              Назад
            </button>
          </form>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <p className="text-violet-300 text-sm text-center">
              Код отправлен на <span className="text-white font-medium">{email}</span>
            </p>

            <div className="flex justify-center gap-3">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={CODE_LENGTH}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-violet-400 disabled:opacity-50"
                />
              ))}
            </div>

            {loading && (
              <p className="text-violet-300 text-sm text-center">Проверка...</p>
            )}

            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="text-sm text-violet-400 hover:text-violet-300 disabled:text-violet-600 transition-colors"
              >
                {cooldown > 0 ? `Отправить повторно (${cooldown}с)` : 'Отправить повторно'}
              </button>
              <button
                onClick={() => { setStep('email'); setError(''); setCode(Array(CODE_LENGTH).fill('')); }}
                className="text-sm text-violet-500 hover:text-violet-400 transition-colors"
              >
                Другой email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
