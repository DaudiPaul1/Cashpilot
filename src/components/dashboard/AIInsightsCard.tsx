'use client';

import { AIInsight } from '@/types';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AIInsightsCardProps {
  insights: AIInsight[];
  loading?: boolean;
  error?: string | null;
}

export default function AIInsightsCard({ 
  insights, 
  loading = false, 
  error = null 
}: AIInsightsCardProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'health_score':
        return <TrendingUp className="h-5 w-5" />;
      case 'payment_reminder':
        return <Clock className="h-5 w-5" />;
      case 'expense_optimization':
        return <AlertTriangle className="h-5 w-5" />;
      case 'growth_opportunity':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'health_score':
        return 'text-blue-600 bg-blue-100';
      case 'payment_reminder':
        return 'text-yellow-600 bg-yellow-100';
      case 'expense_optimization':
        return 'text-red-600 bg-red-100';
      case 'growth_opportunity':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="h-6 w-6 bg-gray-200 rounded mr-3"></div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading insights</h3>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">
          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h3>
          <p className="text-gray-500 text-sm">Add more transactions to get AI-powered insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center mb-6">
        <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
      </div>

      <div className="space-y-4">
        {insights.slice(0, 3).map((insight) => (
          <div
            key={insight.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center mr-3 ${getInsightColor(insight.type)}`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{insight.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(insight.priority)}`}>
                      {insight.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      Score: {insight.score}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{insight.content}</p>

            {insight.actionable && insight.actionItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Action Items:</p>
                {insight.actionItems.slice(0, 2).map((action) => (
                  <div key={action.id} className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${action.completed ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <span className="text-xs text-gray-600">{action.title}</span>
                  </div>
                ))}
                {insight.actionItems.length > 2 && (
                  <p className="text-xs text-blue-600">+{insight.actionItems.length - 2} more</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {insights.length > 3 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all {insights.length} insights
          </button>
        </div>
      )}
    </div>
  );
}
