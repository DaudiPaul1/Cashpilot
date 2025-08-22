'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  loading?: boolean;
}

export default function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  format = 'text',
  loading = false
}: KPICardProps) {
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(val);
        case 'percentage':
          return `${val.toFixed(1)}%`;
        case 'number':
          return new Intl.NumberFormat('en-US').format(val);
        default:
          return val.toString();
      }
    }
    return val;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && (
          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            {icon}
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </p>
      </div>
      
      {change !== undefined && (
        <div className={`flex items-center text-sm ${getChangeColor(changeType)}`}>
          {getChangeIcon(changeType)}
          <span className="ml-1 font-medium">
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="ml-1 text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
