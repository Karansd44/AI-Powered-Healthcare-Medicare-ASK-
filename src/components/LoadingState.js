import React from 'react';

export const LoadingState = ({ title = "Loading", description = "", type = "default" }) => {
  if (type === "minimal") {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-blue-600 font-medium">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <span className="ml-2">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
        </div>

        {/* Content Section */}
        <div className="mt-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                  <div className="h-3 w-3/4 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Message */}
        <div className="flex items-center justify-center mt-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-800">{title}</p>
              {description && <p className="text-sm text-gray-500">{description}</p>}
            </div>
          </div>
        </div>

        {/* Bottom Skeleton */}
        <div className="mt-8 space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="h-4 bg-gray-100 rounded-full animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
};
