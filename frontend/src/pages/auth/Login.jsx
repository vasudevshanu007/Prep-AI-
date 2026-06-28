import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { loginUser, googleLogin, clearError } from '../../redux/slices/authSlice';
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiGoogleLine } from 'react-icons/ri';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [showFallbackBtn, setShowFallbackBtn] = useState(false);
  const googleFallbackRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isAuthenticated } = useSelector((s) => s.auth);

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  // Called by Google with the credential token after the user picks an account
  const handleCredentialResponse = useCallback(async (response) => {
    const result = await dispatch(googleLogin(response.credential));
    if (googleLogin.fulfilled.match(result)) {
      toast.success(`Welcome, ${result.payload.user.name}!`);
      navigate(from, { replace: true });
    }
  }, [dispatch, navigate, from]);

  // Initialize Google Identity Services once the script is loaded
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'placeholder') return;

    const init = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      setGoogleReady(true);
    };

    if (window.google?.accounts) {
      init();
    } else {
      // Script still loading — poll until ready
      const id = setInterval(() => {
        if (window.google?.accounts) { clearInterval(id); init(); }
      }, 100);
      return () => clearInterval(id);
    }
  }, [handleCredentialResponse]);

  // Render the official Google button into the fallback div when One Tap is suppressed
  useEffect(() => {
    if (showFallbackBtn && googleFallbackRef.current && window.google?.accounts) {
      window.google.accounts.id.renderButton(googleFallbackRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 340,
      });
    }
  }, [showFallbackBtn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user.name}!`);
      navigate(from, { replace: true });
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'placeholder') {
      toast.error('Google Sign-In is not configured yet.');
      return;
    }
    if (!googleReady) {
      toast('Google Sign-In is still loading, please try again.', { icon: 'ℹ️' });
      return;
    }
    // Show One Tap prompt; fall back to standard button if suppressed
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setShowFallbackBtn(true);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden flex-col justify-center items-center p-12">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm"
          >
            <span className="text-white text-4xl font-black">P</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-white mb-4"
          >
            PrepAI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/80 text-lg mb-12"
          >
            AI Powered Interview Preparation
          </motion.p>

          <div className="space-y-4 text-left">
            {[
              { emoji: '🤖', text: 'AI-generated interview questions' },
              { emoji: '💬', text: 'Live mock interview chatbot' },
              { emoji: '📄', text: 'Smart resume analysis & ATS scoring' },
              { emoji: '💻', text: 'Live coding challenges with AI review' },
              { emoji: '📊', text: 'Detailed performance analytics' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-white/90 text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-2xl font-black">P</span>
            </div>
            <h1 className="text-2xl font-black gradient-text">PrepAI</h1>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-gray-400 text-sm mb-8">Sign in to continue your prep journey</p>

            {/* Google Sign-in button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-200 font-medium transition-all mb-3"
            >
              <RiGoogleLine className="text-xl text-red-400" />
              Continue with Google
            </button>

            {/* Standard Google button rendered here when One Tap is suppressed */}
            {showFallbackBtn && (
              <div className="flex justify-center mb-3">
                <div ref={googleFallbackRef} />
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-600 text-xs">OR</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="label !mb-0">Password</label>
                  <Link to="/forgot-password" className="text-primary-400 text-xs hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field pl-11 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary-400 font-medium hover:underline">
                Create one free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
