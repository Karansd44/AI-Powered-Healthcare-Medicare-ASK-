import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getDocs, deleteDoc } from 'firebase/firestore';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PatientDashboardView = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCardIdx, setOpenCardIdx] = useState(null);
  const [showAllAnalyses, setShowAllAnalyses] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState({});
  const [editingNoteIdx, setEditingNoteIdx] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Add a function to refresh dashboard data
  const refreshDashboard = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', patientId));
      if (snap.exists()) {
        const data = snap.data();
        setPatientData({
          name: data.fullName || 'Patient',
          email: data.email,
          dob: data.dob,
          gender: data.gender
        });
        setDashboard(data.dashboard || null);
      }
    } catch (err) {
      console.error('Error refreshing patient data:', err);
    }
  };

  const handleEditClinicalNote = (idx) => {
    setEditingNoteIdx(idx);
    setEditingNoteText(clinicalNotes[idx] || '');
  };

  const handleSaveClinicalNote = (idx) => {
    setClinicalNotes(prev => ({ ...prev, [idx]: editingNoteText }));
    setEditingNoteIdx(null);
  };

  const handleDownloadPDF = (idx) => {
    const docPdf = new jsPDF();
    docPdf.setFont('courier');
    docPdf.setFontSize(12);
    docPdf.text(clinicalNotes[idx] || '', 10, 10, { maxWidth: 180 });
    const safeName = (patientData?.name || patientId).replace(/[^a-zA-Z0-9]/g, '_');
    docPdf.save(`clinical_note_${safeName}_${idx}.pdf`);
  };

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDoc(doc(db, 'users', patientId));
        if (snap.exists()) {
          const data = snap.data();
          setPatientData({
            name: data.fullName || 'Patient',
            email: data.email,
            dob: data.dob,
            gender: data.gender
          });
          setDashboard(data.dashboard || null);
        } else {
          setError('No patient data found.');
        }
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to fetch patient dashboard.');
      }
      setLoading(false);
    }
    fetchDashboard();
  }, [patientId]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 1: return 'Mild';
      case 2: return 'Moderate';
      case 3: return 'Severe';
      default: return 'Unknown';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 1:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 2:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M6.938 20h10.124c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L5.206 17c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 3:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };



  const generateClinicalNote = (analysis, patientInfo) => {
    if (!analysis || !analysis.predictions || !analysis.predictions[0]) return '';

    const prediction = analysis.predictions[0];
    const date = new Date(analysis.timestamp).toLocaleDateString();
    const severity = getSeverityText(prediction.severity);

    return `CLINICAL NOTE

PATIENT: ${patientInfo?.name || 'Unknown'}
DATE: ${date}
CONDITION: ${prediction.disease || 'Unknown'}
SEVERITY: ${severity}
CONFIDENCE LEVEL: ${prediction.confidence || 'N/A'}%

PRESENTING SYMPTOMS:
${prediction.matchedSymptoms ? prediction.matchedSymptoms.map(s => `- ${s}`).join('\n') : 'No symptoms reported'}

CLINICAL ASSESSMENT:
Patient presents with symptoms consistent with ${prediction.disease || 'a medical condition'}. 
Based on the reported symptoms and pattern recognition, this condition is assessed as ${severity.toLowerCase()} severity.

RECOMMENDATIONS:
${prediction.recovery ? prediction.recovery.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'No specific recommendations provided.'}

SPECIALIST REFERRAL: ${prediction.specialist || 'Not specified'}

FOLLOW-UP: Patient should monitor symptoms and follow up if condition worsens or does not improve within expected timeframe.
`;
  };

  const handleGenerateClinicalNote = async (analysis, index) => {
    const note = generateClinicalNote(analysis, patientData);
    setClinicalNotes(prev => ({ ...prev, [index]: note }));
    try {
      await updateDoc(doc(db, 'users', patientId), {
        clinicalNotes: arrayUnion({
          index,
          note,
          timestamp: new Date().toISOString(),
        })
      });
    } catch (err) {
      console.error('Error saving clinical note:', err);
    }
  };

  const handleCopyClinicalNote = (index) => {
    if (clinicalNotes[index]) {
      navigator.clipboard.writeText(clinicalNotes[index]);
      alert('Clinical note copied to clipboard!');
    }
  };

  const handleViewAllAnalyses = () => {
    navigate(`/patient/${patientId}/analyses`);
  };

  // Function to mark analysis as reviewed
  const markAsReviewed = async (analysis, idx) => {
    try {
      const userRef = doc(db, 'users', patientId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (Array.isArray(userData.previousAnalyses)) {
          // Create a copy of the analyses array
          const updatedAnalyses = [...userData.previousAnalyses];

          // Update the status of the specific analysis
          if (updatedAnalyses[idx]) {
            updatedAnalyses[idx] = {
              ...updatedAnalyses[idx],
              status: 'Reviewed'
            };

            // Update Firestore
            await updateDoc(userRef, {
              previousAnalyses: updatedAnalyses,
              pendingReview: true
            });

            // Also add to reviewed subcollection
            const { collection, addDoc } = await import('firebase/firestore');
            await addDoc(collection(userRef, 'reviewed'), {
              ...analysis,
              reviewedAt: new Date().toISOString(),
            });

            // Refresh the dashboard to show updated status
            await refreshDashboard();
          }
        }
      }
    } catch (err) {
      console.error('Error marking as reviewed:', err);
    }
  };

  // Function to mark analysis as unreviewed
  const markAsUnreviewed = async (analysis, idx) => {
    try {
      const userRef = doc(db, 'users', patientId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (Array.isArray(userData.previousAnalyses)) {
          // Create a copy of the analyses array
          const updatedAnalyses = [...userData.previousAnalyses];

          // Update the status of the specific analysis
          if (updatedAnalyses[idx]) {
            updatedAnalyses[idx] = {
              ...updatedAnalyses[idx],
              status: 'Unreviewed'
            };

            // Update Firestore
            await updateDoc(userRef, {
              previousAnalyses: updatedAnalyses,
              pendingReview: true
            });

            // Remove from reviewed subcollection
            const { collection, getDocs, deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
            const reviewedCol = collection(userRef, 'reviewed');
            const reviewedSnap = await getDocs(reviewedCol);

            reviewedSnap.forEach(async (docu) => {
              const data = docu.data();
              if (data.timestamp === analysis.timestamp) {
                await deleteDoc(firestoreDoc(reviewedCol, docu.id));
              }
            });

            // Refresh the dashboard to show updated status
            await refreshDashboard();
          }
        }
      }
    } catch (err) {
      console.error('Error marking as unreviewed:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-gray-500">Loading patient data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Patient Data</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No Dashboard Data Available</h3>
          <p className="text-yellow-600">This patient hasn't generated any health data yet.</p>
        </div>
      </div>
    );
  }

  // Get analyses to display (either all or limited)
  const analysesToShow = showAllAnalyses
    ? dashboard.recentAnalyses
    : (dashboard.recentAnalyses?.slice(0, 3) || []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Patient Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-800 mb-1">
              {patientData?.name || 'Patient'} Dashboard
            </h1>
            <p className="text-gray-600">Patient ID: {patientId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{patientData?.email}</p>
            {patientData?.dob && (
              <p className="text-sm text-gray-600">
                {patientData.dob} • {patientData.gender || 'Gender not specified'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Stats Card */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Health Statistics</h2>
          </div>
          <div className="space-y-3">
            {dashboard.userData && Object.entries(dashboard.userData).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span className="text-sm font-semibold text-blue-600">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Frequency Card */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Analysis Frequency</h2>
          </div>
          {/* Bar Chart for Analysis Frequency */}
          {dashboard.recentAnalyses && dashboard.recentAnalyses.length > 0 ? (
            (() => {
              // Prepare data for last 7 days
              const now = new Date();
              const days = Array(7).fill(0).map((_, i) => {
                const d = new Date(now);
                d.setDate(now.getDate() - (6 - i));
                return d;
              });
              const dayLabels = days.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
              const dayCounts = days.map(day => {
                return dashboard.recentAnalyses.filter(a => {
                  if (!a.timestamp) return false;
                  const ad = new Date(a.timestamp);
                  return ad.getFullYear() === day.getFullYear() && ad.getMonth() === day.getMonth() && ad.getDate() === day.getDate();
                }).length;
              });
              const chartData = {
                labels: dayLabels,
                datasets: [
                  {
                    label: 'Analyses',
                    data: dayCounts,
                    backgroundColor: 'rgba(34,197,94,0.6)',
                  },
                ],
              };
              const chartOptions = {
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                },
              };
              return <Bar data={chartData} options={chartOptions} height={180} />;
            })()
          ) : (
            <p className="text-gray-500 italic">No frequency data available</p>
          )}
        </div>

        {/* Common Symptoms Card */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-yellow-500 lg:col-span-2">
          <div className="flex items-center mb-4">
            <div className="bg-yellow-100 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Common Symptoms</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {dashboard.commonSymptoms && dashboard.commonSymptoms.length > 0 ? (
              dashboard.commonSymptoms.map((symptom, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                >
                  {symptom}
                </span>
              ))
            ) : (
              <p className="text-gray-500 italic">No common symptoms recorded</p>
            )}
          </div>
        </div>

        {/* Recent Analyses Card */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Recent Health Analyses</h2>
            </div>
            <span className="text-sm text-gray-500">{dashboard.recentAnalyses?.length || 0} records</span>
          </div>

          {dashboard.recentAnalyses && dashboard.recentAnalyses.length > 0 ? (
            <div className="space-y-4">
              {/* Sort analyses: Severe first, then Moderate, then Mild */}
              {analysesToShow
                .slice()
                .sort((a, b) => {
                  const sevA = a.predictions?.[0]?.severity || 0;
                  const sevB = b.predictions?.[0]?.severity || 0;
                  return sevB - sevA;
                })
                .map((analysis, idx) => {
                  const severity = analysis.predictions?.[0]?.severity || 0;
                  return (
                    <div key={idx} className={`border rounded-lg p-4 relative ${analysis.status === 'Reviewed' ? 'bg-gray-200 border-gray-400 text-gray-600' : getSeverityColor(severity)}`}>
                      {/* Patient Condition Label */}
                      <div className="mb-2">
                        <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${severity === 3 ? 'bg-red-600 text-white' : severity === 2 ? 'bg-yellow-400 text-gray-900' : severity === 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'
                          }`}>
                          Patient Condition: {getSeverityText(severity)}
                        </span>
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {getSeverityIcon(severity)}
                          </div>
                          <h3 className="font-medium text-gray-900">
                            {analysis.predictions?.[0]?.disease || 'Unknown Condition'}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(severity)}`}>
                            {getSeverityText(severity)}
                          </span>
                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {analysis.predictions?.[0]?.confidence || 'N/A'}% confidence
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {analysis.predictions?.[0]?.matchedSymptoms?.slice(0, 3).map((symptom, i) => (
                          <span key={i} className="text-xs bg-white bg-opacity-70 text-gray-700 px-2 py-1 rounded">
                            {symptom}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {analysis.status === 'Reviewed' ? (
                          <button
                            className="mt-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold rounded shadow transition-colors"
                            onClick={() => markAsUnreviewed(analysis, idx)}
                          >
                            Unreview
                          </button>
                        ) : (
                          <button
                            className={`mt-2 px-4 py-2 text-white text-xs font-semibold rounded shadow transition-colors ${severity === 3 ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                            onClick={async () => {
                              setOpenCardIdx(idx); // Show details modal
                              await markAsReviewed(analysis, idx); // Update status in Firebase
                            }}
                          >
                            Review
                          </button>
                        )}
                        <button
                          className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded shadow transition-colors"
                          onClick={() => handleGenerateClinicalNote(analysis, idx)}
                        >
                          Generate Clinical Note
                        </button>
                      </div>

                      {/* Enhanced Details Modal */}
                      {openCardIdx === idx && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-xl font-bold">Analysis Details</h3>
                                  <p className="text-blue-100 mt-1">
                                    {new Date(analysis.timestamp).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setOpenCardIdx(null)}
                                  className="text-white hover:text-blue-200 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                              {/* Condition Overview */}
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-800 mb-2">Primary Condition</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-bold text-blue-900">
                                    {analysis.predictions?.[0]?.disease || 'Unknown Condition'}
                                  </span>
                                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                    {analysis.predictions?.[0]?.confidence || 'N/A'}% confidence
                                  </span>
                                </div>
                              </div>

                              {/* Severity Indicator */}
                              {analysis.predictions?.[0]?.severity && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-2">Severity Assessment</h4>
                                  <div className={`px-4 py-3 rounded-lg font-medium flex items-center ${getSeverityColor(analysis.predictions[0].severity)}`}>
                                    {getSeverityIcon(analysis.predictions[0].severity)}
                                    <span className="ml-2">{getSeverityText(analysis.predictions[0].severity)} Condition</span>
                                  </div>
                                </div>
                              )}

                              {/* Symptoms */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Reported Symptoms</h4>
                                <div className="flex flex-wrap gap-2">
                                  {analysis.predictions?.[0]?.matchedSymptoms?.map((symptom, i) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                      {symptom}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Description */}
                              {analysis.predictions?.[0]?.description && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                                    {analysis.predictions[0].description}
                                  </p>
                                </div>
                              )}

                              {/* Specialist Recommendation */}
                              {analysis.predictions?.[0]?.specialist && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-2">Recommended Specialist</h4>
                                  <div className="bg-purple-50 text-purple-800 px-4 py-3 rounded-lg font-medium">
                                    {analysis.predictions[0].specialist}
                                  </div>
                                </div>
                              )}

                              {/* Recovery Steps */}
                              {analysis.predictions?.[0]?.recovery && analysis.predictions[0].recovery.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3">Recommended Recovery Steps</h4>
                                  <div className="space-y-2">
                                    {analysis.predictions[0].recovery.map((step, i) => (
                                      <div key={i} className="flex items-start">
                                        <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                                          {i + 1}
                                        </span>
                                        <p className="text-gray-700">{step}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Clinical Note Section */}
                              <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-semibold text-gray-800">Clinical Note</h4>
                                  {clinicalNotes[idx] && (
                                    <button
                                      onClick={() => handleCopyClinicalNote(idx)}
                                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded flex items-center"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Copy
                                    </button>
                                  )}
                                </div>
                                {clinicalNotes[idx] ? (
                                  editingNoteIdx === idx ? (
                                    <div>
                                      <textarea
                                        className="w-full p-2 rounded border border-gray-300 font-mono text-sm mb-2"
                                        rows={8}
                                        value={editingNoteText}
                                        onChange={e => setEditingNoteText(e.target.value)}
                                      />
                                      <div className="flex gap-2">
                                        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => handleSaveClinicalNote(idx)}>Save</button>
                                        <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded" onClick={() => setEditingNoteIdx(null)}>Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                                        {clinicalNotes[idx]}
                                      </div>
                                      <div className="flex gap-2 mt-2">
                                        <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => handleEditClinicalNote(idx)}>Edit</button>
                                        <button className="px-3 py-1 bg-green-600 text-white rounded flex items-center" onClick={() => handleDownloadPDF(idx)}>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                          </svg>
                                          Download PDF
                                        </button>
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleGenerateClinicalNote(analysis, idx)}
                                      className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium flex items-center justify-center"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Generate Clinical Note
                                    </button>
                                    {clinicalNotes[idx] && (
                                      <button className="px-3 py-1 bg-green-600 text-white rounded flex items-center" onClick={() => handleDownloadPDF(idx)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                        </svg>
                                        Download PDF
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-gray-50 p-4 rounded-b-xl flex justify-end">
                              <button
                                onClick={() => setOpenCardIdx(null)}
                                className={`px-4 py-2 font-medium rounded-lg transition-colors ${analysis.status === 'Reviewed' ? 'bg-gray-400 text-gray-800' : 'bg-blue-600 text-white'}`}
                              >
                                {analysis.status === 'Reviewed' ? 'Reviewed' : 'Close'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* View All / Show Less Toggle */}
              {dashboard.recentAnalyses.length > 3 && (
                <div className="text-center mt-6">
                  {!showAllAnalyses ? (
                    <button
                      onClick={() => setShowAllAnalyses(true)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center mx-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      View All Analyses ({dashboard.recentAnalyses.length})
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAllAnalyses(false)}
                      className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-colors flex items-center justify-center mx-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Show Less
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">No recent analyses available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardView;