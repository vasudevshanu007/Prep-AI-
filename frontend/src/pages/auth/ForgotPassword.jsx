import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiMailLine, RiArrowLeftLine, RiCheckLine } from 'react-icons/ri';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <RiArrowLeftLine /> Back to Login
        </Link>

        <div className="card text-center">
          {sent ? (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RiCheckLine className="text-green-400 text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm mb-6">
                We sent a password reset link to <span className="text-primary-400">{email}</span>. Check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn-primary inline-block">Back to Login</Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RiMailLine className="text-primary-400 text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Forgot Password?</h2>
              <p className="text-gray-400 text-sm mb-8">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleSubmit} className="text-left space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-11" required />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <LoadingSpinner size="sm" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
