import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './UIComponents';
import Dashboard from './Dashboard';
import { LoadingState } from './LoadingState';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Fade,
  Flip,
  Slide,
  Zoom,
  Bounce,
  Roll,
  LightSpeed,
  JackInTheBox,
  Rotate
} from 'react-awesome-reveal';

const ProfileView = () => {
  const { currentUser, getUserType } = useAuth();

  // Editable fields state
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load saved profile data from Firestore on mount
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

  const userType = getUserType ? getUserType() : (currentUser?.providerData[0]?.providerId === 'google.com' ? 'Google User' : 'User');

  async function handleSave(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        fullName,
        dob,
        gender,
        email: currentUser.email,
        photoURL: currentUser.photoURL || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setEditMode(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Firestore save error:', err);
      alert('Failed to save profile: ' + (err.message || err.code || err));
    }
    setSaving(false);
  }

  if (loading) {
    return <LoadingState title="Loading Profile" description="Retrieving your information..." />;
  }

  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto mt-8 p-4">
        <Fade triggerOnce>
          <Card className="p-8 text-center bg-gradient-to-br from-white to-blue-50 shadow-xl rounded-2xl border-0">
            <div className="text-yellow-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to view your profile</p>
          </Card>
        </Fade>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      {/* Success Message */}
      {saveSuccess && (
        <Bounce triggerOnce>
          <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="font-medium">Profile updated successfully!</span>
            </div>
          </div>
        </Bounce>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card - Left Side */}
        <div className="lg:col-span-1">
          <Slide direction="left" triggerOnce>
            <Card className="p-6 flex flex-col items-center text-center h-full bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-xl rounded-2xl border-0 transform transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="mb-6 relative">
                {currentUser.photoURL ? (
                  <Zoom triggerOnce>
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg mx-auto" 
                    />
                  </Zoom>
                ) : (
                  <Flip triggerOnce>
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-5xl text-white font-bold mx-auto shadow-lg">
                      <span>{fullName ? fullName[0].toUpperCase() : (currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U')}</span>
                    </div>
                  </Flip>
                )}
                
                {/* Online Status Indicator */}
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <Fade triggerOnce delay={200}>
                <h2 className="text-2xl font-bold mb-1 text-blue-800">
                  {fullName || currentUser.displayName || 'User'}
                </h2>
              </Fade>
              
              <div className="w-full mb-6">
                <p className="text-gray-600 mb-2 truncate" title={currentUser.email}>
                  {currentUser.email}
                </p>
                <Bounce triggerOnce delay={300}>
                  <div className="inline-block bg-gradient-to-r from-blue-400 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold mt-2 shadow-md">
                    {userType}
                  </div>
                </Bounce>
              </div>
              
              <div className="w-full text-left mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-blue-700">Personal Information</h3>
                  <button
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium transition-all transform hover:scale-105"
                    onClick={() => setEditMode((v) => !v)}
                  >
                    {editMode ? (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Cancel
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit
                      </span>
                    )}
                  </button>
                </div>
                
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    {editMode ? (
                      <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)} 
                      />
                    ) : (
                      <p className="text-gray-900 bg-blue-50 p-2 rounded-lg">{fullName || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    {editMode ? (
                      <input 
                        type="date" 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                        value={dob} 
                        onChange={e => setDob(e.target.value)} 
                      />
                    ) : (
                      <p className="text-gray-900 bg-blue-50 p-2 rounded-lg">{dob || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    {editMode ? (
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
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
                      <p className="text-gray-900 bg-blue-50 p-2 rounded-lg">{gender || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <p className="text-gray-900 bg-blue-50 p-2 rounded-lg">{currentUser.email}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Member since</span>
                      <span className="font-medium">
                        {currentUser.metadata.creationTime 
                          ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                          : 'Recently'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {editMode && (
                    <div className="pt-4 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={saving} 
                        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-60 flex items-center"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </Card>
          </Slide>
        </div>

        {/* Dashboard - Right Side (2/3 width) */}
        <div className="lg:col-span-2">
          <Slide direction="right" triggerOnce delay={200}>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-0">
              <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-2 rounded-lg mr-4 shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Health Dashboard</h2>
                  <p className="text-sm text-gray-600">Your health insights and metrics</p>
                </div>
              </div>
              <Dashboard />
            </div>
          </Slide>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;