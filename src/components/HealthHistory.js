import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card } from './UIComponents';

const HealthHistory = () => {
  const { currentUser } = useAuth();
  const [previousAnalyses, setPreviousAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'recent'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'severity'

  useEffect(() => {
    async function fetchPreviousAnalyses() {
      if (!currentUser) {
        setPreviousAnalyses([]);
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const analyses = Array.isArray(data.previousAnalyses) ? data.previousAnalyses.slice().reverse() : [];
          setPreviousAnalyses(analyses);
          // If a record param is present, select that entry
          if (window && window.location && window.location.search) {
            const params = new URLSearchParams(window.location.search);
            const recordIdx = parseInt(params.get('record'), 10);
            if (!isNaN(recordIdx) && recordIdx > 0 && recordIdx <= analyses.length) {
              setSelectedEntry(recordIdx - 1);
            }
          }
        } else {
          setPreviousAnalyses([]);
        }
      } catch (err) {
        console.error("Error fetching analyses:", err);
        setPreviousAnalyses([]);
      }
      setLoading(false);
    }
    fetchPreviousAnalyses();
  }, [currentUser]);

  // Filter and sort analyses
  const getFilteredAndSortedAnalyses = () => {
    // First apply filters
    let filtered = previousAnalyses.filter(entry => {
      if (filter === 'recent') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return entry.timestamp ? new Date(entry.timestamp) > oneMonthAgo : false;
      }
      return true;
    });

    // Then apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      }
      if (sortBy === 'severity') {
        return (b.predictions[0]?.severity || 0) - (a.predictions[0]?.severity || 0);
      }
      return 0;
    });
  };

  const filteredAnalyses = getFilteredAndSortedAnalyses();

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
          </div>

          {/* Filter Section Skeleton */}
          <div className="mt-6 mb-8 bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Records Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="h-6 w-3/4 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-100 rounded mb-2"></div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((tag) => (
                      <div key={tag} className="h-6 w-20 bg-gray-100 rounded-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Message */}
          <div className="flex items-center justify-center mt-8">
            <div className="flex items-center gap-3 text-blue-600 font-medium">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <span className="ml-2">Loading your health records</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Health History</h1>
        <p className="text-gray-600">Review your previous symptom analyses and predictions</p>
        
        {/* Filter and Sort Section */}
        <div className="mt-6 mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filter Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Show Records</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${filter === 'all' 
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600 ring-offset-2' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  All Records
                </button>
                <button
                  onClick={() => setFilter('recent')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${filter === 'recent' 
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600 ring-offset-2' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${sortBy === 'date' 
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600 ring-offset-2' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  Most Recent
                </button>
                <button
                  onClick={() => setSortBy('severity')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${sortBy === 'severity' 
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600 ring-offset-2' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  Severity
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previousAnalyses.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto w-16 h-16 mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No health records yet</h3>
          <p className="text-gray-500">Your symptom analyses will appear here after you use our diagnostic tool.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'Record' : 'Records'}
            </h2>
            
            {filteredAnalyses.map((entry, idx) => (
              <Card 
                key={idx} 
                className={`p-5 transition-all ${selectedEntry === idx ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {entry.predictions[0]?.disease || 'Unknown condition'}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-2">
                      <span>
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'Unknown date'}
                      </span>
                      <span>•</span>
                      <span className="text-xs">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(entry.predictions[0]?.severity || 0)}`}>
                      {getSeverityText(entry.predictions[0]?.severity || 0)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntry(selectedEntry === idx ? null : idx);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      title="View Details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Symptoms reported:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(Array.isArray(entry.predictions[0]?.matchedSymptoms) ? 
                      entry.predictions[0].matchedSymptoms : [entry.symptoms || 'Unknown symptoms']
                    ).slice(0, 4).map((sym, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {sym}
                      </span>
                    ))}
                    {entry.predictions[0]?.matchedSymptoms && entry.predictions[0].matchedSymptoms.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                        +{entry.predictions[0].matchedSymptoms.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center mt-1 mb-2">
                  <span className="text-sm font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {entry.predictions[0]?.confidence || 'N/A'}% confidence
                  </span>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedEntry !== null && filteredAnalyses[selectedEntry] ? (
              <Card className="p-5 sticky top-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Analysis Details</h3>
                  <button 
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {filteredAnalyses[selectedEntry] && (
                  <>
                    <div className="mb-5">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Reported Symptoms</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-800">{filteredAnalyses[selectedEntry].symptoms}</p>
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Matched Symptoms</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(filteredAnalyses[selectedEntry].predictions[0]?.matchedSymptoms) ? 
                          filteredAnalyses[selectedEntry].predictions[0].matchedSymptoms.map((sym, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {sym}
                            </span>
                          )) : (
                            <span className="text-sm text-gray-500">No specific symptoms matched</span>
                          )
                        }
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Predicted Conditions</h4>
                      <div className="space-y-3">
                        {filteredAnalyses[selectedEntry].predictions.map((pred, i) => (
                          <div key={i} className="border-l-4 border-blue-200 pl-3 py-1">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-900">{pred.disease}</span>
                              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {pred.confidence}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{pred.description}</p>
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-700">Recommended specialist:</span>
                              <span className="text-xs text-blue-600 ml-1">{pred.specialist}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Analysis performed on {filteredAnalyses[selectedEntry].timestamp ? 
                        new Date(filteredAnalyses[selectedEntry].timestamp).toLocaleString() : 'unknown date'}
                      </p>
                    </div>
                  </>
                )}
              </Card>
            ) : (
              <Card className="p-6 text-center sticky top-6">
                <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Select a record</h3>
                <p className="text-xs text-gray-500">Click on any health record to view detailed information</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthHistory;