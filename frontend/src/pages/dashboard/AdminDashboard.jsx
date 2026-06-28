import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import {
  RiUser3Line, RiRobotLine, RiCodeLine, RiGroupLine, RiSearch2Line,
  RiToggleLine, RiDeleteBinLine, RiShieldLine, RiFileListLine,
  RiBarChartLine, RiAlertLine, RiCheckLine, RiCloseLine, RiEditLine,
  RiRefreshLine, RiVipCrownLine,
} from 'react-icons/ri';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: RiBarChartLine },
  { id: 'users',      label: 'Users',      icon: RiGroupLine },
  { id: 'interviews', label: 'Interviews', icon: RiRobotLine },
  { id: 'problems',   label: 'Problems',   icon: RiCodeLine },
  { id: 'audit',      label: 'Audit Logs', icon: RiFileListLine },
  { id: 'analytics',  label: 'Analytics',  icon: RiBarChartLine },
];

const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937', titleColor: '#e5e7eb', bodyColor: '#9ca3af' } },
  scales: {
    x: { grid: { color: '#1f2937' }, ticks: { color: '#6b7280', maxTicksLimit: 8 } },
    y: { grid: { color: '#1f2937' }, ticks: { color: '#6b7280' } },
  },
};

const PLAN_COLORS = { free: 'text-gray-400', pro: 'text-blue-400', enterprise: 'text-yellow-400' };
const PLAN_BG = { free: 'bg-gray-800', pro: 'bg-blue-900/40', enterprise: 'bg-yellow-900/30' };

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 max-w-sm w-full">
      <RiAlertLine className="text-red-400 text-3xl mb-3" />
      <p className="text-white font-semibold mb-1">Are you sure?</p>
      <p className="text-gray-400 text-sm mb-5">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-gray-700 text-gray-300 hover:text-white py-2 rounded-xl transition-colors">Cancel</button>
        <button onClick={onConfirm} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-semibold py-2 rounded-xl transition-colors">Delete</button>
      </div>
    </div>
  </div>
);

// ── Overview Tab ──────────────────────────────────────────────────────────────
const OverviewTab = ({ stats }) => {
  if (!stats) return <div className="flex justify-center py-10"><LoadingSpinner /></div>;
  const monthlyChartData = {
    labels: stats.monthlyRegs?.map((m) => `${m._id.month}/${m._id.year}`) || [],
    datasets: [{ label: 'Registrations', data: stats.monthlyRegs?.map((m) => m.count) || [], backgroundColor: 'rgba(99,102,241,0.7)', borderColor: '#6366f1', borderWidth: 1, borderRadius: 6 }],
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Students', value: stats.stats?.totalUsers, icon: RiGroupLine, color: 'from-blue-600 to-blue-800' },
          { label: 'Active (7d)', value: stats.stats?.activeUsers, icon: RiUser3Line, color: 'from-green-600 to-green-800' },
          { label: 'Interviews', value: stats.stats?.totalInterviews, icon: RiRobotLine, color: 'from-purple-600 to-purple-800' },
          { label: 'Coding Tests', value: stats.stats?.totalCodingTests, icon: RiCodeLine, color: 'from-orange-600 to-orange-800' },
          { label: 'Admins', value: stats.stats?.totalAdmins, icon: RiShieldLine, color: 'from-red-600 to-red-800' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="text-white text-xl" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">{label}</p>
              <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">Monthly Registrations</h3>
          <div className="h-52"><Bar data={monthlyChartData} options={chartOptions} /></div>
        </div>
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Plan Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.planDistribution || {}).map(([plan, count]) => (
              <div key={plan} className={`flex items-center justify-between px-4 py-3 rounded-xl ${PLAN_BG[plan]}`}>
                <div className="flex items-center gap-2">
                  {plan === 'enterprise' && <RiVipCrownLine className="text-yellow-400" />}
                  <span className={`font-medium capitalize ${PLAN_COLORS[plan]}`}>{plan}</span>
                </div>
                <span className="text-white font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-white font-semibold mb-4">Top Performing Students</h3>
        <div className="space-y-2">
          {stats.topStudents?.slice(0, 8).map((s, i) => (
            <div key={s._id} className="flex items-center gap-3 p-2.5 bg-gray-800 rounded-xl">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-500 text-gray-900' : i === 1 ? 'bg-gray-400 text-gray-900' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-300'}`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-200 text-sm font-medium truncate">{s.name}</p>
                <p className="text-gray-500 text-xs">{s.stats.totalInterviews} interviews · <span className={PLAN_COLORS[s.plan]}>{s.plan}</span></p>
              </div>
              <span className="text-green-400 font-bold text-sm">{s.stats.averageScore}/10</span>
              <span className="text-purple-400 text-xs">{s.stats.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Users Tab ─────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers]         = useState([]);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('');
  const [plan, setPlan]           = useState('');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [confirm, setConfirm]     = useState(null); // { id, name }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, search, status, plan, limit: 15 });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, status, plan]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 350);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const toggle = async (id) => {
    try {
      const res = await adminAPI.toggleUserActive(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: res.data.user.isActive } : u));
      toast.success(res.data.message);
    } catch { toast.error('Action failed'); }
  };

  const doDelete = async (id) => {
    try {
      await adminAPI.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setConfirm(null); }
  };

  const changeRole = async (id, newRole) => {
    try {
      await adminAPI.changeUserRole(id, newRole);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: newRole } : u));
      toast.success(`Role → ${newRole}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const changePlan = async (id, newPlan) => {
    try {
      await adminAPI.changeUserPlan(id, newPlan);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, plan: newPlan } : u));
      toast.success(`Plan → ${newPlan}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      {confirm && <ConfirmModal message={`Permanently delete "${confirm.name}" and all their data?`} onConfirm={() => doDelete(confirm.id)} onCancel={() => setConfirm(null)} />}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9 py-2 text-sm w-full" />
        </div>
        {[
          { value: status, setter: setStatus, opts: [['', 'All Status'], ['active', 'Active'], ['inactive', 'Inactive']] },
          { value: plan,   setter: setPlan,   opts: [['', 'All Plans'], ['free', 'Free'], ['pro', 'Pro'], ['enterprise', 'Enterprise']] },
        ].map(({ value, setter, opts }, i) => (
          <select key={i} value={value} onChange={(e) => { setter(e.target.value); setPage(1); }} className="bg-gray-800 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <button onClick={fetchUsers} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><RiRefreshLine /></button>
      </div>

      {loading ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['User', 'Plan', 'Interviews', 'Avg Score', 'XP', 'Status', 'Role', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-gray-400 font-medium py-3 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div>
                        <p className="text-gray-200 font-medium truncate max-w-[150px]">{u.name}</p>
                        <p className="text-gray-500 text-xs truncate max-w-[150px]">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <select value={u.plan || 'free'} onChange={(e) => changePlan(u._id, e.target.value)} className={`text-xs font-semibold capitalize bg-transparent border-0 focus:outline-none cursor-pointer ${PLAN_COLORS[u.plan || 'free']}`}>
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                        <option value="enterprise">enterprise</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-gray-300">{u.stats?.totalInterviews || 0}</td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${u.stats?.averageScore >= 7 ? 'text-green-400' : u.stats?.averageScore >= 5 ? 'text-yellow-400' : 'text-gray-400'}`}>{u.stats?.averageScore || 0}/10</span>
                    </td>
                    <td className="py-3 px-3 text-purple-400">{u.stats?.xp || 0}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium border ${u.isActive ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-red-900/40 text-red-400 border-red-800'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1 focus:outline-none">
                        <option value="student">student</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggle(u._id)} title={u.isActive ? 'Deactivate' : 'Activate'} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-400' : 'hover:bg-green-900/30 text-gray-400 hover:text-green-400'}`}>
                          <RiToggleLine className="text-base" />
                        </button>
                        <button onClick={() => setConfirm({ id: u._id, name: u.name })} title="Delete" className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors">
                          <RiDeleteBinLine className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="text-center py-10 text-gray-500">No users found.</div>}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <span className="text-gray-400 text-sm">Showing {users.length} of {pagination.total}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Prev</button>
                <span className="flex items-center px-3 text-gray-400 text-sm">{page}/{pagination.pages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page === pagination.pages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Interviews Tab ─────────────────────────────────────────────────────────────
const InterviewsTab = () => {
  const [interviews, setInterviews] = useState([]);
  const [page, setPage]     = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getInterviews({ page, limit: 15 });
      setInterviews(res.data.interviews);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load interviews'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const doDelete = async (id) => {
    try {
      await adminAPI.deleteInterview(id);
      setInterviews((prev) => prev.filter((i) => i._id !== id));
      toast.success('Interview deleted');
    } catch { toast.error('Delete failed'); }
    finally { setConfirm(null); }
  };

  return (
    <div className="space-y-4">
      {confirm && <ConfirmModal message="Delete this interview permanently?" onConfirm={() => doDelete(confirm.id)} onCancel={() => setConfirm(null)} />}
      {loading ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Role', 'User', 'Type', 'Difficulty', 'Score', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="text-left text-gray-400 font-medium py-3 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {interviews.map((i) => (
                  <tr key={i._id} className="hover:bg-gray-800/40">
                    <td className="py-3 px-3 text-gray-200 font-medium">{i.role}</td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{i.userId?.name || '—'}<br/><span className="text-gray-600">{i.userId?.email}</span></td>
                    <td className="py-3 px-3 text-gray-400 capitalize">{i.interviewType}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-medium ${i.difficulty === 'hard' ? 'text-red-400' : i.difficulty === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>{i.difficulty}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${i.overallScore >= 7 ? 'text-green-400' : i.overallScore >= 5 ? 'text-yellow-400' : 'text-gray-400'}`}>{i.overallScore || 0}/10</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === 'completed' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>{i.status}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs">{new Date(i.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      <button onClick={() => setConfirm({ id: i._id })} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors">
                        <RiDeleteBinLine />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {interviews.length === 0 && <div className="text-center py-10 text-gray-500">No interviews found.</div>}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <span className="text-gray-400 text-sm">{pagination.total} total</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Prev</button>
                <span className="flex items-center px-3 text-gray-400 text-sm">{page}/{pagination.pages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page === pagination.pages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Problems Tab ───────────────────────────────────────────────────────────────
const ProblemsTab = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [confirm, setConfirm]   = useState(null);
  const [form, setForm]         = useState({ title: '', description: '', difficulty: 'easy', topic: '', testCases: [{ input: '', expectedOutput: '' }] });

  const load = async () => {
    setLoading(true);
    try { const res = await adminAPI.getCodingProblems(); setProblems(res.data.problems); }
    catch { toast.error('Failed to load problems'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew   = () => { setForm({ title: '', description: '', difficulty: 'easy', topic: '', testCases: [{ input: '', expectedOutput: '' }] }); setEditing('new'); };
  const openEdit  = (p) => { setForm({ title: p.title, description: p.description, difficulty: p.difficulty, topic: p.topic, testCases: p.testCases }); setEditing(p._id); };

  const save = async () => {
    try {
      if (editing === 'new') {
        const res = await adminAPI.createCodingProblem(form);
        setProblems((prev) => [...prev, res.data.problem]);
        toast.success('Problem created');
      } else {
        const res = await adminAPI.updateCodingProblem(editing, form);
        setProblems((prev) => prev.map((p) => p._id === editing ? res.data.problem : p));
        toast.success('Problem updated');
      }
      setEditing(null);
    } catch { toast.error('Save failed'); }
  };

  const doDelete = async (id) => {
    try { await adminAPI.deleteCodingProblem(id); setProblems((prev) => prev.filter((p) => p._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
    finally { setConfirm(null); }
  };

  if (editing) return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">{editing === 'new' ? 'New Problem' : 'Edit Problem'}</h3>
        <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white"><RiCloseLine className="text-xl" /></button>
      </div>
      {[
        { label: 'Title', key: 'title', type: 'text' },
        { label: 'Topic', key: 'topic', type: 'text' },
      ].map(({ label, key }) => (
        <div key={key}>
          <label className="text-gray-400 text-sm block mb-1">{label}</label>
          <input type="text" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="input-field w-full" />
        </div>
      ))}
      <div>
        <label className="text-gray-400 text-sm block mb-1">Difficulty</label>
        <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))} className="input-field w-full">
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
      </div>
      <div>
        <label className="text-gray-400 text-sm block mb-1">Description</label>
        <textarea rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field w-full resize-none font-mono text-sm" />
      </div>
      <div>
        <label className="text-gray-400 text-sm block mb-2">Test Cases</label>
        {form.testCases.map((tc, i) => (
          <div key={i} className="grid grid-cols-2 gap-3 mb-2">
            <input placeholder="Input" value={tc.input} onChange={(e) => { const t = [...form.testCases]; t[i].input = e.target.value; setForm((f) => ({ ...f, testCases: t })); }} className="input-field text-sm font-mono" />
            <input placeholder="Expected Output" value={tc.expectedOutput} onChange={(e) => { const t = [...form.testCases]; t[i].expectedOutput = e.target.value; setForm((f) => ({ ...f, testCases: t })); }} className="input-field text-sm font-mono" />
          </div>
        ))}
        <button onClick={() => setForm((f) => ({ ...f, testCases: [...f.testCases, { input: '', expectedOutput: '' }] }))} className="text-indigo-400 text-sm hover:text-indigo-300">+ Add Test Case</button>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
        <button onClick={save} className="btn-primary flex-1">Save</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {confirm && <ConfirmModal message="Delete this problem permanently?" onConfirm={() => doDelete(confirm.id)} onCancel={() => setConfirm(null)} />}
      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">{problems.length} problems in database</p>
        <button onClick={openNew} className="btn-primary py-2 px-4 text-sm">+ New Problem</button>
      </div>
      {loading ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
        <div className="space-y-2">
          {problems.map((p) => (
            <div key={p._id} className="flex items-center gap-4 bg-gray-900 rounded-xl px-4 py-3">
              <span className={`text-xs font-semibold w-14 text-center px-2 py-1 rounded-lg ${p.difficulty === 'hard' ? 'bg-red-900/40 text-red-400' : p.difficulty === 'medium' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-green-900/40 text-green-400'}`}>{p.difficulty}</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-200 font-medium">{p.title}</p>
                <p className="text-gray-500 text-xs">{p.topic} · {p.testCases?.length} test cases</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>{p.isActive ? 'active' : 'hidden'}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><RiEditLine /></button>
                <button onClick={() => setConfirm({ id: p._id })} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"><RiDeleteBinLine /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Audit Log Tab ──────────────────────────────────────────────────────────────
const AuditTab = () => {
  const [logs, setLogs]           = useState([]);
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]     = useState(false);

  const ACTION_STYLES = {
    USER_DELETED:     'bg-red-900/40 text-red-400',
    USER_DEACTIVATED: 'bg-orange-900/40 text-orange-400',
    USER_ACTIVATED:   'bg-green-900/40 text-green-400',
    ROLE_CHANGED:     'bg-blue-900/40 text-blue-400',
    PLAN_CHANGED:     'bg-yellow-900/40 text-yellow-400',
    INTERVIEW_DELETED:'bg-red-900/40 text-red-400',
    CODING_PROBLEM_CREATED: 'bg-indigo-900/40 text-indigo-400',
    CODING_PROBLEM_UPDATED: 'bg-indigo-900/40 text-indigo-300',
    CODING_PROBLEM_DELETED: 'bg-red-900/40 text-red-400',
  };

  useEffect(() => {
    setLoading(true);
    adminAPI.getAuditLogs({ page, limit: 25 })
      .then((res) => { setLogs(res.data.logs); setPagination(res.data.pagination); })
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-4">
      {loading ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log._id} className="flex items-start gap-4 bg-gray-900 rounded-xl px-4 py-3">
                <span className={`text-xs font-mono px-2 py-1 rounded-lg whitespace-nowrap mt-0.5 ${ACTION_STYLES[log.action] || 'bg-gray-800 text-gray-400'}`}>{log.action}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-sm">
                    <span className="text-indigo-400 font-medium">{log.adminEmail}</span>
                    {log.details?.name && <> → <span className="text-gray-200">{log.details.name}</span></>}
                    {log.details?.from && log.details?.to && <span className="text-gray-500"> ({log.details.from} → {log.details.to})</span>}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">{log.ip || 'unknown IP'}</p>
                </div>
                <span className="text-gray-600 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {logs.length === 0 && <div className="text-center py-10 text-gray-500">No audit logs yet.</div>}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <span className="text-gray-400 text-sm">{pagination.total} total events</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Prev</button>
                <span className="flex items-center px-3 text-gray-400 text-sm">{page}/{pagination.pages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page === pagination.pages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Analytics Tab ──────────────────────────────────────────────────────────────
const AnalyticsTab = () => {
  const [data, setData]   = useState(null);
  const [days, setDays]   = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminAPI.getAnalytics({ days })
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading || !data) return <div className="flex justify-center py-10"><LoadingSpinner /></div>;

  const dauChart = {
    labels: data.dau?.map((d) => d._id) || [],
    datasets: [{ label: 'DAU', data: data.dau?.map((d) => d.count) || [], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.15)', fill: true, tension: 0.3, pointRadius: 2 }],
  };
  const interviewChart = {
    labels: data.interviewTrend?.map((d) => d._id) || [],
    datasets: [
      { label: 'Created', data: data.interviewTrend?.map((d) => d.created) || [], backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 4 },
      { label: 'Completed', data: data.interviewTrend?.map((d) => d.completed) || [], backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 4 },
    ],
  };
  const lineOpts = { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: true, labels: { color: '#9ca3af' } } } };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">Period:</span>
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${days === d ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {d}d
          </button>
        ))}
        <span className="text-indigo-400 font-semibold text-sm ml-auto">Completion Rate: {data.completionRate}%</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Daily Active Users</h3>
          <div className="h-52"><Line data={dauChart} options={lineOpts} /></div>
        </div>
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Interviews Created vs Completed</h3>
          <div className="h-52"><Bar data={interviewChart} options={lineOpts} /></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Top Weak Topics</h3>
          <div className="space-y-2">
            {data.topWeakTopics?.map((t, i) => (
              <div key={t._id} className="flex items-center gap-3">
                <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (t.count / (data.topWeakTopics[0]?.count || 1)) * 100)}%` }} />
                </div>
                <span className="text-gray-300 text-sm w-32 truncate">{t._id}</span>
                <span className="text-gray-500 text-xs">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Coding Language Usage</h3>
          <div className="space-y-2">
            {data.languageDistribution?.map((l) => (
              <div key={l._id} className="flex items-center justify-between px-4 py-2.5 bg-gray-800 rounded-xl">
                <span className="text-gray-300 font-medium">{l._id}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">{l.count} submissions</span>
                  <span className={`text-sm font-bold ${l.avgScore >= 7 ? 'text-green-400' : l.avgScore >= 5 ? 'text-yellow-400' : 'text-gray-400'}`}>{(l.avgScore || 0).toFixed(1)}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats]         = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load admin stats'))
      .finally(() => setStatsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Platform management & governance</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon className="text-base" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        {statsLoading && activeTab === 'overview' ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" text="Loading..." /></div>
        ) : (
          <>
            {activeTab === 'overview'   && <OverviewTab stats={stats} />}
            {activeTab === 'users'      && <UsersTab />}
            {activeTab === 'interviews' && <InterviewsTab />}
            {activeTab === 'problems'   && <ProblemsTab />}
            {activeTab === 'audit'      && <AuditTab />}
            {activeTab === 'analytics'  && <AnalyticsTab />}
          </>
        )}
      </div>
    </div>
  );
}
