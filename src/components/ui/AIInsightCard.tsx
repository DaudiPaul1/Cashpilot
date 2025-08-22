import React, { useState } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Star
} from 'lucide-react';
import { InsightCardProps, AIInsight } from '../../types';

const AIInsightCard: React.FC<InsightCardProps> = ({
  insight,
  onRefresh,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'positive':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          accent: 'text-green-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          accent: 'text-yellow-600'
        };
      case 'recommendation':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          accent: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          accent: 'text-gray-600'
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  const colors = getCategoryColor(insight.category);

  return (
    <div className={`rounded-xl border p-6 transition-all duration-200 hover:shadow-md ${colors.bg} ${colors.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg bg-white/50 ${colors.accent}`}>
            {getCategoryIcon(insight.category)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {insight.title}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Generated today</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4" />
                <span className={getScoreColor(insight.score)}>
                  {getScoreLabel(insight.score)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Score indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  insight.score >= 0.8 ? 'bg-green-500' :
                  insight.score >= 0.6 ? 'bg-yellow-500' :
                  insight.score >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${insight.score * 100}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${getScoreColor(insight.score)}`}>
              {Math.round(insight.score * 100)}
            </span>
          </div>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors ${
                isLoading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white/50 text-gray-600 hover:bg-white hover:text-gray-800'
              }`}
              title="Generate new insight"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-white/50 text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
            title={isExpanded ? 'Show less' : 'Show more'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Main content */}
        <div className={`text-gray-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
          {insight.content}
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Recommendation */}
            {insight.metadata?.recommendation && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Recommendation
                    </h4>
                    <p className="text-sm text-blue-800">
                      {insight.metadata.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Positive observation */}
            {insight.metadata?.positiveObservation && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-900 mb-1">
                      ✅ Positive Observation
                    </h4>
                    <p className="text-sm text-green-800">
                      {insight.metadata.positiveObservation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Key metrics */}
            {insight.metadata?.keyMetrics && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  📊 Key Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(insight.metadata.keyMetrics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {typeof value === 'number' 
                          ? value >= 1000 
                            ? `$${(value / 1000).toFixed(1)}k`
                            : `$${value.toLocaleString()}`
                          : value
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>AI Generated</span>
            <span>•</span>
            <span>Financial Insight</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Save
            </button>
            <button
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Take Action
            </button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Generating new insight...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightCard;
