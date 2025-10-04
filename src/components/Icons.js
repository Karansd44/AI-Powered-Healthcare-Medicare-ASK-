import React from 'react';
import { motion } from 'framer-motion';

export const StethoscopeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.881 4.123A.5.5 0 018 4.5v2.382a2.5 2.5 0 001.32 2.236l.32.16a2.5 2.5 0 011.72 2.236V13a1 1 0 01-1 1h-2.08a1 1 0 01-1-1v-1.528a2.5 2.5 0 011.72-2.236l.32-.16A2.5 2.5 0 0010.618 6.882V4.5a.5.5 0 01.123-.377l.292-.365a1 1 0 011.53 1.265l-.292.365a.5.5 0 01-.877.377V6.882a2.5 2.5 0 00-1.32 2.236l-.32.16a2.5 2.5 0 01-1.72 2.236V13a1 1 0 01-1 1h-2.08a1 1 0 01-1-1v-1.528a2.5 2.5 0 011.72-2.236l.32-.16A2.5 2.5 0 007.382 6.882V4.5a.5.5 0 01.123-.377l.292-.365a1 1 0 011.53 1.265l-.292.365a.5.5 0 01-.877.377z" />
  </svg>
);

export const HeartbeatIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const StarIcon = ({ filled = false, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const MicrophoneIcon = ({ className, isListening }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="极客时间 0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-极客时间 3 3z" />
    {isListening && (
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 1v22"
        stroke="none"
        fill="currentColor"
        className="text-red-500/50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2.5, opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    )}
  </svg>
);
