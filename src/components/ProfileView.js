import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './UIComponents';
import Dashboard from './Dashboard';
import { LoadingState } from './LoadingState';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

const ProfileView = () => {
  const { currentUser, getUserType } = useAuth();

  // State management
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileStats, setProfileStats] = useState({
    totalAnalyses: 0,
    lastLogin: null,
    accountAge: 0,
    healthScore: 85
  });

  // Load profile data
  useEffect(() => {
    async function fetchProfile() {
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setFullName(data.fullName || currentUser.displayName || '');
          setDob(data.dob || '');
          setGender(data.gender || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setEmergencyContact(data.emergencyContact || '');
          setMedicalConditions(data.medicalConditions || '');
          setAllergies(data.allergies || '');
          
          // Calculate stats
          const analyses = data.previousAnalyses || [];
          const creationTime = new Date(currentUser.metadata.creationTime);
          const accountAge = Math.floor((Date.now() - creationTime.getTime()) / (1000 * 60 * 60 * 24));
          
          setProfileStats({
            totalAnalyses: analyses.length,
            lastLogin: new Date().toLocaleDateString(),
            accountAge,
            healthScore: Math.min(85 + analyses.length * 2, 100)
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (currentUser) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const userType = getUserType ? getUserType() : 'User';

  // Save profile changes
  async function handleSave(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        fullName,
        dob,
        gender,
        phone,
        address,
        emergencyContact,
        medicalConditions,
        allergies,
        email: currentUser.email,
        photoURL: currentUser.photoURL || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Firestore save error:', err);
      alert('Failed to save profile: ' + (err.message || err.code || err));
    }
    setSaving(false);
  }

  // Get personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";
    
    const name = fullName || currentUser?.displayName?.split(' ')[0] || 'there';
    return `${timeGreeting}, ${name}!`;
  };

  if (loading) {
    return <LoadingState title="Loading Profile" description="Retrieving your information..." />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your profile</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div 
            className="flex flex-col md:flex-row items-start md:items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl" 
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl text-white font-bold shadow-xl">
                    {fullName ? fullName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white"></div>
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {fullName || currentUser.displayName || 'User Profile'}
                </h1>
                <p className="text-lg text-gray-600 mb-2">{getGreeting()}</p>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {userType}
                  </span>
                  <span className="text-sm text-gray-500">
                    Member since {new Date(currentUser.metadata.creationTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6 md:mt-0">
              <button
                onClick={() => {
                  setEditMode(!editMode);
                  // If entering edit mode, switch to personal info tab
                  if (!editMode) {
                    setActiveTab('personal');
                  }
                }}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  editMode 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {editMode ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <motion.div 
          className="max-w-7xl mx-auto px-6 py-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 font-medium">Profile updated successfully!</span>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{profileStats.totalAnalyses}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Score</p>
                <p className="text-2xl font-bold text-green-600">{profileStats.healthScore}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Login</p>
                <p className="text-2xl font-bold text-gray-900">Today</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Account Age</p>
                <p className="text-2xl font-bold text-gray-900">{profileStats.accountAge}d</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '👤' },
                { id: 'personal', name: 'Personal Info', icon: '📋' },
                { id: 'medical', name: 'Medical Info', icon: '🏥' },
                { id: 'dashboard', name: 'Health Dashboard', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                  {/* Show edit indicator on Personal Info tab when in edit mode */}
                  {tab.id === 'personal' && editMode && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Account Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Full Name:</span>
                        <span className="font-medium">{fullName || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Email:</span>
                        <span className="font-medium">{currentUser.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Account Type:</span>
                        <span className="font-medium">{userType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Status:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="font-medium">New Health Analysis</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-medium">View History</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <span className="font-medium">Settings</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'personal' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Add a helpful message when entering edit mode */}
                {editMode && (
                  <motion.div 
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center space-x-3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-blue-800 font-medium">You're now in edit mode. Make your changes and click "Save Changes" when done.</span>
                  </motion.div>
                )}
                
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      {editMode ? (
                        <input 
                          type="text" 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                          value={fullName} 
                          onChange={e => setFullName(e.target.value)} 
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{fullName || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      {editMode ? (
                        <input 
                          type="date" 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                          value={dob} 
                          onChange={e => setDob(e.target.value)} 
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{dob || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      {editMode ? (
                        <select 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                          value={gender} 
                          onChange={e => setGender(e.target.value)}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{gender || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      {editMode ? (
                        <input 
                          type="tel" 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)} 
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{currentUser.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      {editMode ? (
                        <textarea 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-24 resize-none" 
                          value={address} 
                          onChange={e => setAddress(e.target.value)} 
                          placeholder="Enter your address"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{address || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                      {editMode ? (
                        <input 
                          type="text" 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                          value={emergencyContact} 
                          onChange={e => setEmergencyContact(e.target.value)} 
                          placeholder="Name and phone number"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{emergencyContact || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {editMode && (
                    <div className="md:col-span-2 flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button 
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving} 
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </motion.div>
            )}

            {activeTab === 'medical' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
                      {editMode ? (
                        <textarea 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-32 resize-none" 
                          value={medicalConditions} 
                          onChange={e => setMedicalConditions(e.target.value)} 
                          placeholder="List any medical conditions you have"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border h-32 overflow-y-auto">{medicalConditions || 'None reported'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                      {editMode ? (
                        <textarea 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-32 resize-none" 
                          value={allergies} 
                          onChange={e => setAllergies(e.target.value)} 
                          placeholder="List any allergies you have"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border h-32 overflow-y-auto">{allergies || 'None reported'}</p>
                      )}
                    </div>
                  </div>

                  {editMode && (
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button 
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving} 
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Dashboard />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileView;