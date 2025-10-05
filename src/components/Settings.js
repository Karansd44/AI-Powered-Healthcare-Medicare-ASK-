import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { LoadingState } from './LoadingState';

const Settings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    theme: 'blue', // blue, green, purple, pink
    notifications: {
      emailReminders: true,
      medicationAlerts: true,
      appointmentReminders: true,
      healthTips: false
    },
    dashboard: {
      showWelcomeMessage: true,
      compactView: false,
      defaultTab: 'overview' // overview, history, symptoms
    },
    privacy: {
      shareDataForResearch: false,
      anonymousAnalytics: true
    }
  });

  // Load user preferences on component mount
  useEffect(() => {
    async function fetchPreferences() {
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const userData = snap.data();
          if (userData.preferences) {
            setPreferences(prev => ({
              ...prev,
              ...userData.preferences
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPreferences();
  }, [currentUser]);

  // Save preferences to Firestore
  const savePreferences = async () => {
    if (!currentUser) return;
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await setDoc(docRef, { preferences }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle preference updates
  const updatePreference = (category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // Handle theme change
  const updateTheme = (newTheme) => {
    setPreferences(prev => ({
      ...prev,
      theme: newTheme
    }));
  };

  const themeOptions = [
    { value: 'blue', name: 'Ocean Blue', colors: 'from-blue-400 to-blue-600' },
    { value: 'green', name: 'Forest Green', colors: 'from-green-400 to-green-600' },
    { value: 'purple', name: 'Royal Purple', colors: 'from-purple-400 to-purple-600' },
    { value: 'pink', name: 'Soft Pink', colors: 'from-pink-400 to-pink-600' }
  ];

  if (loading) {
    return <LoadingState title="Loading Settings" description="Retrieving your preferences..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings & Preferences</h1>
          <p className="text-gray-600">Customize your health app experience</p>
        </motion.div>

        {/* Success Message */}
        {saveSuccess && (
          <motion.div 
            className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-700 font-medium">Settings saved successfully!</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme Preferences */}
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Theme & Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
              <div className="grid grid-cols-2 gap-3">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => updateTheme(theme.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.theme === theme.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-8 bg-gradient-to-r ${theme.colors} rounded-md mb-2`}></div>
                    <span className="text-sm font-medium text-gray-700">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Notification Preferences */}
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
            </div>

            <div className="space-y-4">
              {Object.entries(preferences.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <button
                    onClick={() => updatePreference('notifications', key, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Dashboard Preferences */}
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Show Welcome Message</label>
                <button
                  onClick={() => updatePreference('dashboard', 'showWelcomeMessage', !preferences.dashboard.showWelcomeMessage)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.dashboard.showWelcomeMessage ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.dashboard.showWelcomeMessage ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Compact View</label>
                <button
                  onClick={() => updatePreference('dashboard', 'compactView', !preferences.dashboard.compactView)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.dashboard.compactView ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.dashboard.compactView ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Tab</label>
                <select
                  value={preferences.dashboard.defaultTab}
                  onChange={(e) => updatePreference('dashboard', 'defaultTab', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="overview">Overview</option>
                  <option value="history">Health History</option>
                  <option value="symptoms">Symptom Analysis</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Privacy Preferences */}
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Privacy & Data</h2>
            </div>

            <div className="space-y-4">
              {Object.entries(preferences.privacy).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <button
                    onClick={() => updatePreference('privacy', key, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div 
          className="mt-8 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={savePreferences}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              'Save Preferences'
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;