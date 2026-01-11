import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  // Check for token in URL on mount (for cross-port redirection)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userStr = params.get('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        login(token, user)

        // Navigate based on role
        if (user.role === 'rider') navigate('/rider')
        else if (user.role === 'driver') navigate('/driver')
        else if (user.role === 'admin') navigate('/admin')
      } catch (e) {
        console.error('Failed to parse user from URL', e)
      }
    }

    // Load Google One Tap
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "581716698386-pdahbc07b4ne0aivcoehjme00c6nebtb.apps.googleusercontent.com", // User needs to replace this
          callback: handleGoogleLogin,
          auto_select: false
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleButton"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, [])

  const handleGoogleLogin = async (response) => {
    try {
      setLoading(true);

      // Determine role based on PORT
      const currentPort = window.location.port;
      let role = 'rider'; // default
      if (currentPort === '6001') role = 'driver';
      else if (currentPort === '7001') role = 'admin';

      console.log(`Google Login: Detected Port ${currentPort}, Assigning Role: ${role}`);

      const data = await authService.googleLogin(response.credential, role);

      login(data.access_token, data.user);

      // Navigate based on role match
      if (data.user.role === 'driver') navigate('/driver');
      else if (data.user.role === 'admin') navigate('/admin');
      else navigate('/rider');
    } catch (err) {
      console.error("Google Login Error", err);
      let errorMessage = `Debug Error: ${err.message || err}`;
      if (err.response) {
        errorMessage += ` | Status: ${err.response.status}`;
        if (err.response.data) {
          errorMessage += ` | Data: ${JSON.stringify(err.response.data)}`;
        }
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authService.login(email, password)
      const role = data.user.role
      const currentPort = window.location.port

      // Port Redirection Logic
      if (role === 'driver' && currentPort !== '6001') {
        window.location.href = `http://localhost:6001/login?token=${data.access_token}&user=${encodeURIComponent(JSON.stringify(data.user))}`
        return
      }

      if (role === 'rider' && currentPort !== '5000' && currentPort !== '5173') {
        // Allow 5173 as dev default, but prefer 5000 if configured
        window.location.href = `http://localhost:5000/login?token=${data.access_token}&user=${encodeURIComponent(JSON.stringify(data.user))}`
        return
      }

      if (role === 'admin' && currentPort !== '7001') {
        window.location.href = `http://localhost:7001/login?token=${data.access_token}&user=${encodeURIComponent(JSON.stringify(data.user))}`
        return
      }

      login(data.access_token, data.user)

      // Navigate based on role (if no redirection needed)
      if (role === 'rider') navigate('/rider')
      else if (role === 'driver') navigate('/driver')
      else if (role === 'admin') navigate('/admin')
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          // Handle Pydantic validation errors
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-black to-black"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6 group">
            <div className="bg-primary-500 p-3 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
              <Car className="w-8 h-8 text-black" />
            </div>
            <span className="ml-3 text-2xl font-bold text-white tracking-tight">Voyago</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Sign in to continue your journey</p>
        </div>

        <div className="bg-dark-800 rounded-2xl shadow-2xl p-8 border border-dark-700 backdrop-blur-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 bg-dark-900 border-dark-600 focus:border-primary-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <a href="#" className="text-sm text-primary-500 hover:text-primary-400 font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10 bg-dark-900 border-dark-600 focus:border-primary-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-white focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-dark-600 rounded bg-dark-900"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3.5"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-800 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div id="googleButton" className="w-full flex justify-center"></div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-500 hover:text-primary-400 font-bold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
