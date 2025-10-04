import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  className = ""
}) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8 ${className}`}>
    {children}
  </div>
);

export const Button = ({
  children,
  onClick,
  className = "",
  disabled = false
}) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.05 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 font-semibold text-white rounded-full shadow-md transition-all duration-300 ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} ${className}`}
  >
    {children}
  </motion.button>
);

export const Tag = ({
  children,
  color = "blue"
}) => {
  const colors = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
  };
  return <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[color]}`}>{children}</span>;
};

export const CircularProgress = ({ percentage, color, size = 80 }) => {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          className="text-gray-200"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={color}
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-lg font-bold text-gray-700">{`${Math.round(percentage)}%`}</span>
    </div>
  );
};