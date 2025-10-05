import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, useNavigate, NavLink, Navigate } from 'react-router-dom';
import Welcome from './components/Welcome';
import Dashboard from './components/Dashboard';
import SymptomInput from './components/SymptomInput';
import ResultsDisplay from './components/ResultsDisplay';
import ProfileView from './components/ProfileView';
import HealthHistory from './components/HealthHistory';
import Settings from './components/Settings';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Grid Icon for Dashboard in Navbar
const GridIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
  </svg>
);

// History Icon for Navbar
const HistoryIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// SVG Icons for Navigation
const HomeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const AnalysisIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ResultsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PhoneIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SettingsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Heart Symbol Component for Center of Page
const FloatingHeart = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ 
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="text-pink-300/30"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-64 w-64" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </motion.div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

function MediMindAppContent() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [symptomText, setSymptomText] = useState('');
  const [matchedSymptoms, setMatchedSymptoms] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  const [showHeart, setShowHeart] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    if (window.location.pathname === '/') {
      document.title = 'NLP Based Health Analysis';
      setShowHeart(true);
    } else {
      document.title = 'MediMind ASK';
      setShowHeart(false);
    }
  }, [window.location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
    }
    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleStart = () => {
    if (currentUser) {
      navigate('/input');
    } else {
      navigate('/login');
    }
  };

  const handleSymptomSubmit = async (text) => {
    setIsAnalyzing(true);
    setSymptomText(text);
    // Simulate progress for a better UX
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    const prompt = `Act as a medical diagnostic AI. Analyze the following user-reported symptoms: "${text}". Based on your knowledge, identify the top 3 most likely medical conditions. For each condition, provide:\n1.  "disease": The name of the condition.\n2.  "confidence": A confidence score (0-100).\n3.  "description": A brief description.\n4.  "recovery": An array of 4 recovery/management steps.\n5.  "matchedSymptoms": An array of the key symptoms from the user's text.\n6.  "severity": A severity score from 1 (mild) to 3 (severe/emergency).\n7.  "specialist": The type of medical specialist to consult (e.g., "Cardiologist", "Neurologist", "General Practitioner").\n\nReturn the response as a JSON object with a single key "predictions" which is an array of these objects.`;

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              "predictions": {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    "disease": { "type": "STRING" },
                    "confidence": { "type": "NUMBER" },
                    "description": { "type": "STRING" },
                    "recovery": {
                      "type": "ARRAY",
                      "items": { "type": "STRING" }
                    },
                    "matchedSymptoms": {
                      "type": "ARRAY",
                      "items": { "type": "STRING" }
                    },
                    "severity": { "type": "NUMBER" },
                    "specialist": { "type": "STRING" }
                  }
                }
              }
            }
          }
        }
      };
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY_ALT
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      let predictionsToStore = [];
      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonText = result.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(jsonText);
        setPredictions(parsedJson.predictions || []);
        setMatchedSymptoms(parsedJson.predictions[0]?.matchedSymptoms || [text]);
        predictionsToStore = parsedJson.predictions || [];
      } else {
        setPredictions([]);
        setMatchedSymptoms([]);
      }

      // Store analysis in Firestore for the logged-in user
      try {
        if (currentUser && predictionsToStore.length > 0) {
          // Lazy import Firestore functions
          const { db } = await import('./firebase');
          const { doc, updateDoc, arrayUnion, setDoc, getDoc } = await import('firebase/firestore');
          const userDocRef = doc(db, 'users', currentUser.uid);
          // Check if previousAnalyses exists, if not, create it
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            await setDoc(userDocRef, { previousAnalyses: [] }, { merge: true });
          }
          // Add a new analysis entry
          await updateDoc(userDocRef, {
            previousAnalyses: arrayUnion({
              timestamp: new Date().toISOString(),
              symptoms: text,
              predictions: predictionsToStore
            })
          });
        }
      } catch (firestoreErr) {
        console.error('Failed to store analysis in Firestore:', firestoreErr);
      }

    } catch (error) {
      console.error("Error analyzing symptoms:", error);
      setPredictions([]);
      setMatchedSymptoms([]);
    } finally {
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setTimeout(() => {
        setIsAnalyzing(false);
        setHasResults(true);
        navigate('/results');
        setAnalysisProgress(0);
      }, 500);
    }
  };

  const handleReset = () => {
    setSymptomText('');
    setMatchedSymptoms([]);
    setPredictions([]);
    setHasResults(false);
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      window.location.reload(); // Force refresh to clear all state
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Navigation component
  const Navigation = () => {
    const { currentUser, getUserType } = useAuth();
    const userType = getUserType();
    
    const getDashboardLabel = () => {
      if (userType === 'doctor') {
        return 'Doctor Dashboard';
      } else if (userType === 'patient') {
        return 'Patient Dashboard';
      }
      return 'Dashboard'; // fallback
    };

    const getDashboardIcon = () => {
      if (userType === 'doctor') {
        // Medical cross icon for doctors
        return (
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      } else if (userType === 'patient') {
        // User icon for patients
        return (
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      }
      return <GridIcon className="h-4 w-4 mr-1" />; // fallback
    };

    return (
    <nav className="bg-white/60 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="text-xl font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center"
            >
              <HeartbeatIcon className="h-6 w-6 mr-2 text-blue-500" />
              MediMind ASK
            </button>
          </div>
          <div className="flex space-x-2 items-center">
            <NavLink
              to="/"
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                }`
              }
            >
              <HomeIcon className="h-4 w-4 mr-1" />
              Home
            </NavLink>
            
            {currentUser ? (
              <>
                <NavLink
                  to="/input"
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                    }`
                  }
                >
                  <AnalysisIcon className="h-4 w-4 mr-1" />
                  Analysis
                </NavLink>
                {hasResults && (
                  <NavLink
                    to="/results"
                    className={({ isActive }) => 
                      `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                      }`
                    }
                  >
                    <ResultsIcon className="h-4 w-4 mr-1" />
                    Results
                  </NavLink>
                )}
                <NavLink
                  to="/health-history"
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                      isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                    }`
                  }
                  title="Health History"
                >
                  <HistoryIcon className="h-4 w-4 mr-1" />
                  History
                </NavLink>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                    }`
                  }
                >
                  {getDashboardIcon()}
                  {getDashboardLabel()}
                </NavLink>
                
                <div className="flex items-center ml-4 pl-4 border-l border-gray-200 relative">
                  <button
                    className="flex items-center px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition relative"
                    onClick={() => setShowProfileDropdown((prev) => !prev)}
                    aria-haspopup="true"
                    aria-expanded={showProfileDropdown}
                  >
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <UserIcon className="h-8 w-8 text-gray-700" />
                    )}
                  </button>
                  {showProfileDropdown && (
                    <div
                      ref={profileDropdownRef}
                      className="absolute left-0 top-full mt-2 min-w-[220px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-2 px-2"
                    >
                      {/* Dropdown header with avatar, name, and email */}
                      <div className="flex flex-col items-center px-4 py-3 border-b border-gray-100 mb-2">
                        {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="Profile" className="h-12 w-12 rounded-full object-cover border border-gray-300 mb-2" />
                        ) : (
                          <UserIcon className="h-12 w-12 text-gray-400 mb-2" />
                        )}
                        <span className="font-semibold text-gray-800 text-base">{currentUser.displayName || 'User'}</span>
                        <span className="text-xs text-gray-500">{currentUser.email}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate('/profile');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors duration-150"
                        >
                          <UserIcon className="h-5 w-5" />
                          Profile View
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors duration-150"
                        >
                          <SettingsIcon className="h-5 w-5" />
                          Settings
                        </button>
                        <div className="my-1 border-t border-gray-100" />
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors duration-150"
                        >
                          <LogoutIcon className="h-5 w-5" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                    }`
                  }
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  Login
                </NavLink>
                {/* Register button removed as requested */}
              </>
            )}
            
            <a
              href="tel:112"
              className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow flex items-center gap-2 transition-colors duration-200"
              title="Emergency Call"
            >
              <PhoneIcon className="h-5 w-5" />
              Emergency
            </a>
          </div>
        </div>
      </div>
    </nav>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.5),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(220,252,231,0.5),_transparent_50%)] -z-10"></div>

      <Navigation />
      
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative">
        {showHeart && <FloatingHeart />}
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Welcome key="welcome" onStart={handleStart} />} />
            <Route path="/login" element={<Login key="login" />} />
            <Route path="/register" element={<Register key="register" />} />
            <Route path="/forgot-password" element={<ForgotPassword key="forgot-password" />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/settings" element={<Settings />} />
            <Route 
              path="/input" 
              element={
                <ProtectedRoute>
                  <SymptomInput key="input" onSubmit={handleSymptomSubmit} isAnalyzing={isAnalyzing} analysisProgress={analysisProgress} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results" 
              element={
                <ProtectedRoute>
                  <ResultsDisplay key="results" results={predictions} symptoms={matchedSymptoms} onReset={handleReset} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  {(() => {
                    const userType = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem(`userType_${currentUser?.uid}`)) || null;
                    if (userType === 'doctor') {
                      const DoctorDashboard = require('./components/DoctorDashboard').default;
                      return <DoctorDashboard key="doctor-dashboard" />;
                    }
                    return <Dashboard key="dashboard" />;
                  })()}
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient-dashboard/:patientId" 
              element={
                <ProtectedRoute>
                  {(() => {
                    const PatientDashboardView = require('./components/PatientDashboardView').default;
                    return <PatientDashboardView key="patient-dashboard-view" />;
                  })()}
                </ProtectedRoute>
              }
            />
            <Route 
              path="/health-history" 
              element={
                <ProtectedRoute>
                  <HealthHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/all-patient-records" 
              element={
                <ProtectedRoute>
                  {(() => {
                    const AllPatientRecords = require('./components/AllPatientRecords').default;
                    return <AllPatientRecords key="all-patient-records" />;
                  })()}
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      <footer className="text-center p-4 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} MediMind ASK. All Rights Reserved.
      </footer>
    </div>
  );
}

export default function MediMindApp() {
  return (
    <Router>
      <AuthProvider>
        <MediMindAppContent />
      </AuthProvider>
    </Router>
  );
}

// Heartbeat Icon for Logo
const HeartbeatIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);