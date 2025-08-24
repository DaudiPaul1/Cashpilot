'use client';

import React from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ type = 'spinner', size = 'md', text, className = '' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        );
      case 'pulse':
        return (
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
        );
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin`} />;
    }
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {renderSpinner()}
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

export function Skeleton({ className = '', lines = 1, height = 'h-4' }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-200 rounded animate-pulse`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'idle';
  text?: string;
  className?: string;
}

export function StatusIndicator({ status, text, className = '' }: StatusIndicatorProps) {
  const statusConfig = {
    loading: {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    success: {
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    error: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    idle: {
      icon: <div className="h-4 w-4" />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${config.bgColor} ${className}`}>
      <div className={config.color}>
        {config.icon}
      </div>
      {text && <span className={`text-sm font-medium ${config.color}`}>{text}</span>}
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ progress, className = '', showPercentage = false }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-gray-600 mt-1 text-center">
          {clampedProgress.toFixed(0)}%
        </div>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  className?: string;
}

export function LoadingOverlay({ isVisible, text = 'Loading...', className = '' }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <LoadingSpinner type="spinner" size="lg" />
          <span className="text-lg font-medium text-gray-900">{text}</span>
        </div>
      </div>
    </div>
  );
}

// Shimmer effect for skeleton loading
export function Shimmer() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// Placeholder component for loading states
export function LoadingPlaceholder({ 
  type = 'skeleton', 
  lines = 3, 
  className = '' 
}: { 
  type?: 'skeleton' | 'shimmer'; 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {type === 'skeleton' ? (
        <Skeleton lines={lines} />
      ) : (
        Array.from({ length: lines }).map((_, i) => (
          <Shimmer key={i} />
        ))
      )}
    </div>
  );
}
