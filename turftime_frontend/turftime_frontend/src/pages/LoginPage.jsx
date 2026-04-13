import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    quote: "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
    name: 'Yokitha',
    title: 'PM, Hourglass',
    company: 'Web Design Agency',
  },
  {
    quote: "TurfTime made booking sports venues incredibly easy. Our team plays every weekend now!",
    name: 'Surithika',
    title: 'Captain',
    company: 'Thunder FC',
  },
  {
    quote: "A seamless experience from finding a turf to completing the booking. Highly recommended.",
    name: 'Rachana',
    title: 'Player',
    company: 'City Badminton Club',
  },
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) setSuccessMsg(location.state.message);
  }, [location.state]);

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'PLAYER': navigate('/player/dashboard'); break;
        case 'OWNER':  navigate('/owner/dashboard');  break;
        case 'ADMIN':  navigate('/admin/dashboard');  break;
        default:       navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      switch (result.user.role) {
        case 'PLAYER': navigate('/player/dashboard'); break;
        case 'OWNER':  navigate('/owner/dashboard');  break;
        case 'ADMIN':  navigate('/admin/dashboard');  break;
        default:       navigate('/');
      }
    } else {
      setError(result.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  const t = testimonials[testimonialIdx];

  return (
    <div className="min-h-screen flex page-bg">
      {/* ── Left: Beige Card ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md rounded-2xl p-10 shadow-2xl bg-white/90 backdrop-blur border border-primary-100">
          <h2 className="text-3xl font-bold mb-1 text-gray-900">Welcome back</h2>
          <p className="text-sm mb-8 text-gray-500">Welcome back! Please enter your details.</p>

          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-5 text-sm">{successMsg}</div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-5 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-900">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-400 outline-none focus:ring-2 text-sm"
                style={{ background: '#fff', borderColor: '#a7f3c0' }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 2px #2ca96b55'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-900">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 rounded-lg border text-gray-900 placeholder-gray-400 outline-none text-sm"
                  style={{ background: '#fff', borderColor: '#a7f3c0' }}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 2px #2ca96b55'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#1e8f58' }}
                />
                <span className="text-sm text-gray-700">Remember for 30 days</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                Forgot password
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm disabled:opacity-60"
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm mt-6 text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700">Sign up</Link>
          </p>
        </div>
      </div>

      {/* ── Right: Testimonial Panel ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 py-16">
        <blockquote className="text-3xl font-semibold leading-snug mb-8 text-primary-900">
          "{t.quote}"
        </blockquote>
        <div>
          <p className="font-bold text-lg text-primary-900">{t.name}</p>
          <p className="text-sm mt-0.5 text-primary-700">{t.title}</p>
          <p className="text-sm text-primary-700">{t.company}</p>
        </div>
        <div className="flex items-center gap-3 mt-10">
          <button
            onClick={() => setTestimonialIdx(i => (i - 1 + testimonials.length) % testimonials.length)}
            className="w-10 h-10 rounded-full border border-primary-400 text-primary-700 flex items-center justify-center transition-colors hover:bg-primary-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setTestimonialIdx(i => (i + 1) % testimonials.length)}
            className="w-10 h-10 rounded-full border border-primary-400 text-primary-700 flex items-center justify-center transition-colors hover:bg-primary-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

