import React, { useState, useEffect } from "react";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { LoadingState } from "./LoadingState";
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

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previousAnalyses, setPreviousAnalyses] = useState([]);
  const [analysisFilter, setAnalysisFilter] = useState('all');
  const [analysisSort, setAnalysisSort] = useState('date');
  const [activeTab, setActiveTab] = useState('overview');

  // Get personalized dashboard greeting
  const getPersonalizedGreeting = (userName) => {
    const hour = new Date().getHours();
    let timeGreeting = "";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";
    
    return `${timeGreeting}, ${userName}`;
  };

  // Get personalized health status message
  const getHealthStatusMessage = (analyses) => {
    if (!analyses || analyses.length === 0) {
      return "Ready to start your health journey? Let's analyze your first symptoms!";
    }
    
    const recentAnalysis = analyses[0];
    const daysSinceLastAnalysis = Math.floor((Date.now() - new Date(recentAnalysis.timestamp).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastAnalysis === 0) {
      return "You've been active today! Keep monitoring your health.";
    } else if (daysSinceLastAnalysis === 1) {
      return "It's been a day since your last check-in. How are you feeling?";
    } else if (daysSinceLastAnalysis <= 7) {
      return `It's been ${daysSinceLastAnalysis} days since your last analysis. Time for a health check?`;
    } else {
      return "Welcome back! It's been a while. Let's catch up on your health.";
    }
  };

  useEffect(() => {
    async function fetchDashboardData() {
      if (!currentUser) {
        setDashboardData(null);
        setPreviousAnalyses([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(docRef);
        let dashboardDetails = {};
        let analyses = [];
        if (snap.exists()) {
          const data = snap.data();
          dashboardDetails = data.dashboard || {};
          analyses = Array.isArray(data.previousAnalyses) ? data.previousAnalyses.slice().reverse() : [];
          // If user stored a fullName in their profile, prefer that for dashboard display
          if (data.fullName) {
            dashboardDetails.userData = dashboardDetails.userData || {};
            dashboardDetails.userData.name = data.fullName;
          }
        }
        
        // Calculate dashboard details
        let wellnessScore = 0;
        if (analyses.length > 0) {
          const confidences = analyses
            .map(entry => entry.predictions && entry.predictions[0]?.confidence)
            .filter(val => typeof val === 'number');
          if (confidences.length > 0) {
            wellnessScore = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
          }
        }
        
        const userData = {
          name: dashboardDetails.userData?.name || currentUser?.displayName || "User",
          totalChecks: analyses.length,
          wellnessScore,
          lastCheck: analyses[0]?.timestamp ? new Date(analyses[0].timestamp).toLocaleString() : "-"
        };
        
        // Weekly and monthly counts
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const weeklyCount = analyses.filter(entry => {
          if (!entry.timestamp) return false;
          const entryDate = new Date(entry.timestamp);
          return entryDate >= startOfWeek && entryDate <= now;
        }).length;
        
        const monthlyCount = analyses.filter(entry => {
          if (!entry.timestamp) return false;
          const entryDate = new Date(entry.timestamp);
          return entryDate >= startOfMonth && entryDate <= now;
        }).length;
        
        // Common symptoms
        let symptomCounts = {};
        analyses.slice(0, 4).forEach(entry => {
          let syms = Array.isArray(entry.predictions[0]?.matchedSymptoms)
            ? entry.predictions[0].matchedSymptoms
            : [entry.symptoms];
          syms.forEach(sym => {
            if (sym && typeof sym === 'string') {
              symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
            }
          });
        });
        
        const commonSymptoms = Object.entries(symptomCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([sym]) => sym)
          .slice(0, 6);
        
        // Store dashboard details in Firestore
        const { setDoc } = await import('firebase/firestore');
        await setDoc(docRef, {
          dashboard: {
            userData,
            recentAnalyses: analyses.slice(0, 4),
            weeklyCount,
            monthlyCount,
            commonSymptoms
          }
        }, { merge: true });
        
        setDashboardData({ userData, recentAnalyses: analyses.slice(0, 4), weeklyCount, monthlyCount, commonSymptoms });
        setPreviousAnalyses(analyses);
      } catch (err) {
        setError("Failed to load dashboard data");
        setDashboardData({});
        setPreviousAnalyses([]);
      }
      setLoading(false);
    }
    fetchDashboardData();
  }, [currentUser]);

  // Fallbacks for empty data
  let wellnessScore = 0;
  if (previousAnalyses.length > 0) {
    const confidences = previousAnalyses
      .map(entry => entry.predictions && entry.predictions[0]?.confidence)
      .filter(val => typeof val === 'number');
    if (confidences.length > 0) {
      wellnessScore = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
    }
  }
  
  const userData = dashboardData?.userData || {
    name: dashboardData?.userData?.name || currentUser?.displayName || "User",
    totalChecks: previousAnalyses.length,
    wellnessScore,
    lastCheck: previousAnalyses[0]?.timestamp ? new Date(previousAnalyses[0].timestamp).toLocaleString() : "-"
  };

  const getFilteredAndSortedAnalyses = () => {
    let analyses = previousAnalyses.map((entry, idx) => ({
      id: idx + 1,
      date: entry.timestamp ? new Date(entry.timestamp) : new Date(0),
      dateString: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '-',
      symptoms: Array.isArray(entry.predictions[0]?.matchedSymptoms) ? entry.predictions[0].matchedSymptoms : [entry.symptoms],
      prediction: entry.predictions[0]?.disease || '-',
      confidence: entry.predictions[0]?.confidence || '-',
      severity: entry.predictions[0]?.severity === 3 ? 'High' : entry.predictions[0]?.severity === 2 ? 'Medium' : 'Low',
      severityLevel: entry.predictions[0]?.severity || 0,
      specialist: entry.predictions[0]?.specialist || '-'
    }));

    // Apply filters
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    analyses = analyses.filter(analysis => {
      if (analysisFilter === 'recent') {
        return analysis.date >= oneWeekAgo;
      }
      return true;
    });

    // Apply sorting
    analyses.sort((a, b) => {
      if (analysisSort === 'date') {
        return b.date - a.date;
      }
      if (analysisSort === 'severity') {
        return b.severityLevel - a.severityLevel;
      }
      return 0;
    });

    return analyses.slice(0, 4);
  };

  const recentAnalyses = previousAnalyses.length > 0
    ? getFilteredAndSortedAnalyses()
    : dashboardData?.recentAnalyses || [];
  
  // Calculate weekly and monthly analysis counts
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Count analyses per day for the last 7 days
  const dailyCounts = Array(7).fill(0);
  previousAnalyses.forEach(entry => {
    if (!entry.timestamp) return;
    const entryDate = new Date(entry.timestamp);
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      if (
        entryDate.getFullYear() === day.getFullYear() &&
        entryDate.getMonth() === day.getMonth() &&
        entryDate.getDate() === day.getDate()
      ) {
        dailyCounts[i]++;
      }
    }
  });
  
  const weeklyCount = previousAnalyses.filter(entry => {
    if (!entry.timestamp) return false;
    const entryDate = new Date(entry.timestamp);
    return entryDate >= startOfWeek && entryDate <= now;
  }).length;
  
  const monthlyCount = previousAnalyses.filter(entry => {
    if (!entry.timestamp) return false;
    const entryDate = new Date(entry.timestamp);
    return entryDate >= startOfMonth && entryDate <= now;
  }).length;
  
  // Chart data for weekly frequency
  const weekLabels = Array(7).fill(0).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  });
  
  const weeklyChartData = {
    labels: weekLabels,
    datasets: [
      {
        label: 'Analyses',
        data: dailyCounts,
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 6,
        borderWidth: 0,
        hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
      },
    ],
  };
  
  const weeklyChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        precision: 0, 
        stepSize: 1,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    maintainAspectRatio: false
  };
  
  // Quick Actions - Removed Reminders button
  const quickActions = [
    { id: 1, icon: "🩺", label: "New Analysis", color: "from-blue-500 to-blue-600", onClick: () => navigate('/input') },
    { id: 2, icon: "📊", label: "Health History", color: "from-green-500 to-green-600", onClick: () => navigate('/health-history') },
    { id: 3, icon: "📝", label: "My Profile", color: "from-purple-500 to-purple-600", onClick: () => navigate('/profile') }
  ];
  
  // Generate Health Recommendations
  let recommendations = [];
  if (previousAnalyses.length > 0) {
    const recs = [];
    previousAnalyses.slice(0, 4).forEach(entry => {
      if (entry.predictions && Array.isArray(entry.predictions)) {
        entry.predictions.forEach(pred => {
          if (Array.isArray(pred.recovery)) {
            recs.push(...pred.recovery);
          }
        });
      }
    });
    recommendations = Array.from(new Set(recs)).slice(0, 5);
  }
  
  if (recommendations.length === 0) {
    recommendations = [
      "Stay hydrated - drink at least 8 glasses of water daily",
      "Maintain a consistent sleep schedule of 7-8 hours",
      "Practice stress-reduction techniques like meditation",
      "Include at least 30 minutes of physical activity in your daily routine",
      "Eat a balanced diet with plenty of fruits and vegetables"
    ];
  }

  // Generate Common Symptoms
  let symptomCounts = {};
  previousAnalyses.slice(0, 4).forEach(entry => {
    let syms = Array.isArray(entry.predictions[0]?.matchedSymptoms)
      ? entry.predictions[0].matchedSymptoms
      : [entry.symptoms];
    syms.forEach(sym => {
      if (sym && typeof sym === 'string') {
        symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
      }
    });
  });
  
  const commonSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([sym]) => sym)
    .slice(0, 6);

  if (loading) {
    return <LoadingState title="Loading Dashboard" description="Preparing your health insights..." />;
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 md:mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-transparent rounded-bl-full" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {userData.name && userData.name.length > 0 ? userData.name[0].toUpperCase() : 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Health Dashboard
                </h1>
                <p className="text-gray-600">{getPersonalizedGreeting(userData.name)}</p>
                <p className="text-sm text-blue-600 mt-1">{getHealthStatusMessage(previousAnalyses)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-blue-50/50 p-3 rounded-xl">
              <div className="relative">
                <svg className="w-12 h-12" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeDasharray={`${userData.wellnessScore}, 100`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-blue-600">
                  {userData.wellnessScore}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium">Wellness Score</p>
                <p className="text-xl font-bold text-blue-600">{userData.wellnessScore}<span className="text-sm text-gray-400">/100</span></p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Emergency Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg mb-6 md:mb-8 flex items-center justify-center gap-3 transition-all hover:shadow-xl"
          onClick={() => window.open('tel:112')}
        >
          <span className="text-2xl animate-pulse">🚨</span>
          <span className="text-lg">Emergency Assistance</span>
          <span className="text-2xl animate-pulse">🚨</span>
        </motion.button>

        {/* Quick Actions Grid - Now 3 items instead of 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative overflow-hidden bg-gradient-to-br ${action.color} text-white p-4 md:p-5 rounded-2xl shadow-md flex flex-col items-center gap-3 transition-all hover:shadow-lg`}
              onClick={action.onClick}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-2xl md:text-3xl transform group-hover:scale-110 transition-transform">{action.icon}</span>
              <span className="font-semibold text-xs md:text-sm uppercase tracking-wider text-center">{action.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Stats & Wellness */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Stats Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-md p-5 md:p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-blue-100/40 to-transparent rounded-bl-full" />
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="bg-blue-100 p-2 rounded-lg">
                  <span className="text-blue-600">📊</span>
                </span>
                Your Health Stats
              </h2>
              
              <div className="space-y-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 flex items-center justify-between border border-blue-100"
                >
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Analyses</p>
                    <p className="text-2xl font-bold text-gray-800">{userData.totalChecks}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded" />
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 flex items-center justify-between border border-green-100"
                >
                  <div>
                    <p className="text-sm text-green-600 font-medium">Last Check</p>
                    <p className="text-sm md:text-base font-bold text-gray-800">{userData.lastCheck}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-green-500 to-green-600 rounded" />
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 flex items-center justify-between border border-purple-100"
                >
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Weekly Checks</p>
                    <p className="text-2xl font-bold text-gray-800">{weeklyCount}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded" />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Weekly Wellness & Frequency */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-md p-5 md:p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-indigo-100 p-2 rounded-lg">
                  <span className="text-indigo-600">📈</span>
                </span>
                Weekly Analysis Frequency
              </h2>
              
              <div className="w-full h-48 md:h-56 mb-4">
                <Bar data={weeklyChartData} options={weeklyChartOptions} />
              </div>
              
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">This Week</p>
                  <p className="text-lg font-bold text-blue-600">{weeklyCount}</p>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div>
                  <p className="text-xs text-gray-500">This Month</p>
                  <p className="text-lg font-bold text-blue-600">{monthlyCount}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Middle Column - Recent Analyses */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-md p-5 md:p-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-3">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-amber-100 p-2 rounded-lg">
                    <span className="text-amber-600">🩺</span>
                  </span>
                  Recent Health Analyses
                </h2>
                <button 
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => navigate('/health-history')}
                >
                  <span>View All</span>
                  <span>→</span>
                </button>
              </div>

              {/* Filter and Sort Controls */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filter Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Analyses</label>
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAnalysisFilter('all')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                          ${analysisFilter === 'all' 
                            ? 'bg-blue-100 text-blue-700 shadow-inner' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
                      >
                        <span>All Records</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAnalysisFilter('recent')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                          ${analysisFilter === 'recent' 
                            ? 'bg-blue-100 text-blue-700 shadow-inner' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
                      >
                        <span>Last Week</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAnalysisSort('date')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                          ${analysisSort === 'date' 
                            ? 'bg-blue-100 text-blue-700 shadow-inner' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
                      >
                        <span>Most Recent</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAnalysisSort('severity')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                          ${analysisSort === 'severity' 
                            ? 'bg-blue-100 text-blue-700 shadow-inner' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
                      >
                        <span>Severity</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {recentAnalyses.length > 0 ? (
                  recentAnalyses.map((analysis, index) => (
                    <motion.div
                      key={analysis.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer bg-white"
                      onClick={() => navigate(`/health-history?record=${analysis.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg text-gray-800">{analysis.prediction}</h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                analysis.severity === "High"
                                  ? "bg-red-100 text-red-800"
                                  : analysis.severity === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {analysis.severity}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                            <span>🕒</span>
                            <span>{analysis.dateString}</span>
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {analysis.symptoms.slice(0, 3).map((symptom, index) => (
                              <motion.span
                                key={index}
                                whileHover={{ scale: 1.05 }}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                              >
                                {symptom}
                              </motion.span>
                            ))}
                            {analysis.symptoms.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{analysis.symptoms.length - 3} more
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              Confidence: <strong className="text-blue-600">{analysis.confidence}%</strong>
                            </span>
                            <span className="text-gray-600">
                              Specialist: <strong className="text-purple-600">{analysis.specialist}</strong>
                            </span>
                          </div>
                        </div>
                        
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 ml-4"
                          onClick={e => { e.stopPropagation(); navigate(`/health-history?record=${analysis.id}`); }}
                        >
                          <span>View</span>
                          <span>→</span>
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-blue-500">📝</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No analyses yet</h3>
                    <p className="text-gray-500 mb-4">Start your first health analysis to see your data here</p>
                    <button 
                      onClick={() => navigate('/input')}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      New Analysis
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recommendations Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 md:p-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="bg-white/20 p-2 rounded-lg">💡</span>
              Health Recommendations
            </h2>
            
            <div className="grid gap-3">
              {recommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors flex items-start gap-3"
                >
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-sm font-medium">{recommendation}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Common Symptoms */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white rounded-2xl shadow-md p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full opacity-50" />
          
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
            <span className="bg-purple-100 p-2 rounded-lg">
              <span className="text-purple-600">🔍</span>
            </span>
            Your Common Symptoms
          </h2>
          
          <div className="flex flex-wrap gap-3">
            {commonSymptoms.length === 0 ? (
              <div className="w-full text-center py-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500">No common symptoms recorded yet.</span>
              </div>
            ) : (
              commonSymptoms.map((symptom, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-gradient-to-br from-purple-50 to-blue-50 text-gray-800 rounded-xl text-sm font-medium 
                    hover:shadow-md transition-all border border-gray-100 flex items-center gap-2"
                >
                  <span className="text-purple-500">•</span>
                  {symptom}
                </motion.span>
              ))
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-gray-600 text-sm py-4"
        >
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-2">© {new Date().getFullYear()} Health Dashboard - Your wellness companion</p>
        </motion.footer>
      </div>
    </div>
  );
}