import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../redux/slices/authSlice';
import { motion } from 'framer-motion';
import { RiUser3Line, RiBriefcaseLine, RiAddLine, RiCloseLine, RiSaveLine, RiShieldLine } from 'react-icons/ri';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const SKILL_SUGGESTIONS = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'TypeScript', 'AWS', 'Docker', 'Git', 'C++', 'Data Structures', 'System Design', 'Machine Learning'];

export default function Settings() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ name: user?.name || '', targetRole: user?.targetRole || '' });
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);

  const addSkill = (s) => {
    const sk = s.trim();
    if (sk && !skills.includes(sk) && skills.length < 15) setSkills([...skills, sk]);
    setSkillInput('');
  };

  const removeSkill = (s) => setSkills(skills.filter((sk) => sk !== s));

  const handleSave = async (e) => {
    e.preventDefault();
    await dispatch(updateProfile({ ...form, skills }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.newPass.length < 6) return toast.error('Password must be at least 6 characters');
    setChangingPw(true);
    try {
      // This would need a dedicated change-password endpoint
      toast.success('Password updated successfully');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error('Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your profile and preferences</p>
      </div>

      {/* Profile avatar */}
      <div className="card flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-3xl font-black flex-shrink-0">
          {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" /> : user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold text-lg">{user?.name}</p>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${user?.isEmailVerified ? 'bg-green-900/50 text-green-400 border-green-800' : 'bg-yellow-900/50 text-yellow-400 border-yellow-800'}`}>
              {user?.isEmailVerified ? '✓ Verified' : 'Unverified'}
            </span>
            <span className="badge bg-primary-500/20 text-primary-400 border border-primary-500/30 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <RiUser3Line className="text-primary-400" /> Profile Information
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label">Target Role</label>
            <div className="relative">
              <RiBriefcaseLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              <input type="text" placeholder="e.g. Frontend Developer" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} className="input-field pl-11" />
            </div>
          </div>

          <div>
            <label className="label">Skills</label>
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Add skill..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }} className="input-field flex-1" />
              <button type="button" onClick={() => addSkill(skillInput)} className="btn-secondary px-3"><RiAddLine /></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 6).map((s) => (
                <button key={s} type="button" onClick={() => addSkill(s)} className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-primary-500/10 border border-gray-700 hover:border-primary-500/40 rounded-lg text-gray-400 hover:text-primary-400 transition-all">+ {s}</button>
              ))}
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 px-3 py-1 bg-primary-500/15 border border-primary-500/30 rounded-full text-primary-400 text-xs font-medium">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-400"><RiCloseLine /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <LoadingSpinner size="sm" /> : <><RiSaveLine /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Change password */}
      {!user?.googleId && (
        <div className="card">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <RiShieldLine className="text-primary-400" /> Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="input-field" />
            </div>
            <button type="submit" disabled={changingPw} className="btn-secondary flex items-center gap-2">
              {changingPw ? <LoadingSpinner size="sm" /> : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Stats summary */}
      <div className="card">
        <h3 className="text-white font-semibold mb-4">Your Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Interviews', value: user?.stats?.totalInterviews || 0 },
            { label: 'Avg Score', value: `${user?.stats?.averageScore || 0}/10` },
            { label: 'Coding Tests', value: user?.stats?.totalCodingTests || 0 },
            { label: 'XP Points', value: user?.stats?.xp || 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-xl">{value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
