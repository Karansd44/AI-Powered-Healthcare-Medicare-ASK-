import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const DoctorDashboard = () => {
  // Sort and filter state for Recent Patient Analyses
  const [sortOption, setSortOption] = useState('time');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { currentUser, getUserType } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [uniquePatients, setUniquePatients] = useState([]);

  // Navigation helper functions
  const navigateToPatientDashboard = useCallback((patientId) => {
    if (!patientId) {
      console.error('Invalid patient ID');
      return;
    }
    try {
      navigate(`/patient-dashboard/${patientId}`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigate]);

  const navigateToAllPatientRecords = useCallback(() => {
    try {
      navigate('/all-patient-records');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigate]);
  
  // Get personalized doctor greeting
  const getPersonalizedDoctorGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";
    
    const doctorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Doctor';
    return `${timeGreeting}, Dr. ${doctorName}`;
  };

  // Get personalized activity message for doctor
  const getDoctorActivityMessage = () => {
    const { totalPatients, pendingReviews, criticalCases } = statsData;
    
    if (criticalCases > 0) {
      return `You have ${criticalCases} critical case${criticalCases > 1 ? 's' : ''} requiring immediate attention.`;
    } else if (pendingReviews > 0) {
      return `${pendingReviews} patient analysis${pendingReviews > 1 ? 'es' : ''} await${pendingReviews === 1 ? 's' : ''} your review.`;
    } else if (totalPatients > 0) {
      return `Your practice is running smoothly with ${totalPatients} patient${totalPatients > 1 ? 's' : ''} under care.`;
    } else {
      return "Welcome to your medical practice dashboard. Ready to help patients today!";
    }
  };
  
  // Fetch data with proper error handling
  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    
    // Validate user type
    const userType = getUserType();
    if (userType !== 'doctor') {
      setError('Access denied. This dashboard is for doctors only.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch users and their analyses
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      
      if (usersSnap.empty) {
        console.warn('No users found in database');
        setRecentAnalyses([]);
        setUniquePatients([]);
        setStatsData({
          totalPatients: 0,
          newPatients: 0,
          prevNewPatients: 0,
          pendingReviews: 0,
          moderateReviews: 0,
          severeReviews: 0,
          criticalCases: 0
        });
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7*24*60*60*1000);
      const prevWeek = new Date(now.getTime() - 14*24*60*60*1000);
      
      let totalPatients = 0;
      let newPatients = 0;
      let prevNewPatients = 0;
      let pendingReviews = 0;
      let moderateReviews = 0;
      let severeReviews = 0;
      let criticalCases = 0;
      let analyses = [];
      let patients = [];

      for (const docSnap of usersSnap.docs) {
        const data = docSnap.data();
        
        // Only process patient data, not doctor data
        if (data.userType !== 'doctor') {
          totalPatients++;
          
          // Add to patients list
          patients.push({
            id: docSnap.id,
            name: data.fullName || data.email?.split('@')[0] || 'Unknown Patient',
            email: data.email || 'No email',
            createdAt: data.createdAt || null
          });

          // Calculate new patients
          if (data.createdAt) {
            const created = new Date(data.createdAt);
            if (created > lastWeek) newPatients++;
            if (created > prevWeek && created <= lastWeek) prevNewPatients++;
          }

          // Process patient analyses
          if (Array.isArray(data.previousAnalyses)) {
            data.previousAnalyses.forEach((analysis, idx) => {
              if (!analysis || !analysis.predictions) return;
              
              const prediction = analysis.predictions[0];
              if (!prediction) return;

              const severity = prediction.severity;
              const severityText = severity === 3 ? 'Severe' : 
                                 severity === 2 ? 'Moderate' : 'Mild';

              // Count reviews by severity
              if (severity === 3) {
                severeReviews++;
                criticalCases++;
              } else if (severity === 2) {
                moderateReviews++;
              }
              
              pendingReviews++;

              // Add to analyses array
              analyses.push({
                id: `${docSnap.id}_${idx}`,
                patient: data.fullName || data.email?.split('@')[0] || 'Unknown Patient',
                condition: prediction.disease || 'Unknown Condition',
                severity: severityText,
                time: analysis.timestamp ? 
                      new Date(analysis.timestamp).toLocaleString() : 
                      'Unknown Time',
                status: analysis.status || 'Needs Review',
                patientId: docSnap.id
              });
            });
          }
        }
      }

      // Sort analyses by timestamp (newest first)
      analyses.sort((a, b) => {
        const timeA = a.time !== 'Unknown Time' ? new Date(a.time) : new Date(0);
        const timeB = b.time !== 'Unknown Time' ? new Date(b.time) : new Date(0);
        return timeB - timeA;
      });

      setRecentAnalyses(analyses);
      setUniquePatients(patients);
      setStatsData({
        totalPatients,
        newPatients,
        prevNewPatients,
        pendingReviews,
        moderateReviews,
        severeReviews,
        criticalCases
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      
      // Set default empty state
      setRecentAnalyses([]);
      setUniquePatients([]);
      setStatsData({
        totalPatients: 0,
        newPatients: 0,
        prevNewPatients: 0,
        pendingReviews: 0,
        moderateReviews: 0,
        severeReviews: 0,
        criticalCases: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, getUserType]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Initialize state
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    newPatients: 0,
    prevNewPatients: 0,
    pendingReviews: 0,
    moderateReviews: 0,
    severeReviews: 0,
    criticalCases: 0
  });

  // Loading animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-5 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-wrap gap-4 mb-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex flex-col items-start">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </div>
                ))}
              </div>
              <div className="h-6 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
            </div>
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-60 animate-pulse"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar skeleton */}
          <div className="space-y-6">
            {/* Today's Patients skeleton */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-200 animate-pulse">
                <div className="h-5 bg-gray-300 rounded w-40"></div>
              </div>
              <div className="divide-y divide-gray-100">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="p-4">
                    <div className="h-5 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-60 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Cases skeleton */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-200 animate-pulse">
                <div className="h-5 bg-gray-300 rounded w-40"></div>
              </div>
              <div className="divide-y divide-gray-100">
                {[1, 2].map((item) => (
                  <div key={item} className="p-4">
                    <div className="h-5 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 14.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchDashboardData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Auth check
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the doctor dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Doctor Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            {getPersonalizedDoctorGreeting()}!
            <br className="hidden sm:block" />
            <span className="block sm:inline text-blue-600 font-medium">{getDoctorActivityMessage()}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-md animate-scale-in">
          <img
            src={currentUser?.photoURL || 'https://placehold.co/48x48/E2E8F0/4A5568?text=Dr'}
            alt="Avatar"
            className="w-12 h-12 rounded-full border-2 border-blue-300 shadow"
          />
          <span className="font-semibold text-blue-700">{currentUser?.displayName?.split(' ')[0] || 'Doctor'}</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[
          { 
            title: "Total Patients", 
            value: statsData.totalPatients, 
            color: "blue", 
            icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
            change: statsData.totalPatients - statsData.prevNewPatients > 0 ? `+${statsData.totalPatients - statsData.prevNewPatients} from last week` : 'No change from last week'
          },
          { 
            title: "New Patients", 
            value: statsData.newPatients, 
            color: "green", 
            icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
            change: statsData.newPatients - statsData.prevNewPatients > 0 ? `+${statsData.newPatients - statsData.prevNewPatients} from last week` : 'No change from last week'
          },
          { 
            title: "Pending Reviews", 
            value: recentAnalyses.filter(a => a.status === 'Needs Review').length, 
            color: "yellow", 
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            change: statsData.pendingReviews > 0 ? 'Require your attention' : 'No pending reviews'
          },
          { 
            title: "Critical Cases", 
            value: statsData.criticalCases, 
            color: "red", 
            icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
            change: statsData.criticalCases > 0 ? 'Immediate attention needed' : 'No critical cases'
          }
        ].map((stat, index) => (
          <div 
            key={stat.title}
            className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-${stat.color}-500 transform transition-all hover:scale-105 hover:shadow-xl animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">{stat.title}</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stat.value}</p>
                {stat.title === "Pending Reviews" && (
                  <span className={`text-xs text-${stat.color}-700 font-semibold`}>Needs Review</span>
                )}
              </div>
              <div className={`bg-${stat.color}-100 p-2 sm:p-3 rounded-lg`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 sm:h-6 sm:w-6 text-${stat.color}-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 sm:mt-2">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Patient Analyses */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-100">
            {/* Sort and Filter Controls */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4">
              <div className="flex flex-col items-start">
                <label className="mb-1 text-xs font-semibold text-blue-700 tracking-wide">Sort by</label>
                <div className="relative w-full sm:w-40">
                  <select value={sortOption} onChange={e => setSortOption(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-sm font-medium text-blue-800 shadow-sm transition-all appearance-none focus:outline-none">
                    <option value="time">Time (Newest)</option>
                    <option value="severity">Severity</option>
                    <option value="patient">Patient Name</option>
                  </select>
                  <span className="absolute right-3 top-3 pointer-events-none text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start">
                <label className="mb-1 text-xs font-semibold text-yellow-700 tracking-wide">Filter by Severity</label>
                <div className="relative w-full sm:w-40">
                  <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-yellow-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 bg-white text-sm font-medium text-yellow-800 shadow-sm transition-all appearance-none focus:outline-none">
                    <option value="all">All</option>
                    <option value="Severe">Severe</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Mild">Mild</option>
                  </select>
                  <span className="absolute right-3 top-2 pointer-events-none text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start">
                <label className="mb-1 text-xs font-semibold text-purple-700 tracking-wide">Filter by Status</label>
                <div className="relative w-full sm:w-40">
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white text-sm font-medium text-purple-800 shadow-sm transition-all appearance-none focus:outline-none">
                    <option value="all">All</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Needs Follow-up">Needs Follow-up</option>
                  </select>
                  <span className="absolute right-3 top-2 pointer-events-none text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Recent Patient Analyses</h2>
            <p className="text-xs sm:text-sm text-gray-600">Latest symptom analyses requiring your review</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentAnalyses && recentAnalyses.length > 0 ? (
              recentAnalyses
                .filter(a => (filterSeverity === 'all' ? true : a.severity === filterSeverity))
                .filter(a => (filterStatus === 'all' ? true : a.status === filterStatus))
                .sort((a, b) => {
                  if (sortOption === 'time') {
                    const timeA = a.time !== 'Unknown Time' ? new Date(a.time) : new Date(0);
                    const timeB = b.time !== 'Unknown Time' ? new Date(b.time) : new Date(0);
                    return timeB - timeA;
                  } else if (sortOption === 'severity') {
                    const sevOrder = { 'Severe': 3, 'Moderate': 2, 'Mild': 1 };
                    return (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
                  } else if (sortOption === 'patient') {
                    return (a.patient || '').localeCompare(b.patient || '');
                  }
                  return 0;
                })
                .slice(0, 4)
                .map((analysis, index) => (
                <div 
                  key={analysis.id} 
                  className="p-3 sm:p-4 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                    <div className="w-full sm:w-auto">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900">{analysis.patient || 'Unknown Patient'}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{analysis.condition || 'Unknown Condition'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                        analysis.severity === 'Mild' ? 'bg-green-100 text-green-800' :
                        analysis.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {analysis.severity || 'Unknown'}
                      </span>
                      <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                        analysis.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                        analysis.status === 'Needs Follow-up' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {analysis.status || 'Needs Review'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">{analysis.time || 'Unknown Time'}</span>
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-all" onClick={() => {
                      const patientId = analysis.patientId || analysis.id.split('_')[0];
                      navigateToPatientDashboard(patientId);
                    }}>
                      View Details →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No patient analyses found</p>
                <p className="text-xs text-gray-400 mt-1">Patient data will appear here when available</p>
              </div>
            )}
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 text-center">
            <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-all hover:underline" onClick={navigateToAllPatientRecords}>
              View All Patient Records →
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Today's Patients */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-slide-in-right">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h2 className="text-sm sm:text-base font-semibold">Today's Patients</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {uniquePatients && uniquePatients.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <p className="text-xs sm:text-sm">No patients found</p>
                </div>
              ) : (
                  uniquePatients.slice(0, 4).map((patient, index) => (
                  <div 
                    key={patient.id || index} 
                    className="p-3 sm:p-4 hover:bg-blue-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm sm:text-base font-medium text-gray-900">{patient.name || 'Unknown Patient'}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{patient.email || 'No email'}</p>
                        <p className="text-xs text-gray-500">Joined: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Critical Cases Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-slide-in-right" style={{ animationDelay: '200ms' }}>
            <div className="p-3 sm:p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
              <h2 className="text-sm sm:text-base font-semibold">Critical Cases</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-64 sm:max-h-80 overflow-y-auto">
              {recentAnalyses && recentAnalyses.filter(analysis => analysis.severity === 'Severe').length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-gray-500">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs sm:text-sm">No critical cases</p>
                  <p className="text-xs text-gray-400 mt-1">All patients stable</p>
                </div>
              ) : (
                recentAnalyses
                  .filter(analysis => analysis.severity === 'Severe')
                  .slice(0, 4)
                  .map((analysis, index) => (
                    <div 
                      key={analysis.id} 
                      className="p-3 sm:p-4 hover:bg-red-50 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                        <div className="w-full sm:w-auto">
                          <h3 className="text-sm sm:text-base font-medium text-gray-900">{analysis.patient || 'Unknown Patient'}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">{analysis.condition || 'Unknown Condition'}</p>
                          <p className="text-xs text-red-600 font-medium">Severe Condition</p>
                        </div>
                        <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                          analysis.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                          analysis.status === 'Needs Follow-up' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {analysis.status || 'Needs Review'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">{analysis.time || 'Unknown Time'}</span>
                        <button 
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-all hover:underline" 
                          onClick={() => {
                            const patientId = analysis.patientId || analysis.id.split('_')[0];
                            navigateToPatientDashboard(patientId);
                          }}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
            {recentAnalyses && recentAnalyses.filter(analysis => analysis.severity === 'Severe').length > 4 && (
              <div className="p-3 sm:p-4 bg-gray-50 text-center">
                <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-all hover:underline">
                  View All Critical Cases →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;