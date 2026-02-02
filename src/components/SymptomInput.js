import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon } from './Icons';
import { Card, Button } from './UIComponents';

// Common symptom suggestions for text recommendations
const SYMPTOM_SUGGESTIONS = [
  "persistent headache",
  "severe headache with nausea",
  "migraine with visual disturbances",
  "dull throbbing pain in head",
  "headache behind eyes",
  "high fever with chills",
  "low-grade fever",
  "intermittent fever",
  "fever with body aches",
  "night sweats and fever",
  "dry cough",
  "persistent cough with phlegm",
  "coughing up blood",
  "wheezing cough",
  "cough that worsens at night",
  "chest pain when breathing",
  "sharp chest pain",
  "pressure in chest",
  "chest tightness with shortness of breath",
  "heart palpitations",
  "shortness of breath",
  "difficulty breathing when lying down",
  "rapid breathing",
  "wheezing",
  "gasping for air",
  "abdominal pain",
  "stomach cramps",
  "bloating and gas",
  "nausea and vomiting",
  "diarrhea",
  "constipation",
  "blood in stool",
  "loss of appetite",
  "heartburn and acid reflux",
  "indigestion after eating",
  "joint pain",
  "muscle aches",
  "back pain",
  "neck stiffness",
  "swollen joints",
  "muscle weakness",
  "numbness or tingling",
  "limited range of motion",
  "cramps in legs",
  "fatigue and weakness",
  "extreme tiredness",
  "feeling exhausted all the time",
  "lack of energy",
  "difficulty concentrating",
  "dizziness",
  "lightheadedness",
  "fainting spells",
  "vertigo",
  "loss of balance",
  "skin rash",
  "itchy skin",
  "hives",
  "skin discoloration",
  "dry flaky skin",
  "bumps on skin",
  "skin peeling",
  "bruising easily",
  "sore throat",
  "difficulty swallowing",
  "swollen lymph nodes",
  "hoarse voice",
  "runny nose",
  "nasal congestion",
  "sneezing",
  "sinus pressure",
  "postnasal drip",
  "ear pain",
  "ringing in ears",
  "hearing loss",
  "blurred vision",
  "eye pain",
  "sensitivity to light",
  "red or irritated eyes",
  "anxiety symptoms",
  "feeling depressed",
  "insomnia",
  "trouble sleeping",
  "mood swings",
  "panic attacks",
  "stress and tension",
  "frequent urination",
  "painful urination",
  "blood in urine",
  "urinary incontinence",
  "weight loss unexplained",
  "weight gain sudden",
  "swelling in legs or ankles",
  "cold hands and feet",
  "excessive thirst",
  "excessive hunger"
];

const SymptomInput = ({ onSubmit, isAnalyzing, analysisProgress }) => {
  const [symptoms, setSymptoms] = useState("");
  const textareaRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef(null);

  // Get the last word or phrase being typed for matching
  const getLastWord = (text) => {
    const words = text.toLowerCase().trim().split(/[,.\s]+/);
    return words[words.length - 1] || "";
  };

  // Filter suggestions based on current input
  const filterSuggestions = useCallback((text) => {
    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lastWord = getLastWord(text);
    if (lastWord.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Find matching suggestions
    const filtered = SYMPTOM_SUGGESTIONS
      .filter(suggestion => {
        const lowerSuggestion = suggestion.toLowerCase();
        const lowerText = text.toLowerCase();
        // Match if suggestion contains the last word and hasn't been used already
        return lowerSuggestion.includes(lastWord) && !lowerText.includes(suggestion);
      })
      .slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedSuggestionIndex(-1);
  }, []);

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    const currentText = symptoms.trim();
    const separator = currentText && !currentText.endsWith(',') && !currentText.endsWith('.') ? ', ' : ' ';
    const newText = currentText ? currentText + separator + suggestion : suggestion;
    setSymptoms(newText);
    setShowSuggestions(false);
    setSuggestions([]);
    textareaRef.current?.focus();
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSuggestions([]);
        break;
      default:
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          textareaRef.current && !textareaRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions when symptoms text changes
  useEffect(() => {
    filterSuggestions(symptoms);
  }, [symptoms, filterSuggestions]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setSymptoms(prev => prev + finalTranscript);
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => console.error('Speech recognition error:', event.error);

    recognitionRef.current = recognition;
  }, []);

  const handleListen = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSubmit = () => {
    if (symptoms.trim()) {
      onSubmit(symptoms);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto relative">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-2xl flex flex-col items-center justify-center">
          <div className="flex justify-center items-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Analyzing...</h2>
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
            <motion.div
              className="bg-blue-500 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${analysisProgress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          <p className="text-gray-600 mt-4 h-6">
            {analysisProgress < 25 && "Initializing secure connection..."}
            {analysisProgress >= 25 && analysisProgress < 50 && "Applying advanced language model..."}
            {analysisProgress >= 50 && analysisProgress < 75 && "Analyzing symptom patterns..."}
            {analysisProgress >= 75 && "Finalizing analysis..."}
          </p>
        </div>
      )}
      
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Describe Your Symptoms</h2>
      <p className="text-gray-600 mb-6 text-center">
        Please be as detailed as possible. For example: "I have a persistent cough, a slight fever, and a headache."
      </p>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none overflow-hidden min-h-[120px]"
          placeholder="Type or use the microphone to speak..."
          rows="4"
          disabled={isAnalyzing}
        />
        {isSpeechSupported && (
          <button
            onClick={handleListen}
            disabled={isAnalyzing}
            className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-100' : 'text-gray-500 hover:bg-gray-100'} ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <MicrophoneIcon className="w-6 h-6" isListening={isListening} />
          </button>
        )}
        
        {/* Text Recommendations Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 flex items-center">
                  <svg className="w-3 h-3 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Suggested symptoms — click or use ↑↓ to select
                </p>
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <motion.li
                    key={suggestion}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-all duration-150 flex items-center group ${
                        selectedSuggestionIndex === index
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-3 transition-colors ${
                        selectedSuggestionIndex === index
                          ? 'bg-blue-500'
                          : 'bg-gray-300 group-hover:bg-blue-400'
                      }`}></span>
                      <span className="flex-1">{suggestion}</span>
                      <span className={`text-xs transition-opacity ${
                        selectedSuggestionIndex === index
                          ? 'opacity-100 text-blue-500'
                          : 'opacity-0 group-hover:opacity-100 text-gray-400'
                      }`}>
                        + Add
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!isSpeechSupported && <p className="text-xs text-red-500 text-center mt-2">Voice input is not supported on this browser.</p>}

      <div className="mt-6 text-center">
        <Button onClick={handleSubmit} disabled={!symptoms.trim() || isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Analyze My Symptoms'}
        </Button>
      </div>
    </Card>
  );
};

export default SymptomInput;  