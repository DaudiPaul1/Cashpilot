'use client';

import { useEffect, useState } from 'react';
import KPICard from './KPICard';
import { KPIs } from '@/types';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { calculateKPIs, convertToKPIs } from '@/lib/calculations';
import { useOptimisticKPIs } from '@/hooks/useOptimisticUpdates';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RealtimeKPICardProps {
  title: string;
  value: keyof KPIs;
  tooltip?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export default function RealtimeKPICard({ 
  title, 
  value, 
  tooltip, 
  formatValue,
  className 
}: RealtimeKPICardProps) {
  const { kpis, transactions } = useRealtimeData();
  const { applyOptimisticKPIs } = useOptimisticKPIs();
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  // Calculate real-time KPIs from transactions
  const realtimeKPIs = transactions.length > 0 
    ? convertToKPIs(calculateKPIs(transactions))
    : null;

  // Apply optimistic updates
  const displayKPIs = applyOptimisticKPIs(kpis || realtimeKPIs);

  const currentValue = displayKPIs?.[value] || 0;

  // Calculate trend
  useEffect(() => {
    if (previousValue !== null && previousValue !== currentValue) {
      if (currentValue > previousValue) {
        setTrend('up');
      } else if (currentValue < previousValue) {
        setTrend('down');
      } else {
        setTrend('stable');
      }
    }
    setPreviousValue(currentValue);
  }, [currentValue, previousValue]);

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

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDisplayValue = (val: number) => {
    if (formatValue) {
      return formatValue(val);
    }

    // Default formatting based on value type
    if (value.includes('Revenue') || value.includes('Cash') || value.includes('Amount')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }

    if (value.includes('Rate') || value.includes('Percentage')) {
      return `${val.toFixed(1)}%`;
    }

    if (value.includes('Days') || value.includes('Runway')) {
      return `${val.toFixed(0)} days`;
    }

    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <div className={`relative ${className}`}>
      <KPICard
        title={title}
        value={formatDisplayValue(currentValue)}
        tooltip={tooltip}
        className="transition-all duration-300 ease-in-out"
      />
      
      {/* Real-time indicator */}
      <div className="absolute top-2 right-2 flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-500">Live</span>
      </div>

      {/* Trend indicator */}
      {trend !== 'stable' && (
        <div className={`absolute bottom-2 right-2 flex items-center space-x-1 text-xs ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="font-medium">
            {trend === 'up' ? '+' : '-'}
            {Math.abs(currentValue - (previousValue || 0)).toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
