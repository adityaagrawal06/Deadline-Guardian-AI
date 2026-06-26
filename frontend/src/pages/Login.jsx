import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        console.error('Login failed:', data.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-text font-sans overflow-hidden">
      
      {/* Left Panel: Visuals & Branding (Hidden on small screens) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-center px-20 z-10 border-r border-white/5 bg-gradient-to-br from-[#0a0a0a] to-[#0f0f13]">
        {/* Animated Background Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], x: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white font-extrabold text-xl">D</span>
            </div>
            <h2 className="text-xl font-bold tracking-widest text-white/90 uppercase">Deadline Guardian</h2>
          </div>
          
          <h1 className="text-6xl font-extrabold leading-[1.1] mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50">
            Master your<br/>deadlines with<br/>
            <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">Autonomous AI.</span>
          </h1>
          <p className="text-lg text-text-muted max-w-md leading-relaxed font-medium">
            Turn impossible schedules into actionable, risk-managed blueprints. Let multi-agent AI orchestrate your success.
          </p>
        </motion.div>
      </div>

      {/* Right Panel: Authentication */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative z-20">
        
        {/* Mobile Background Elements */}
        <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md relative"
        >
          {/* Glassmorphic Card */}
          <div className="rounded-[32px] bg-white/[0.02] border border-white/[0.05] p-10 sm:p-12 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8 text-center lg:text-left"
            >
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-sm text-text-muted font-medium">Sign in to securely sync your intelligent task workspace.</p>
            </motion.div>

            {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}
            
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleEmailLogin}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Email</label>
                <input 
                  type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" name="password" value={formData.password} onChange={handleChange} required
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              >
                Sign In
              </button>

              <div className="w-full flex items-center gap-4 my-2">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-xs text-text-muted uppercase tracking-widest font-bold">Or Sign In With</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <div className="w-full flex justify-center scale-100 hover:scale-[1.02] transition-transform duration-300">
                <GoogleLogin 
                  onSuccess={handleSuccess}
                  onError={() => setError('Google Login Failed')}
                  theme="filled_black"
                  shape="pill"
                  useOneTap
                />
              </div>
            </motion.form>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-text-muted mt-8 font-medium"
          >
            Don't have an account? <Link to="/signup" className="text-primary hover:text-white transition-colors font-bold">Sign Up</Link>
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-xs text-text-muted mt-4 font-medium"
          >
            By signing in, you agree to our <Link to="/terms" className="text-white/60 hover:text-white transition-colors underline decoration-white/20 underline-offset-4">Terms of Service</Link>.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
