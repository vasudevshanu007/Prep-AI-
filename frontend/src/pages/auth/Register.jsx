import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { registerUser, clearError } from '../../redux/slices/authSlice';
import { RiMailLine, RiLockLine, RiUser3Line, RiEyeLine, RiEyeOffLine, RiBriefcaseLine, RiAddLine, RiCloseLine } from 'react-icons/ri';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SKILL_SUGGESTIONS = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'TypeScript', 'AWS', 'Docker', 'Git', 'C++', 'Data Structures', 'System Design'];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', targetRole: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [step, setStep] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !skills.includes(s) && skills.length < 10) setSkills([...skills, s]);
    setSkillInput('');
  };

  const removeSkill = (s) => setSkills(skills.filter((sk) => sk !== s));

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser({ ...form, skills, targetRole: form.targetRole }));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Please verify your email.');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-black">P</span>
          </div>
          <h1 className="text-2xl font-black gradient-text">PrepAI</h1>
          <p className="text-gray-400 text-sm mt-1">Create your free account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${s <= step ? 'bg-gradient-primary text-white' : 'bg-gray-800 text-gray-500'}`}>
                {s}
              </div>
              {s < 2 && <div className={`flex-1 h-0.5 transition-all ${step >= 2 ? 'bg-primary-500' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          {step === 1 ? (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Account Details</h2>
              <p className="text-gray-400 text-sm mb-6">Basic information to get started</p>
              <form onSubmit={handleNext} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <RiUser3Line className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                    <input type="text" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field pl-11" required />
                  </div>
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                    <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field pl-11" required />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field pl-11 pr-11" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <div className="relative">
                    <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                    <input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input-field pl-11" required />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full mt-2">Next: Add Skills</button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Your Profile</h2>
              <p className="text-gray-400 text-sm mb-6">Help AI personalize your prep</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Target Role</label>
                  <div className="relative">
                    <RiBriefcaseLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                    <input type="text" placeholder="e.g. Frontend Developer, Data Scientist" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} className="input-field pl-11" />
                  </div>
                </div>

                <div>
                  <label className="label">Your Skills (max 10)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a skill..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                      className="input-field flex-1"
                    />
                    <button type="button" onClick={() => addSkill(skillInput)} className="btn-secondary px-3 py-3">
                      <RiAddLine className="text-lg" />
                    </button>
                  </div>

                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
                      <button key={s} type="button" onClick={() => addSkill(s)} className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-primary-500/20 border border-gray-700 hover:border-primary-500/50 rounded-lg text-gray-400 hover:text-primary-400 transition-all">
                        + {s}
                      </button>
                    ))}
                  </div>

                  {/* Selected skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {skills.map((s) => (
                        <span key={s} className="flex items-center gap-1.5 px-3 py-1 bg-primary-500/15 border border-primary-500/30 rounded-full text-primary-400 text-xs font-medium">
                          {s}
                          <button type="button" onClick={() => removeSkill(s)} className="text-primary-300 hover:text-red-400">
                            <RiCloseLine />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
