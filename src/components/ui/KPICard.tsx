import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPICardProps } from '../../types';

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  color,
  icon
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: 'text-green-600',
          change: 'text-green-600'
        };
      case 'red':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: 'text-red-600',
          change: 'text-red-600'
        };
      case 'blue':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: 'text-blue-600',
          change: 'text-blue-600'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: 'text-yellow-600',
          change: 'text-yellow-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-600',
          change: 'text-gray-600'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border p-6 transition-all duration-200 hover:shadow-md
        ${colors.bg} ${colors.border}
      `}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-current"></div>
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-current"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center space-x-2 ${colors.text}`}>
            {icon && (
              <div className={`p-2 rounded-lg bg-white/50 ${colors.icon}`}>
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium">{title}</h3>
          </div>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-xs font-medium ${colors.change}`}>
              {change}
            </span>
          </div>
        </div>

        {/* Value */}
        <div className="mb-2">
          <p className={`text-2xl font-bold ${colors.text}`}>
            {typeof value === 'number' && value >= 1000 
              ? `$${(value / 1000).toFixed(1)}k`
              : typeof value === 'number' && value < 0
              ? `-$${Math.abs(value).toLocaleString()}`
              : typeof value === 'number'
              ? `$${value.toLocaleString()}`
              : value
            }
          </p>
        </div>

        {/* Additional info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>vs last period</span>
          <span className="font-medium">Updated now</span>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default KPICard;
