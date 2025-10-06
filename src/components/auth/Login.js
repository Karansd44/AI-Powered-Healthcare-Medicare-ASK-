// components/auth/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle, signInWithApple } = useAuth();
  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (error) {
      console.error("Google sign-in error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Google sign-in was canceled. Please try again.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError("Multiple popup requests detected. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked. Please enable popups for this site and try again.");
      } else {
        setError("Google sign-in failed: " + error.message);
      }
    }
    setLoading(false);
  }

  async function handleAppleLogin() {
    setError("");
    setLoading(true);
    try {
      await signInWithApple();
      navigate("/");
    } catch (error) {
      setError("Apple sign-in failed: " + error.message);
    }
    setLoading(false);
  }
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please check the email or create a new account.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again or use the forgot password option.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        setError('Failed to sign in: ' + error.message);
      }
    }
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto px-4 sm:px-0"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-5 sm:p-8 border border-gray-200/50">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">Welcome Back</h2>
          <p className="text-sm sm:text-base text-gray-600">Sign in to your MediMind ASK account</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your email"
            />
            <p className="mt-1 text-xs text-gray-500">Enter the email address you used to register</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your password"
            />
            <p className="mt-1 text-xs text-gray-500">Passwords are case-sensitive</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-xs sm:text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            Sign in
          </button>
          
          {/* Login help section */}
          <div className="mt-4 bg-blue-50 p-2 sm:p-3 rounded-lg text-xs text-gray-600">
            <p className="font-medium text-blue-700 mb-1">Having trouble logging in?</p>
            <ul className="list-disc list-inside space-y-0.5 sm:space-y-1">
              <li>Make sure your email is entered correctly</li>
              <li>Passwords are case-sensitive</li>
              <li>Check if your Caps Lock is turned on</li>
              <li>Try resetting your password if you can't remember it</li>
            </ul>
          </div>
        </form>

        <div className="mt-5 sm:mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-white/80 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full inline-flex justify-center py-2 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={handleAppleLogin}
              className="w-full inline-flex justify-center py-2 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="#000000">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <path d="M12 5c-3.87 0-7 3.13-7 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                <path d="M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;