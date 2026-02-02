import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';

const AllPatientRecords = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Track which patient to delete
  const [deleting, setDeleting] = useState(false);


  useEffect(() => {
    async function fetchPatients() {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDocs(collection(db, 'users'));
        const patientList = [];
        for (const userDoc of snap.docs) {
          const data = userDoc.data();
          if (data.userType !== 'doctor') {
            // Count severe cases
            const severeAnalyses = (data.previousAnalyses || []).filter(a => a.predictions?.[0]?.severity === 3);
            patientList.push({
              id: userDoc.id,
              name: data.fullName || data.email || 'Unknown',
              email: data.email,
              createdAt: data.createdAt,
              previousAnalyses: data.previousAnalyses || [],
              analysisCount: (data.previousAnalyses || []).length,
              severeCases: severeAnalyses.length,
              lastAnalysis: data.previousAnalyses && data.previousAnalyses.length > 0 
                ? data.previousAnalyses.reduce((latest, current) => {
                    return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
                  }) 
                : null
            });
            // Save severe cases to Firestore
            if (severeAnalyses.length > 0) {
              await setDoc(doc(db, 'severeCases', userDoc.id), {
                patientId: userDoc.id,
                name: data.fullName || data.email || 'Unknown',
                email: data.email,
                createdAt: data.createdAt,
                severeAnalyses,
                lastAnalysis: data.previousAnalyses && data.previousAnalyses.length > 0 
                  ? data.previousAnalyses.reduce((latest, current) => {
                      return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
                    }) 
                  : null
              }, { merge: true });
            }
          }
        }
        setPatients(patientList);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to fetch patient records.');
      }
      setLoading(false);
    }
    fetchPatients();
  }, []);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Sort patients based on configuration
  const sortedPatients = React.useMemo(() => {
    if (!sortConfig.key) return patients;
    
    return [...patients].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [patients, sortConfig]);

  // Filter patients based on search term
  const filteredPatients = sortedPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle patient details expansion
  const toggleExpand = (patientId) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(patientId);
    }
  };

  // Handle patient deletion
  const handleDeletePatient = async (patientId) => {
    setDeleting(true);
    try {
      // Delete from users collection
      await deleteDoc(doc(db, 'users', patientId));
      
      // Try to delete from severeCases collection if exists
      try {
        await deleteDoc(doc(db, 'severeCases', patientId));
      } catch (err) {
        // Ignore if document doesn't exist in severeCases
        console.log('No severe case record to delete');
      }

      // Update local state
      setPatients(patients.filter(p => p.id !== patientId));
      setDeleteConfirm(null);
      
      // Show success message (you can use a toast notification library for better UX)
      alert('Patient record deleted successfully!');
    } catch (err) {
      console.error('Error deleting patient:', err);
      alert('Failed to delete patient record. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Get severity badge style
  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-gray-500">Loading patient records...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Patient Records</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-4 md:mb-0">Patient Records</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Patient
                    {sortConfig.key === 'name' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${sortConfig.direction === 'ascending' ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Joined
                    {sortConfig.key === 'createdAt' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${sortConfig.direction === 'ascending' ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('analysisCount')}
                >
                  <div className="flex items-center">
                    Analyses
                    {sortConfig.key === 'analysisCount' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${sortConfig.direction === 'ascending' ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('severeCases')}
                >
                  <div className="flex items-center">
                    Severe Cases
                    {sortConfig.key === 'severeCases' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${sortConfig.direction === 'ascending' ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500">No patients found matching your search.</p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => (
                  <React.Fragment key={patient.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="font-medium text-blue-800">
                              {patient.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{patient.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {patient.analysisCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.severeCases > 0 ? (
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {patient.severeCases}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleExpand(patient.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="View analysis history"
                        >
                          {expandedPatient === patient.id ? 'Hide' : 'View'} History
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(patient.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete patient record"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {expandedPatient === patient.id && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Patient Analysis History</h3>
                            {patient.previousAnalyses.length > 0 ? (
                              <div className="space-y-4">
                                {patient.previousAnalyses
                                  .slice()
                                  .sort((a, b) => {
                                    const sevA = a.predictions?.[0]?.severity || 0;
                                    const sevB = b.predictions?.[0]?.severity || 0;
                                    return sevB - sevA;
                                  })
                                  .map((analysis, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium text-gray-900">
                                            {analysis.predictions?.[0]?.disease || 'Unknown Condition'}
                                          </h4>
                                          <p className="text-sm text-gray-500">
                                            {analysis.timestamp ? new Date(analysis.timestamp).toLocaleDateString() : 'Date unknown'}
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityBadge(analysis.predictions?.[0]?.severity)}`}>
                                            {analysis.predictions?.[0]?.severity === 1 ? 'Mild' : 
                                             analysis.predictions?.[0]?.severity === 2 ? 'Moderate' : 
                                             analysis.predictions?.[0]?.severity === 3 ? 'Severe' : 'Unknown'}
                                          </span>
                                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            {analysis.predictions?.[0]?.confidence || 'N/A'}% confidence
                                          </span>
                                        </div>
                                      </div>
                                      {analysis.predictions?.[0]?.matchedSymptoms && (
                                        <div className="mt-2">
                                          <p className="text-xs text-gray-600 font-medium">Symptoms:</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {analysis.predictions[0].matchedSymptoms.slice(0, 5).map((symptom, i) => (
                                              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                {symptom}
                                              </span>
                                            ))}
                                            {analysis.predictions[0].matchedSymptoms.length > 5 && (
                                              <span className="text-xs text-gray-500">
                                                +{analysis.predictions[0].matchedSymptoms.length - 5} more
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No analyses recorded for this patient.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredPatients.length}</span> of <span className="font-medium">{patients.length}</span> patients
        </p>
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Delete Patient Record
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete <span className="font-semibold">{patients.find(p => p.id === deleteConfirm)?.name}</span>? 
              This action cannot be undone and will permanently delete all patient data including analysis history.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePatient(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPatientRecords;