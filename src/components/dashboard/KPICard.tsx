'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  format: 'currency' | 'text' | 'percentage';
  loading?: boolean;
  tooltip?: string;
}

export default function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  format,
  loading = false,
  tooltip
}: KPICardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatChange = (change: number) => {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  const cardContent = (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {tooltip ? (
              <Tooltip content={tooltip}>
                <p className="text-sm font-medium text-gray-600">{title}</p>
              </Tooltip>
            ) : (
              <p className="text-sm font-medium text-gray-600">{title}</p>
            )}
          </div>
          {loading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-gray-400">Loading...</span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
          {change !== undefined && changeType !== 'neutral' && (
            <p className={`text-sm flex items-center mt-1 ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="ml-1">
                {formatChange(change)} vs last month
              </span>
            </p>
          )}
        </div>
        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );

  return cardContent;
}
