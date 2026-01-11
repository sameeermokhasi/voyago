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

  /* 
     STATE FOR GOOGLE LOGIN ROLE SELECTION 
     When Google returns a token, we don't login immediately.
     Can show a modal or replace the form to ask "Rider or Driver?".
  */
  const [googleCredential, setGoogleCredential] = useState(null);

  const handleGoogleLogin = (response) => {
    // 1. Capture the token
    console.log("Google Credential Received. Prompting for Role.");
    setGoogleCredential(response.credential);
  };

  const confirmGoogleLogin = async (selectedRole) => {
    if (!googleCredential) return;

    try {
      setLoading(true);
      setError('');

      console.log(`Processing Google Login as ${selectedRole}`);
      const data = await authService.googleLogin(googleCredential, selectedRole);

      login(data.access_token, data.user);

      // Explicit navigation based on USER CHOICE
      if (selectedRole === 'driver') navigate('/driver');
      else if (selectedRole === 'admin') navigate('/admin');
      else navigate('/rider');

    } catch (err) {
      console.error("Google Login Error", err);
      let errorMessage = `Login Failed: ${err.message || err}`;
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'object'
          ? JSON.stringify(err.response.data.detail)
          : err.response.data.detail;
      }
      setError(errorMessage);
      setGoogleCredential(null); // Reset on error so they can try again
    } finally {
      setLoading(false);
    }
  };

  const handleDisplayGoogleButton = () => {
    // Re-render button if we cancel selection
    if (window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById("googleButton"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }

  // Effect to re-render Google button when switching back from Role Selection
  useEffect(() => {
    if (!googleCredential) {
      handleDisplayGoogleButton();
    }
  }, [googleCredential]);


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

          {/* --- GOOGLE ROLE SELECTION MODE --- */}
          {googleCredential ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Continue as...</h3>
                <p className="text-gray-400 text-sm">Please select your account type to proceed.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => confirmGoogleLogin('rider')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-dark-900 border-2 border-dark-600 hover:border-primary-500 hover:bg-dark-700 transition-all group"
                >
                  <Car className="w-10 h-10 text-gray-400 group-hover:text-primary-500 mb-3 transition-colors" />
                  <span className="font-semibold text-white">Rider</span>
                </button>

                <button
                  onClick={() => confirmGoogleLogin('driver')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-dark-900 border-2 border-dark-600 hover:border-primary-500 hover:bg-dark-700 transition-all group"
                >
                  {/* Using a different icon for Driver logic implies steering wheel, reusing Car for now or custom */}
                  <div className="relative">
                    <Car className="w-10 h-10 text-gray-400 group-hover:text-primary-500 mb-3 transition-colors" />
                    <div className="absolute -top-1 -right-1 bg-primary-500 rounded-full p-0.5">
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    </div>
                  </div>
                  <span className="font-semibold text-white">Driver</span>
                </button>
              </div>

              <button
                onClick={() => setGoogleCredential(null)}
                className="w-full text-gray-500 hover:text-gray-300 text-sm mt-4"
              >
                Cancel and go back
              </button>
            </div>
          ) : (
            /* --- NORMAL LOGIN FORM --- */
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
