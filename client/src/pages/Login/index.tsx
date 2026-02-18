import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, StaffListItem } from '../../stores/auth';

const CODE_LENGTH = 4;
const COOLDOWN_SECONDS = 60;

type Role = 'admin' | 'barista';

export function Login() {
  const existingStaff = useAuthStore((s) => s.staff);
  const navigate = useNavigate();

  // If already logged in, redirect immediately
  useEffect(() => {
    if (existingStaff) {
      navigate(existingStaff.role === 'admin' ? '/admin' : '/barista', { replace: true });
    }
  }, [existingStaff, navigate]);

  const [step, setStep] = useState<'select' | 'code'>('select');
  const [role, setRole] = useState<Role>('barista');
  const [staffList, setStaffList] = useState<StaffListItem[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffListItem | null>(null);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fetchStaff = useAuthStore((s) => s.fetchStaff);
  const requestCode = useAuthStore((s) => s.requestCode);
  const verifyCode = useAuthStore((s) => s.verifyCode);

  // Load staff list on mount
  useEffect(() => {
    fetchStaff()
      .then(setStaffList)
      .catch(() => setError('Не удалось загрузить список сотрудников'))
      .finally(() => setFetchLoading(false));
  }, [fetchStaff]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const filtered = staffList.filter((s) => s.role === role);

  const handleSelectStaff = async (member: StaffListItem) => {
    setSelectedStaff(member);
    setError('');
    setLoading(true);
    try {
      await requestCode(member.id);
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

  const handleResend = async () => {
    if (!selectedStaff) return;
    setError('');
    setLoading(true);
    try {
      await requestCode(selectedStaff.id);
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
    if (!selectedStaff) return;
    setError('');
    setLoading(true);
    try {
      await verifyCode(selectedStaff.id, fullCode);
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
  }, [selectedStaff, verifyCode, navigate]);

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

        {step === 'select' ? (
          <div className="space-y-4">
            {/* Role segment */}
            <div className="flex bg-white/10 rounded-xl p-1">
              {(['barista', 'admin'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    role === r
                      ? 'bg-violet-600 text-white'
                      : 'text-violet-300 hover:text-white'
                  }`}
                >
                  {r === 'admin' ? 'Админ' : 'Бариста'}
                </button>
              ))}
            </div>

            {/* Staff list */}
            {fetchLoading ? (
              <p className="text-violet-300 text-sm text-center py-8">Загрузка...</p>
            ) : filtered.length === 0 ? (
              <p className="text-violet-400 text-sm text-center py-8">Нет сотрудников</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectStaff(member)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 disabled:opacity-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{member.name}</p>
                      <p className="text-violet-400 text-sm truncate">{member.emailMasked}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-violet-300 text-sm text-center">
              Код отправлен на <span className="text-white font-medium">{selectedStaff?.emailMasked}</span>
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
                onClick={() => { setStep('select'); setSelectedStaff(null); setError(''); setCode(Array(CODE_LENGTH).fill('')); }}
                className="text-sm text-violet-500 hover:text-violet-400 transition-colors"
              >
                Выбрать другого
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
