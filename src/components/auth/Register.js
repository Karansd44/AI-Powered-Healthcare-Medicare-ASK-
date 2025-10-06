// components/auth/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
  await signup(email, password, userType, fullName);
  navigate('/');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please log in or use a different email.');
      } else {
        setError('Failed to create an account: ' + error.message);
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
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">Create Account</h2>
          <p className="text-sm sm:text-base text-gray-600">Join MediMind ASK today</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your full name"
            />
          </div>

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
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              I am a
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <input
                  id="patient"
                  name="userType"
                  type="radio"
                  value="patient"
                  checked={userType === 'patient'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="hidden peer"
                />
                <label
                  htmlFor="patient"
                  className="block p-3 sm:p-4 text-center text-sm border border-gray-300 rounded-lg cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:bg-gray-50 transition-colors"
                >
                  Patient
                </label>
              </div>
              <div>
                <input
                  id="doctor"
                  name="userType"
                  type="radio"
                  value="doctor"
                  checked={userType === 'doctor'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="hidden peer"
                />
                <label
                  htmlFor="doctor"
                  className="block p-3 sm:p-4 text-center text-sm border border-gray-300 rounded-lg cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:bg-gray-50 transition-colors"
                >
                  Doctor
                </label>
              </div>
            </div>
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
              placeholder="Create a password"
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="passwordConfirm"
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Confirm your password"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            Create Account
          </button>
        </form>

        {userType === 'patient' && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-white/80 text-gray-500">Or sign up with</span>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                className="w-full inline-flex justify-center py-2 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="#000000">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <path d="M12 5c-3.87 0-7 3.13-7 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                  <path d="M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
