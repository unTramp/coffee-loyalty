import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

const API = import.meta.env.VITE_API_URL || '/api';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export function AdminStaff() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'barista' });
  const { getToken } = useAuthStore();

  const fetchStaff = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/admin/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setStaffList(await res.json());
  };

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/admin/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ email: '', name: '', role: 'barista' });
      fetchStaff();
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`${API}/admin/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active }),
    });
    fetchStaff();
  };

  useEffect(() => { fetchStaff(); }, []);

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pt-4">
        <Link to="/admin" className="text-violet-400 hover:text-violet-300">&larr;</Link>
        <h1 className="text-xl font-bold text-white flex-1">Персонал</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm"
        >
          + Добавить
        </button>
      </div>

      {showForm && (
        <form onSubmit={createStaff} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
          <input
            type="text" placeholder="Имя" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-violet-400 focus:outline-none"
          />
          <input
            type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-violet-400 focus:outline-none"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none"
          >
            <option value="barista">Бариста</option>
            <option value="admin">Админ</option>
          </select>
          <button type="submit" className="w-full py-2 bg-violet-600 text-white rounded-lg">
            Создать
          </button>
        </form>
      )}

      <div className="space-y-3">
        {staffList.map((s) => (
          <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-white font-medium">{s.name}</p>
              <p className="text-violet-400 text-sm">{s.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                s.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-violet-500/20 text-violet-300'
              }`}>
                {s.role}
              </span>
            </div>
            <button
              onClick={() => toggleActive(s.id, s.active)}
              className={`text-sm px-3 py-1 rounded-lg ${
                s.active ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
              }`}
            >
              {s.active ? 'Деактив.' : 'Активир.'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
