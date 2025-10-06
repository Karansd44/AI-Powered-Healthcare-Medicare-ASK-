import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LoadingState } from './LoadingState';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StarIcon } from './Icons';
import { Card, Button, Tag, CircularProgress } from './UIComponents';
import MedicationScheduler from '../MedicationScheduler';

const ResultsDisplay = ({
  results,
  symptoms,
  onReset
}) => {
  const [selectedDisease, setSelectedDisease] = useState(results[0] || null);
  const [doctorResults, setDoctorResults] = useState(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const { currentUser, getUserType } = useAuth();
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    if (getUserType) setUserType(getUserType());
  }, [getUserType, currentUser]);
  const [previousAnalyses, setPreviousAnalyses] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [clinicalNote, setClinicalNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);

  const chartColors = ['text-blue-500', 'text-green-500', 'text-yellow-500'];

  const getSeverityColor = (severity) => {
    if (severity === 3) return "bg-red-100 text-red-800";
    if (severity === 2) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // Loading page shown while analysis is running (when results are null/undefined)
  const LoadingPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-2xl mx-auto p-8 text-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              className="w-24 h-24 text-indigo-500"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 12, -12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <rect x="8" y="14" width="48" height="36" rx="6" fill="currentColor" opacity="0.08" />
              <path d="M20 34c2-6 6-8 12-8s10 2 12 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M32 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing symptoms</h2>
          <p className="text-gray-600 mb-4">The AI is reviewing the symptoms and preparing possible diagnoses. This usually takes a few seconds.</p>
          <div className="flex items-center justify-center">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0.8 }}
              animate={{ x: [0, 8, -8, 0], opacity: [0.8, 1, 0.8, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              <div className="w-3 h-3 bg-indigo-400 rounded-full" />
              <div className="w-3 h-3 bg-indigo-500 rounded-full" />
              <div className="w-3 h-3 bg-indigo-600 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Function to get real nearby hospitals using Google Places API
  const searchNearbyHospitals = async (specialist) => {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser. Please use a modern browser that supports location services.');
      }

      // Request location permission with a timeout
      const position = await new Promise((resolve, reject) => {
        const locationTimeout = setTimeout(() => {
          reject(new Error('Location request timed out after 10 seconds. Please try again.'));
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(locationTimeout);
            resolve(pos);
          },
          (err) => {
            clearTimeout(locationTimeout);
            switch (err.code) {
              case 1:
                reject(new Error(
                  'Location access was denied. To find nearby hospitals:\n\n' +
                  '1. Click the location icon (🔒) in your browser\'s address bar\n' +
                  '2. Select "Allow" for location access\n' +
                  '3. Refresh the page and try again\n\n' +
                  'Or manually enter your city/area in the search below.'
                ));
                break;
              case 2:
                reject(new Error(
                  'Your location is currently unavailable. This might be due to:\n' +
                  '• Weak GPS signal\n' +
                  '• Location services disabled\n' +
                  '• Network connectivity issues\n\n' +
                  'Please check your device settings and try again.'
                ));
                break;
              case 3:
                reject(new Error(
                  'Location request timed out. This might be due to:\n' +
                  '• Slow network connection\n' +
                  '• GPS signal issues\n\n' +
                  'Please try again or use manual location entry.'
                ));
                break;
              default:
                reject(new Error(
                  'Unable to get your location. Please:\n' +
                  '• Check if location services are enabled\n' +
                  '• Allow location access for this website\n' +
                  '• Try refreshing the page'
                ));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Construct the search query based on specialist
      const searchQuery = specialist ? `${specialist} hospitals` : 'hospitals';

      // Use Google Places API to search for nearby hospitals
      const apiUrl = 'http://localhost:3005/api/places/nearbysearch';
      const params = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: '5000',
        type: 'hospital',
        keyword: searchQuery || ''
      });

      console.log('Sending request to:', `${apiUrl}?${params}`);

      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to fetch nearby hospitals: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.results || data.results.length === 0) {
        return [{
          name: 'No Results Found',
          clinic: 'No hospitals found in your area',
          address: 'Try expanding the search radius or changing your location',
          image: "https://placehold.co/100x100/E2E8F0/4A5568?text=NH",
          rating: 0
        }];
      }

      // Format and sort the results by rating
      const formattedResults = data.results.map(place => ({
        name: place.name,
        clinic: place.name,
        address: place.vicinity,
        image: place.photos?.[0]?.photo_reference
          ? `http://localhost:3005/api/places/photo?photoreference=${place.photos[0].photo_reference}&maxwidth=400`
          : "https://placehold.co/400x300/E2E8F0/4A5568?text=Hospital",
        rating: place.rating || 0,
        placeId: place.place_id,
        location: place.geometry.location,
        openNow: place.opening_hours?.open_now,
        userRatingsTotal: place.user_ratings_total || 0
      }));

      // Sort by rating and total reviews, then take top 4
      return formattedResults
        .sort((a, b) => {
          if (b.rating === a.rating) {
            return b.userRatingsTotal - a.userRatingsTotal;
          }
          return b.rating - a.rating;
        })
        .slice(0, 4);
    } catch (error) {
      console.error('Error fetching nearby hospitals:', error);
      // Show a more specific error message
      return [{
        name: 'Location Access Required',
        clinic: error.message || 'Please enable location access to see nearby hospitals',
        address: 'Try manual location search below',
        image: "https://placehold.co/100x100/E2E8F0/4A5568?text=⚠️",
        rating: 0
      }];
    }
  };

  // Function to search hospitals by manual location input
  const searchHospitalsByLocation = async (locationQuery, specialist) => {
    try {
      setIsSearchingManual(true);
      
      // First, geocode the location query to get coordinates
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
      
      const geocodeResponse = await fetch(`http://localhost:3005/api/geocode?address=${encodeURIComponent(locationQuery)}`);
      
      if (!geocodeResponse.ok) {
        throw new Error('Unable to find the specified location. Please try a different location.');
      }
      
      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData.results || geocodeData.results.length === 0) {
        throw new Error('Location not found. Please try with a more specific address or city name.');
      }
      
      const location = geocodeData.results[0].geometry.location;
      const { lat, lng } = location;
      
      // Now search for hospitals near those coordinates
      const searchQuery = specialist ? `${specialist} hospitals` : 'hospitals';
      const apiUrl = 'http://localhost:3005/api/places/nearbysearch';
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: '10000', // 10km radius for manual search
        type: 'hospital',
        keyword: searchQuery || ''
      });

      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch hospitals: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.results || data.results.length === 0) {
        return [{
          name: 'No Hospitals Found',
          clinic: `No hospitals found near ${locationQuery}`,
          address: 'Try expanding search area or different location',
          image: "https://placehold.co/100x100/E2E8F0/4A5568?text=NH",
          rating: 0
        }];
      }

      // Format results similar to the geolocation search
      const formattedResults = data.results.map(place => ({
        name: place.name,
        clinic: place.name,
        address: place.vicinity,
        image: place.photos?.[0]?.photo_reference
          ? `http://localhost:3005/api/places/photo?photoreference=${place.photos[0].photo_reference}&maxwidth=400`
          : "https://placehold.co/400x300/E2E8F0/4A5568?text=Hospital",
        rating: place.rating || 0,
        placeId: place.place_id,
        location: place.geometry.location,
        openNow: place.opening_hours?.open_now,
        userRatingsTotal: place.user_ratings_total || 0
      }));

      return formattedResults
        .sort((a, b) => {
          if (b.rating === a.rating) {
            return b.userRatingsTotal - a.userRatingsTotal;
          }
          return b.rating - a.rating;
        })
        .slice(0, 6); // Show more results for manual search
        
    } catch (error) {
      console.error('Error searching hospitals by location:', error);
      return [{
        name: 'Search Error',
        clinic: error.message || 'Unable to search hospitals in this location',
        address: 'Please try a different location or check your spelling',
        image: "https://placehold.co/100x100/E2E8F0/4A5568?text=❌",
        rating: 0
      }];
    } finally {
      setIsSearchingManual(false);
    }
  };

  const handleFindDoctors = async () => {
    if (!selectedDisease) return;

    try {
      // Check if the browser supports geolocation
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      setIsLoadingDoctors(true);
      setDoctorResults(null);

      // First check if we already have permission
      const permission = await navigator.permissions.query({ name: 'geolocation' });

      if (permission.state === 'denied') {
        throw new Error('Location access is blocked. Please enable location access in your browser settings:\n\n' +
          '1. Click the lock/info icon in your browser\'s address bar\n' +
          '2. Find "Location" or "Site Settings"\n' +
          '3. Change the setting to "Allow"\n' +
          '4. Refresh the page and try again');
      }

      if (permission.state === 'prompt') {
        setShowLocationModal(true);
      }

      const results = await searchNearbyHospitals(selectedDisease.specialist);
      setDoctorResults(results);
    } catch (error) {
      console.error('Error finding doctors:', error);
      setDoctorResults([{
        name: 'Location Access Required',
        clinic: error.message || 'Please enable location access to see nearby hospitals',
        address: 'Check your browser settings and try again',
        image: "https://placehold.co/100x100/E2E8F0/4A5568?text=⚠️",
        rating: 0
      }]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleManualLocationSearch = async () => {
    if (!manualLocation.trim() || !selectedDisease) return;

    try {
      setIsSearchingManual(true);
      const results = await searchHospitalsByLocation(manualLocation.trim(), selectedDisease.specialist);
      setDoctorResults(results);
      setShowManualLocation(false);
    } catch (error) {
      console.error('Error in manual location search:', error);
      setDoctorResults([{
        name: 'Search Error',
        clinic: error.message || 'Unable to search hospitals in this location',
        address: 'Please try a different location',
        image: "https://placehold.co/100x100/E2E8F0/4A5568?text=❌",
        rating: 0
      }]);
    } finally {
      setIsSearchingManual(false);
    }
  };

  // ...existing code...

  const handleGenerateClinicalNote = () => {
    if (!results || results.length === 0) return;
    // Find highest confidence prediction
    const highest = results.reduce((max, r) => r.confidence > max.confidence ? r : max, results[0]);
    // Generate a clean clinical note
    const note = `Clinical Note\n\nPatient presents with symptoms: ${symptoms.join(", ")}.\n\nMost likely diagnosis: ${highest.disease} (${highest.confidence}%).\nDescription: ${highest.description}\nRecommended specialist: ${highest.specialist}\nRecovery/Management steps: ${highest.recovery.join(", ")}`;
    setClinicalNote(note);
    setTimeout(() => {
      const el = document.getElementById('clinical-note-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDownloadNote = () => {
    const blob = new Blob([clinicalNote], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinical_note.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fetch previous analyses from Firestore for the logged-in user
  useEffect(() => {
    async function fetchPreviousAnalyses() {
      if (!currentUser) {
        setPreviousAnalyses([]);
        return;
      }
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setPreviousAnalyses(Array.isArray(data.previousAnalyses) ? data.previousAnalyses.slice().reverse() : []);
        } else {
          setPreviousAnalyses([]);
        }
      } catch (err) {
        setPreviousAnalyses([]);
      }
    }
    fetchPreviousAnalyses();
  }, [currentUser]);

  // Scroll to doctor results
  useEffect(() => {
    if (doctorResults) {
      const el = document.getElementById('doctor-results-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [doctorResults]);

  // Scroll to medication plan
  useEffect(() => {
    if (showScheduler) {
      const el = document.getElementById('medication-plan-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [showScheduler]);

  if (!results || results.length === 0) {
    return (
      <div className="text-center">
        <Card className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis Complete</h2>
          <p className="text-gray-600 mb-6">We couldn't identify a potential condition based on the symptoms provided. This could be due to a lack of data or a non-specific description.</p>
          <Button onClick={onReset}>Try Again</Button>
        </Card>
      </div>
    );
  }

  const LocationPermissionModal = () => {
    if (!showLocationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Enable Location Access</h3>
          <p className="text-gray-600 mb-4">
            To find hospitals near you, we need access to your location. When prompted by your browser:
          </p>
          <ul className="list-disc list-inside mb-6 text-gray-600 space-y-2">
            <li>Click "Allow" in the location permission popup</li>
            <li>Make sure your device's location services are enabled</li>
            <li>You can always change this setting in your browser preferences</li>
          </ul>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowLocationModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowLocationModal(false);
                handleFindDoctors();
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
      <LocationPermissionModal />
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Diagnostic Analysis</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Based on the symptoms you provided, here are the potential conditions.</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column - Symptoms and Confidence */}
        <div className="md:col-span-1 lg:col-span-4 space-y-4 sm:space-y-6">
          <Card className="h-fit">
            <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Identified Symptoms
            </h3>
            <div className="flex flex-wrap gap-2">
              {symptoms.map(symptom => <Tag key={symptom} color="yellow">{symptom}</Tag>)}
            </div>
          </Card>

          <Card className="h-fit">
            <h3 className="font-bold text-xl mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Prediction Confidence
            </h3>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={result.disease} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <CircularProgress percentage={result.confidence} color={chartColors[index % chartColors.length]} size={70} />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-800">{result.disease}</p>
                    <p className="text-sm text-gray-500">{result.specialist}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* History Toggle for Mobile */}
          {previousAnalyses.length > 1 && (
            <div className="md:hidden mt-2 mb-4">
              <Button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full bg-gray-500 hover:bg-gray-600 py-3 text-sm sm:text-base flex items-center justify-center"
              >
                {showHistory ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Hide History
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Recent Health Analyses
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Middle Column - Disease Details */}
        <div className="md:col-span-2 lg:col-span-5 space-y-4 sm:space-y-6">
          <Card>
            <div className="flex space-x-2 border-b border-gray-200 mb-3 sm:mb-4 overflow-x-auto pb-2">
              {results.map((result) => (
                <button
                  key={result.disease}
                  onClick={() => {
                    setSelectedDisease(result);
                    setDoctorResults(null);
                    setShowScheduler(false);
                  }}
                  className={`py-1 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors duration-300 whitespace-nowrap rounded-t-lg ${selectedDisease.disease === result.disease
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {result.disease}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDisease ? selectedDisease.disease : 'empty'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {selectedDisease && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-800">{selectedDisease.disease}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedDisease.severity)}`}>
                        {selectedDisease.severity === 3 ? 'High Severity' : selectedDisease.severity === 2 ? 'Medium Severity' : 'Low Severity'}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-6 leading-relaxed">{selectedDisease.description}</p>

                    {selectedDisease.severity >= 2 && (
                      <div className={`p-4 rounded-lg mt-6 ${getSeverityColor(selectedDisease.severity)}`}>
                        <h3 className="font-bold text-lg mb-2">Specialist Recommendation</h3>
                        {selectedDisease.severity === 3 && <p className="font-bold mb-2">This may be a medical emergency. Please seek immediate medical attention.</p>}
                        <p>For a potential diagnosis of <strong>{selectedDisease.disease}</strong>, it is highly recommended to consult a <strong>{selectedDisease.specialist}</strong>.</p>
                        <div className="mt-4 flex flex-col gap-2">
                          <Button onClick={handleFindDoctors} disabled={isLoadingDoctors} className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600">
                            {isLoadingDoctors ? 'Searching...' : 'Find Doctors Nearby'}
                          </Button>
                          
                          {/* Manual Location Search Option */}
                          <div className="mt-3 border-t pt-3">
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">Can't access your location? Search manually:</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder="Enter city, address, or area"
                                value={manualLocation}
                                onChange={(e) => setManualLocation(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && manualLocation.trim()) {
                                    handleManualLocationSearch();
                                  }
                                }}
                              />
                              <Button 
                                onClick={handleManualLocationSearch} 
                                disabled={!manualLocation.trim() || isSearchingManual}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-sm whitespace-nowrap"
                              >
                                {isSearchingManual ? 'Searching...' : 'Search'}
                              </Button>
                            </div>
                          </div>
                          
                          {selectedDisease.severity === 3 && (
                            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2" onClick={() => window.open('tel:112')}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92V19a2 2 0 01-2.18 2A19.86 19.86 0 013 5.18 2 2 0 015 3h2.09a2 2 0 012 1.72c.13.81.36 1.6.68 2.34a2 2 0 01-.45 2.11l-.27.27a16 16 0 006.58 6.58l.27-.27a2 2 0 012.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0121 16.91z" />
                              </svg>
                              Emergency: Call Hospital
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <h3 className="font-bold text-lg mb-3 flex items-center text-blue-800">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Recovery & Management
                      </h3>
                      <ul className="space-y-3">
                        {selectedDisease.recovery.map((step, i) => (
                          <li key={i} className="flex items-start">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 mt-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 flex flex-col gap-4">
                      <Button onClick={() => setShowScheduler(true)} className="bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2 px-4 py-2 text-base font-semibold">
                        <span>Generate Sample Medication Plan</span>
                      </Button>
                      {userType === 'doctor' && (
                        <Button onClick={handleGenerateClinicalNote} className="bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2 px-4 py-2 text-base font-semibold">
                          <span>Generate Clinical Note for Doctor</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Card>

          {isLoadingDoctors ? (
            <LoadingState title="Finding Doctors" description="Searching for specialists near you..." type="minimal" />
          ) : doctorResults && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} id="doctor-results-section">
              <Card className="mt-8 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                      Suggested Hospitals/Clinics Nearby
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Sorted by rating & reviews
                    </div>
                    <button
                      onClick={() => setDoctorResults(null)}
                      aria-label="Close suggested hospitals"
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {doctorResults.map((hospital, i) => {
                    const mapImg = hospital.location
                      ? `https://maps.googleapis.com/maps/api/staticmap?center=${hospital.location.lat},${hospital.location.lng}&zoom=16&size=600x300&scale=2&maptype=roadmap&markers=color:red%7C${hospital.location.lat},${hospital.location.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
                      : hospital.image;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                        className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-blue-100 flex flex-col"
                      >
                        <div className="relative group h-48">
                          <img
                            src={mapImg}
                            alt={hospital.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={e => { e.target.src = hospital.image || 'https://placehold.co/400x300/E2E8F0/4A5568?text=Hospital'; }}
                          />
                          <div className="absolute top-3 left-3 bg-white/90 rounded-lg px-3 py-1 flex items-center shadow">
                            <svg className="w-4 h-4 text-red-500 mr-1" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                            </svg>
                            <span className="text-xs font-semibold text-gray-700">Google Maps</span>
                          </div>
                          <div className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 flex items-center shadow">
                            <StarIcon filled={true} className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-bold text-gray-800">{hospital.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col p-5">
                          <h3 className="text-xl font-bold text-gray-900 mb-1 truncate" title={hospital.name}>{hospital.name}</h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <svg className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <span className="text-base line-clamp-2" title={hospital.address}>{hospital.address}</span>
                          </div>
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, starIndex) => (
                                <StarIcon
                                  key={starIndex}
                                  filled={starIndex < Math.round(hospital.rating)}
                                  className="w-4 h-4 text-yellow-400"
                                />
                              ))}
                              <span className="ml-1 text-sm text-gray-700 font-medium">{hospital.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-gray-500">{hospital.userRatingsTotal} reviews</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            {hospital.openNow !== undefined && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${hospital.openNow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <span className={`w-2 h-2 rounded-full mr-2 ${hospital.openNow ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {hospital.openNow ? 'Open Now' : 'Closed'}
                              </span>
                            )}
                          </div>
                          <div className="mt-auto">
                            <Button
                              onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${hospital.placeId}`, '_blank')}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-full flex items-center transition-colors duration-200 shadow-lg shadow-blue-500/30 w-full justify-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                              </svg>
                              View on Map
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}
          {showScheduler && selectedDisease && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} id="medication-plan-section">
              <MedicationScheduler disease={selectedDisease.disease} onClose={() => setShowScheduler(false)} />
            </motion.div>
          )}
        </div>

        {/* Right Column - History (Desktop) */}
        {previousAnalyses.length > 1 && (
          <div className="hidden md:block md:col-span-3 lg:col-span-3 space-y-4 sm:space-y-6">
            <Card>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Recent Health Analyses
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previousAnalyses.slice(1).map((entry, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '-'}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Previous</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-gray-700">Symptoms:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(entry.predictions[0]?.matchedSymptoms) ? entry.predictions[0].matchedSymptoms : [entry.symptoms]).slice(0, 3).map((sym, i) => (
                          <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            {sym}
                          </span>
                        ))}
                        {Array.isArray(entry.predictions[0]?.matchedSymptoms) && entry.predictions[0].matchedSymptoms.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{entry.predictions[0].matchedSymptoms.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Top Prediction:</span>
                      <p className="text-sm font-medium text-blue-600 mt-1">{entry.predictions[0]?.disease}</p>
                      <p className="text-xs text-gray-500">({entry.predictions[0]?.confidence}% confidence)</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile History Panel */}
      {showHistory && previousAnalyses.length > 1 && (
        <div className="md:hidden mt-4 sm:mt-6">
          <Card>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Recent Health Analyses
            </h2>
            <div className="space-y-3 sm:space-y-4 max-h-64 overflow-y-auto">
              {previousAnalyses.slice(1).map((entry, idx) => (
                <div key={idx} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '-'}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Previous</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm font-semibold text-gray-700">Symptoms:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(entry.predictions[0]?.matchedSymptoms) ? entry.predictions[0].matchedSymptoms : [entry.symptoms]).slice(0, 3).map((sym, i) => (
                        <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Top Prediction:</span>
                    <p className="text-sm font-medium text-blue-600">{entry.predictions[0]?.disease}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Clinical Note Section */}
      {clinicalNote && (
        <div id="clinical-note-section" className="mt-8">
          <Card className="p-6 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-blue-700">Clinical Note for Doctor</h3>
              <div className="flex gap-2">
                <Button onClick={() => setIsEditingNote(!isEditingNote)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 text-sm">{isEditingNote ? 'Save' : 'Edit'}</Button>
                <Button onClick={handleDownloadNote} className="bg-indigo-400 hover:bg-indigo-500 text-white px-3 py-1 text-sm">Download</Button>
              </div>
            </div>
            {isEditingNote ? (
              <textarea
                className="w-full h-48 p-3 border border-blue-300 rounded text-base text-gray-800 bg-white"
                value={clinicalNote}
                onChange={e => setClinicalNote(e.target.value)}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-gray-800 text-base">{clinicalNote}</pre>
            )}
          </Card>
        </div>
      )}

      <div className="text-center mt-12">
        <Button onClick={onReset} className="bg-blue-500 hover:bg-blue-600">
          Start New Analysis
        </Button>
      </div>
    </div>
  );
};

export default ResultsDisplay;