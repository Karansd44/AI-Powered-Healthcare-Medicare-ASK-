import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Flip, 
  Fade, 
  Slide, 
  Zoom, 
  Bounce,
  Pulse,
  Roll,
  Rotate,
  LightSpeed,
  JackInTheBox,
  Hinge
} from 'react-awesome-reveal';

const DoctorDashboard = () => {
  // Sort and filter state for Recent Patient Analyses
  const [sortOption, setSortOption] = useState('time');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    newPatients: 0,
    prevNewPatients: 0,
    pendingReviews: 0,
    moderateReviews: 0,
    severeReviews: 0,
    criticalCases: 0
  });

  useEffect(() => {
    let unsubscribe;
    setIsLoading(true);
    (async () => {
      const { db } = await import('../firebase');
      const { collection, onSnapshot, getDocs } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      unsubscribe = onSnapshot(usersRef, async (usersSnap) => {
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
        
        for (const docSnap of usersSnap.docs) {
          const data = docSnap.data();
          if (data.userType !== 'doctor') {
            totalPatients++;
            const created = new Date(data.createdAt);
            if (created > lastWeek) newPatients++;
            if (created > prevWeek && created <= lastWeek) prevNewPatients++;
            // Fetch count from 'review' subcollection
            const reviewCol = collection(docSnap.ref, 'review');
            const reviewSnap = await getDocs(reviewCol);
            pendingReviews += reviewSnap.size;
            reviewSnap.forEach(reviewDoc => {
              const severity = reviewDoc.data().predictions?.[0]?.severity;
              if (severity === 3) severeReviews++;
              if (severity === 2) moderateReviews++;
            });
            // Count critical cases as before
            if (Array.isArray(data.previousAnalyses)) {
              data.previousAnalyses.forEach(analysis => {
                const severity = analysis.predictions?.[0]?.severity;
                if (severity === 3) {
                  criticalCases++;
                }
              });
            }
          }
        }
        setStatsData({ totalPatients, newPatients, prevNewPatients, pendingReviews, moderateReviews, severeReviews, criticalCases });
        setIsLoading(false);
      });
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    async function fetchRecentAnalyses() {
      try {
        const { db } = await import('../firebase');
        const { collection, getDocs } = await import('firebase/firestore');
        const usersSnap = await getDocs(collection(db, 'users'));
        let analyses = [];
        usersSnap.forEach(doc => {
          const data = doc.data();
          if (data.userType !== 'doctor' && Array.isArray(data.previousAnalyses)) {
            data.previousAnalyses.slice(-2).forEach((analysis, idx) => {
              analyses.push({
                id: `${doc.id}_${idx}`,
                patient: data.fullName || data.email || 'Unknown',
                condition: analysis.predictions?.[0]?.disease || 'Unknown',
                severity: analysis.predictions?.[0]?.severity === 3 ? 'Severe' : analysis.predictions?.[0]?.severity === 2 ? 'Moderate' : 'Mild',
                time: analysis.timestamp ? new Date(analysis.timestamp).toLocaleString() : 'Unknown',
                status: analysis.status || 'Needs Review'
              });
            });
          }
        });
        // Sort by time descending
        analyses.sort((a, b) => new Date(b.time) - new Date(a.time));
        setRecentAnalyses(analyses.slice(0, 10));
      } catch (err) {
        setRecentAnalyses([]);
      }
    }
    fetchRecentAnalyses();
  }, []);
  
  const [uniquePatients, setUniquePatients] = useState([]);

  useEffect(() => {
    async function fetchUniquePatients() {
      try {
        const { db } = await import('../firebase');
        const { collection, getDocs } = await import('firebase/firestore');
        const usersSnap = await getDocs(collection(db, 'users'));
        let patients = [];
        usersSnap.forEach(doc => {
          const data = doc.data();
          if (data.userType !== 'doctor') {
            patients.push({
              id: doc.id,
              name: data.fullName || data.email || 'Unknown',
              email: data.email,
              createdAt: data.createdAt,
              lastAnalysis: Array.isArray(data.previousAnalyses) && data.previousAnalyses.length > 0 ? data.previousAnalyses[data.previousAnalyses.length-1] : null
            });
          }
        });
        setUniquePatients(patients.slice(0, 5));
      } catch (err) {
        setUniquePatients([]);
      }
    }
    fetchUniquePatients();
  }, []);

  // Loading animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <Fade triggerOnce>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Doctor Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome, Dr. {currentUser?.displayName || currentUser?.email || 'User'}!
              <br />Here's an overview personalized for you.
            </p>
          </div>
          <Bounce triggerOnce>
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-md">
              <img
                src={currentUser?.photoURL || 'https://placehold.co/48x48/E2E8F0/4A5568?text=Dr'}
                alt="Avatar"
                className="w-12 h-12 rounded-full border-2 border-blue-300 shadow"
              />
              <span className="font-semibold text-blue-700">{currentUser?.displayName?.split(' ')[0] || 'Doctor'}</span>
            </div>
          </Bounce>
        </div>
      </Fade>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Flip triggerOnce>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Patients</h3>
                <p className="text-2xl font-bold text-gray-800">{statsData.totalPatients}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{statsData.totalPatients - statsData.prevNewPatients > 0 ? `+${statsData.totalPatients - statsData.prevNewPatients} from last week` : 'No change from last week'}</p>
          </div>
        </Flip>

        <Flip triggerOnce delay={100}>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-500">New Patients</h3>
                <p className="text-2xl font-bold text-gray-800">{statsData.newPatients}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{statsData.newPatients - statsData.prevNewPatients > 0 ? `+${statsData.newPatients - statsData.prevNewPatients} from last week` : 'No change from last week'}</p>
          </div>
        </Flip>

        <Flip triggerOnce delay={200}>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Pending Reviews</h3>
                <p className="text-2xl font-bold text-gray-800">{recentAnalyses.filter(a => a.status === 'Needs Review').length}</p>
                <span className="text-xs text-yellow-700 font-semibold">Needs Review</span>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{statsData.pendingReviews > 0 ? 'Require your attention' : 'No pending reviews'}</p>
          </div>
        </Flip>

        <Flip triggerOnce delay={300}>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Critical Cases</h3>
                <p className="text-2xl font-bold text-gray-800">{statsData.criticalCases}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{statsData.criticalCases > 0 ? 'Immediate attention needed' : 'No critical cases'}</p>
          </div>
        </Flip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patient Analyses */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
          <Slide triggerOnce>
            <div className="p-6 border-b border-gray-100">
              {/* Sort and Filter Controls */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex flex-col items-start">
                  <label className="mb-1 text-xs font-semibold text-blue-700 tracking-wide">Sort by</label>
                  <div className="relative w-40">
                    <select value={sortOption} onChange={e => setSortOption(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-sm font-medium text-blue-800 shadow-sm transition-all appearance-none transform focus:scale-105 focus:shadow-lg focus:outline-none duration-200 ease-in-out focus:bg-white focus:text-blue-800">
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
                  <div className="relative w-40">
                    <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-yellow-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 bg-white text-sm font-medium text-yellow-800 shadow-sm transition-all appearance-none transform focus:scale-105 focus:shadow-lg focus:outline-none duration-200 ease-in-out focus:bg-white focus:text-yellow-800">
                      <option value="all">All</option>
                      <option value="Severe">Severe</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Mild">Mild</option>
                    </select>
                    <span className="absolute right-3 top-3 pointer-events-none text-yellow-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <label className="mb-1 text-xs font-semibold text-purple-700 tracking-wide">Filter by Status</label>
                  <div className="relative w-40">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white text-sm font-medium text-purple-800 shadow-sm transition-all appearance-none transform focus:scale-105 focus:shadow-lg focus:outline-none duration-200 ease-in-out focus:bg-white focus:text-purple-800">
                      <option value="all">All</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Needs Review">Needs Review</option>
                      <option value="Needs Follow-up">Needs Follow-up</option>
                    </select>
                    <span className="absolute right-3 top-3 pointer-events-none text-purple-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Recent Patient Analyses</h2>
              <p className="text-sm text-gray-600">Latest symptom analyses requiring your review</p>
            </div>
          </Slide>
          
          <div className="divide-y divide-gray-100">
            {recentAnalyses
              .filter(a => (filterSeverity === 'all' ? true : a.severity === filterSeverity))
              .filter(a => (filterStatus === 'all' ? true : a.status === filterStatus))
              .sort((a, b) => {
                if (sortOption === 'time') {
                  return new Date(b.time) - new Date(a.time);
                } else if (sortOption === 'severity') {
                  const sevOrder = { 'Severe': 3, 'Moderate': 2, 'Mild': 1 };
                  return sevOrder[b.severity] - sevOrder[a.severity];
                } else if (sortOption === 'patient') {
                  return a.patient.localeCompare(b.patient);
                }
                return 0;
              })
              .slice(0, 4)
              .map((analysis, index) => (
              <Fade key={analysis.id} delay={index * 100} triggerOnce>
                <div className="p-4 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{analysis.patient}</h3>
                      <p className="text-sm text-gray-600">{analysis.condition}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analysis.severity === 'Mild' ? 'bg-green-100 text-green-800' :
                        analysis.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {analysis.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analysis.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                        analysis.status === 'Needs Follow-up' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {analysis.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">{analysis.time}</span>
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-all transform hover:translate-x-1" onClick={() => {
                      const patientId = analysis.id.split('_')[0];
                      window.location.href = `/patient-dashboard/${patientId}`;
                    }}>
                      View Details →
                    </button>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
          <div className="p-4 bg-gray-50 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-all transform hover:translate-x-1" onClick={() => window.location.href = '/all-patient-records'}>
              View All Patient Records →
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Today's Patients */}
          <Slide direction="right" triggerOnce>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <h2 className="font-semibold">Today's Patients</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {uniquePatients.length === 0 ? (
                  <div className="p-4 text-gray-500">No patients found.</div>
                ) : (
                    uniquePatients.slice(0, 4).map((patient, index) => (
                    <Zoom key={patient.id} delay={index * 100} triggerOnce>
                      <div className="p-4 hover:bg-blue-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{patient.name}</h3>
                            <p className="text-sm text-gray-600">{patient.email}</p>
                            <p className="text-xs text-gray-500">Joined: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Unknown'}</p>
                          </div>
                        </div>
                      </div>
                    </Zoom>
                  ))
                )}
              </div>
            </div>
          </Slide>

          {/* Critical Cases Section */}
          <Slide direction="right" triggerOnce delay={200}>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
                <h2 className="font-semibold">Critical Cases</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {recentAnalyses.filter(analysis => analysis.severity === 'Severe').length === 0 ? (
                  <div className="p-4 text-gray-500">No critical cases found.</div>
                ) : (
                  recentAnalyses
                    .filter(analysis => analysis.severity === 'Severe')
                    .slice(0, 4)
                    .map((analysis, index) => (
                      <JackInTheBox key={analysis.id} delay={index * 100} triggerOnce>
                        <div className="p-4 hover:bg-red-50 transition-all duration-300">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{analysis.patient}</h3>
                              <p className="text-sm text-gray-600">{analysis.condition}</p>
                              <p className="text-xs text-red-600 font-medium">Severe Condition</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              analysis.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                              analysis.status === 'Needs Follow-up' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {analysis.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">{analysis.time}</span>
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-all transform hover:translate-x-1" 
                              onClick={() => {
                                const patientId = analysis.id.split('_')[0];
                                window.location.href = `/patient-dashboard/${patientId}`;
                              }}
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </JackInTheBox>
                    ))
                )}
              </div>
              {recentAnalyses.filter(analysis => analysis.severity === 'Severe').length > 5 && (
                <div className="p-4 bg-gray-50 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-all transform hover:translate-x-1">
                    View All Critical Cases →
                  </button>
                </div>
              )}
            </div>
          </Slide>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;