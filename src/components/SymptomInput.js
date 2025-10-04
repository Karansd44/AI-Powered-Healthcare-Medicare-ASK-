import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MicrophoneIcon } from './Icons';
import { Card, Button } from './UIComponents';

const SymptomInput = ({ onSubmit, isAnalyzing, analysisProgress }) => {
  const [symptoms, setSymptoms] = useState("");
  const textareaRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

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
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
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