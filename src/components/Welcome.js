import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartbeatIcon } from './Icons';
import { Button } from './UIComponents';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';

const Welcome = ({ onStart }) => {
  const navigate = useNavigate();
  const { currentUser, getUserType } = useAuth();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const userType = currentUser ? getUserType() : null;
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  // Get personalized greeting based on time and user type
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (!currentUser) {
      return `${timeGreeting}! Welcome to AI Health Assistant`;
    }

    const roleGreeting = userType === 'doctor' ? 'Dr.' : '';
    return `${timeGreeting}, ${roleGreeting} ${userName}!`;
  };

  // Get personalized subtitle based on user type
  const getPersonalizedSubtitle = () => {
    if (!currentUser) {
      return "Describe your symptoms in plain language, and our advanced AI will provide comprehensive health insights and recommendations.";
    }

    if (userType === 'doctor') {
      return "Access your patient dashboard, review cases, and utilize AI-powered diagnostic tools to enhance your practice.";
    } else {
      return `Welcome back! Your personalized health dashboard is ready with AI-powered insights tailored just for you.`;
    }
  };

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Feature highlights data
  const features = [
    {
      title: "Symptom Analysis",
      description: "Enter your symptoms in plain language and our AI will analyze them to suggest possible conditions, severity, and urgency.",
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "blue"
    },
    {
      title: "Doctor Matching",
      description: "Receive personalized doctor recommendations based on your analysis, including specialists, contact info, and location.",
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "green"
    },
    {
      title: "Clinical Notes",
      description: "Generate detailed clinical notes summarizing your symptoms, findings, and AI recommendations.",
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "purple"
    },
    {
      title: "Medication Plans",
      description: "Get sample medication plans tailored to your condition, with dosage, scheduling, and reminders.",
      icon: (
        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: "yellow"
    },
    {
      title: "Health History & Analytics",
      description: "View your health analysis history, track trends over time, and visualize your wellness with interactive charts.",
      icon: (
        <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "cyan"
    }
  ];

  // Floating particles component
  const FloatingParticles = () => {
    return (
      <>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-blue-400 opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.random() * 20 - 10, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingParticles />
        
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300 rounded-full filter blur-xl opacity-20"
          animate={{
            scale: [1, 1.5, 1],
            x: [-50, 50, -50],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-green-300 rounded-full filter blur-2xl opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            y: [50, -50, 50],
            rotate: [0, -180, -360],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div
          className="absolute top-1/3 right-1/3 w-24 h-24 bg-purple-300 rounded-full filter blur-xl opacity-20"
          animate={{
            scale: [1, 1.4, 1],
            x: [30, -30, 30],
            y: [30, -30, 30],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="text-center z-10 w-full max-w-6xl px-4">
        {/* Logo and title section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center mb-8"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-blue-500 mb-6"
          >
            <HeartbeatIcon className="h-24 w-24 drop-shadow-lg" />
          </motion.div>
          
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-2 sm:mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {getPersonalizedGreeting()}
          </motion.h1>
          
          <motion.p 
            className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-4 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {getPersonalizedSubtitle()}
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Button 
            onClick={onStart} 
            className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span className="relative z-10">Start Health Analysis</span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              whileHover={{ scale: 1.05 }}
            />
          </Button>
          
          <Button 
  onClick={() => navigate('/dashboard')} 
  className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-white/20"
  whileHover={{ 
    scale: 1.05,
    transition: { duration: 0.2 }
  }}
  whileTap={{ scale: 0.95 }}
>
  <span className="relative z-10 flex items-center justify-center">
    Go to Dashboard
    <svg 
      className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </span>
  
  {/* Animated background effect */}
  <motion.div 
    className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    whileHover={{ scale: 1.1 }}
  />
  
  {/* Shine effect on hover */}
  <motion.div 
    className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
    whileHover={{ transition: { duration: 0.7 } }}
  />
</Button>
        </motion.div>

        {/* Feature showcase */}
        <motion.div 
          className="max-w-5xl mx-auto mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-5 sm:p-8 border border-white/20 mx-4 sm:mx-0">
            <motion.h2 
              className="text-3xl font-bold text-gray-800 mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              How It Works
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { step: "1", title: "Describe Symptoms", desc: "Share your symptoms in natural language", color: "blue" },
                { step: "2", title: "AI Analysis", desc: "Get AI-powered health insights", color: "green" },
                { step: "3", title: "Get Recommendations", desc: "Receive personalized guidance", color: "purple" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 + index * 0.2 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <div className={`w-14 h-14 bg-${item.color}-100 rounded-full flex items-center justify-center mb-4`}>
                    <span className={`text-${item.color}-600 font-bold text-xl`}>{item.step}</span>
                  </div>
                  <h3 className={`text-lg font-semibold text-${item.color}-800 mb-2`}>{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Rotating feature highlight */}
            <div className="relative h-64 mb-12 rounded-xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature}
                  className={`absolute inset-0 bg-gradient-to-br from-${features[currentFeature].color}-50 to-white p-6 rounded-xl flex flex-col justify-center items-center text-center`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className={`bg-${features[currentFeature].color}-100 p-4 rounded-full mb-4`}>
                    {features[currentFeature].icon}
                  </div>
                  <h3 className={`text-2xl font-bold text-${features[currentFeature].color}-800 mb-2`}>
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-gray-700 max-w-md">
                    {features[currentFeature].description}
                  </p>
                </motion.div>
              </AnimatePresence>
              
              {/* Feature indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full ${currentFeature === index ? 'bg-blue-600' : 'bg-gray-300'}`}
                    onClick={() => setCurrentFeature(index)}
                  />
                ))}
              </div>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className={`p-6 rounded-xl border-l-4 border-${feature.color}-400 bg-white shadow-md hover:shadow-lg transition-shadow duration-300`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="flex items-center mb-4">
                    <div className={`bg-${feature.color}-100 p-3 rounded-lg mr-4`}>
                      {feature.icon}
                    </div>
                    <h3 className={`text-xl font-bold text-${feature.color}-800`}>
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-700">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Ready to get started?</h3>
          <Button 
            onClick={onStart} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Health Analysis Now
          </Button>
        </motion.div>

        {/* Disclaimer */}
        <motion.p 
          className="text-xs text-gray-500 max-w-md mx-auto pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
        >
          <span className="font-bold">Disclaimer:</span> This tool is for informational purposes only and does not constitute medical advice. Please consult a healthcare professional for any health concerns.
        </motion.p>
      </div>
    </div>
  );
};

export default Welcome;