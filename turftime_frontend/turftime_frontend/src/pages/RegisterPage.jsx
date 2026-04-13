import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import HeroImage from '../assets/images/signup1.jpg';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'PLAYER'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const dialogues = [
    {
      heading: 'Find & Book Venues\nInstantly.',
      sub: 'Discover top-rated turf grounds, courts, and arenas near you — available 24/7 with real-time slot booking.',
    },
    {
      heading: 'Build Your Team.\nRule the Field.',
      sub: 'Create or join sports teams, invite players, manage rosters, and coordinate matches all in one place.',
    },
    {
      heading: 'Play More,\nWorry Less.',
      sub: 'Secure payments, instant confirmations, and dispute resolution — so you can focus entirely on the game.',
    },
  ];
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setDialogueIdx(prev => (prev + 1) % dialogues.length);
        setFade(true);
      }, 350);
    }, 3000);
    return () => clearInterval(timerRef.current);
  }, []);

  const heroBackgroundStyle = {
    backgroundImage: `url(${HeroImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register(formData);
    
    if (result.success && result.user) {
      switch (result.user.role) {
        case 'PLAYER':
          navigate('/player/dashboard');
          break;
        case 'OWNER':
          navigate('/owner/dashboard');
          break;
        default:
          navigate('/');
      }
    } else if (result.registered) {
      // Account created but auto-login failed — redirect to login
      navigate('/login', { state: { message: 'Account created successfully! Please log in.' } });
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex lg:w-1/2 text-white flex-col justify-between p-12 relative overflow-hidden"
        style={heroBackgroundStyle}
      >
        {/* Layered gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-black/70 via-primary-900/60 to-black/50" />
        {/* Subtle top-left green glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
        {/* Subtle bottom-right glow */}
        <div className="absolute -bottom-20 -right-12 w-72 h-72 rounded-full bg-primary-400/15 blur-3xl pointer-events-none" />



        {/* Rotating dialogue */}
        <div className="relative z-10 flex-1 flex flex-col justify-start pt-16">
          <div
            style={{
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-5 whitespace-pre-line">
              {dialogues[dialogueIdx].heading}
            </h1>
            <p className="text-base text-gray-300 leading-relaxed max-w-sm">
              {dialogues[dialogueIdx].sub}
            </p>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-8">
            {dialogues.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFade(false); setTimeout(() => { setDialogueIdx(i); setFade(true); }, 350); clearInterval(timerRef.current); }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === dialogueIdx ? 'w-6 bg-primary-400' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>


        </div>


      </div>
      <div className="w-full lg:w-1/2 flex flex-col justify-start px-4 sm:px-8 lg:px-10 pt-8 pb-4 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Get started</h2>
            <p className="text-gray-500 text-sm">Create an account to book venues or list your own.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="input-field pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-primary-500 rounded border-gray-300 mt-1"
              />
              <label className="text-sm text-gray-700">
                I agree to the{' '}
                <Link to="/terms" className="font-medium text-primary-500 hover:text-primary-600">
                  Terms and Conditions
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

