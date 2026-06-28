import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <RiLockLine className="text-primary-400 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">Set New Password</h2>
          <p className="text-gray-400 text-sm text-center mb-8">Enter your new password below.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-11 pr-11" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                <input type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field pl-11" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <LoadingSpinner size="sm" /> : 'Reset Password'}
            </button>
          </form>
          <p className="text-center text-gray-500 text-sm mt-4">
            <Link to="/login" className="text-primary-400 hover:underline">Back to Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
