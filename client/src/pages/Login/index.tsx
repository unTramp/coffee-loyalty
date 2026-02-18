import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

const CODE_LENGTH = 4;
const COOLDOWN_SECONDS = 60;

export function Login() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const requestCode = useAuthStore((s) => s.requestCode);
  const verifyCode = useAuthStore((s) => s.verifyCode);
  const navigate = useNavigate();

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRequestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestCode(email);
      setStep('code');
      setCooldown(COOLDOWN_SECONDS);
      setCode(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError('Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = useCallback(async (fullCode: string) => {
    setError('');
    setLoading(true);
    try {
      await verifyCode(email, fullCode);
      const staff = useAuthStore.getState().staff;
      if (staff?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/barista');
      }
    } catch {
      setError('Неверный код');
      setCode(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }, [email, verifyCode, navigate]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];

    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.slice(0, CODE_LENGTH).split('');
      digits.forEach((d, i) => {
        if (i < CODE_LENGTH) newCode[i] = d;
      });
      setCode(newCode);
      const full = newCode.join('');
      if (full.length === CODE_LENGTH) {
        handleVerify(full);
      } else {
        inputRefs.current[Math.min(digits.length, CODE_LENGTH - 1)]?.focus();
      }
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const full = newCode.join('');
    if (full.length === CODE_LENGTH) {
      handleVerify(full);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">☕</h1>
          <h2 className="text-xl font-semibold text-white">Coffee Loyalty</h2>
          <p className="text-violet-300 text-sm mt-1">Вход для персонала</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl p-3 text-center text-sm mb-4">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-violet-400 focus:outline-none focus:border-violet-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
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
                onClick={() => handleRequestCode()}
                disabled={cooldown > 0 || loading}
                className="text-sm text-violet-400 hover:text-violet-300 disabled:text-violet-600 transition-colors"
              >
                {cooldown > 0 ? `Отправить повторно (${cooldown}с)` : 'Отправить повторно'}
              </button>
              <button
                onClick={() => { setStep('email'); setError(''); setCode(Array(CODE_LENGTH).fill('')); }}
                className="text-sm text-violet-500 hover:text-violet-400 transition-colors"
              >
                Изменить email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
