import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [serverStatus, setServerStatus] = useState('checking')

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
  }, [])




  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      await api.get('/ping', { timeout: 5000 }); // Short timeout for check
      setServerStatus('online');
    } catch (e) {
      console.error("Server Check Failed:", e);
      setServerStatus('offline');
    }
  };

  useEffect(() => {
    checkServerStatus();
  }, []);




  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authService.login(email, password)
      const role = data.user.role
      // ... (existing port redirection logic preserved if needed, but standard flow follows role) ...

      // Port Redirection Logic (Legacy/Dev Support)
      const currentPort = window.location.port
      if (role === 'driver' && currentPort !== '6001' && currentPort !== '') {
        // alert("Redirecting to Driver App..."); // Optional
      }

      login(data.access_token, data.user)

      if (role === 'rider') navigate('/rider')
      else if (role === 'driver') navigate('/driver')
      else if (role === 'admin') navigate('/admin')
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-black to-black"></div>

      {/* Server Status Indicator */}
      <div
        onClick={checkServerStatus}
        className={`absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border ${serverStatus === 'online' ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30' :
          serverStatus === 'offline' ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' :
            'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 animate-pulse'
          }`}
      >
        {serverStatus === 'online' ? '🟢 System Operational' :
          serverStatus === 'offline' ? '🔴 Server Offline (Tap to Retry)' :
            '🟡 Connecting to Server...'}
      </div>

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

        <div className="bg-dark-800 rounded-2xl shadow-2xl p-8 border border-dark-700 backdrop-blur-sm transition-all duration-300">

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
