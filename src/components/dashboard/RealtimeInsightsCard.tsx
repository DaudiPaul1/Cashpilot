'use client';

import { useState, useEffect } from 'react';
import { Insight } from '@/types';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useOptimisticInsights } from '@/hooks/useOptimisticUpdates';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

interface RealtimeInsightsCardProps {
  limit?: number;
  showNewIndicator?: boolean;
  className?: string;
}

export default function RealtimeInsightsCard({ 
  limit = 5, 
  showNewIndicator = true,
  className = '' 
}: RealtimeInsightsCardProps) {
  const { insights } = useRealtimeData();
  const { applyOptimisticUpdates } = useOptimisticInsights();
  const [newInsights, setNewInsights] = useState<Set<string>>(new Set());
  const [previousInsightCount, setPreviousInsightCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // Apply optimistic updates
  const displayInsights = applyOptimisticUpdates(insights);
  const visibleInsights = showAll ? displayInsights : displayInsights.slice(0, limit);

  // Track new insights
  useEffect(() => {
    if (insights.length > previousInsightCount && showNewIndicator) {
      const newIds = insights
        .slice(0, insights.length - previousInsightCount)
        .map(i => i.id);
      
      setNewInsights(prev => new Set([...prev, ...newIds]));
      
      // Remove new indicator after 8 seconds
      setTimeout(() => {
        setNewInsights(prev => {
          const updated = new Set(prev);
          newIds.forEach(id => updated.delete(id));
          return updated;
        });
      }, 8000);
    }
    setPreviousInsightCount(insights.length);
  }, [insights.length, previousInsightCount, showNewIndicator]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'health_score':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'revenue_analysis':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'risk_assessment':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Standard';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(new Date(date));
    }
  };

  if (displayInsights.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No insights yet</p>
          <p className="text-sm">AI insights will appear here as your data grows</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showAll ? 'Show Less' : 'Show All'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {visibleInsights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border transition-all duration-300 ${
              getPriorityColor(insight.priority)
            } ${
              newInsights.has(insight.id)
                ? 'ring-2 ring-blue-300 animate-pulse'
                : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getInsightIcon(insight.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate">{insight.title}</h4>
                  <div className="flex items-center space-x-2">
                    {newInsights.has(insight.id) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                      insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getPriorityText(insight.priority)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{insight.content}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(insight.createdAt)}</span>
                  </div>
                  
                  {insight.score && (
                    <div className="flex items-center space-x-1">
                      <span>Score:</span>
                      <span className="font-medium">{insight.score}/100</span>
                    </div>
                  )}
                </div>

                {insight.actionItems && insight.actionItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Action Items:</p>
                    <ul className="space-y-1">
                      {insight.actionItems.slice(0, 2).map((action, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="line-clamp-1">{action.title}</span>
                        </li>
                      ))}
                      {insight.actionItems.length > 2 && (
                        <li className="text-xs text-blue-600">
                          +{insight.actionItems.length - 2} more actions
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayInsights.length > limit && !showAll && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => setShowAll(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all {displayInsights.length} insights
          </button>
        </div>
      )}
    </div>
  );
}
