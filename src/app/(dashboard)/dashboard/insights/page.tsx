'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react';

export default function InsightsPage() {
  const { user } = useAuth();
  const { 
    insights, 
    loading, 
    error,
    setInsights, 
    setLoading,
    setError 
  } = useData();

  // Load insights data
  useEffect(() => {
    if (!user?.uid) return;

    const loadInsightsData = async () => {
      try {
        setLoading('insights', true);
        setError('insights', null);

        // Mock insights data
        const mockInsights = [
          {
            id: '1',
            userId: user.uid,
            type: 'health_score' as const,
            title: 'Strong Financial Health',
            content: 'Your cash flow is positive and you have a healthy runway. Consider investing in growth opportunities.',
            score: 85,
            priority: 'low' as const,
            actionable: true,
            actionItems: [
              {
                id: '1',
                title: 'Review investment opportunities',
                description: 'Consider allocating some cash to growth initiatives',
                completed: false
              }
            ],
            metadata: {
              cashFlow: 40000,
              runway: 45
            },
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          {
            id: '2',
            userId: user.uid,
            type: 'expense_optimization' as const,
            title: 'High Technology Expenses',
            content: 'Your technology expenses are 35% of total costs. Consider reviewing software subscriptions.',
            score: 65,
            priority: 'medium' as const,
            actionable: true,
            actionItems: [
              {
                id: '2',
                title: 'Audit software subscriptions',
                description: 'Review and cancel unused software subscriptions',
                completed: false
              }
            ],
            metadata: {
              category: 'Technology',
              percentage: 35
            },
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          {
            id: '3',
            userId: user.uid,
            type: 'growth_opportunity' as const,
            title: 'Revenue Growth Opportunity',
            content: 'Your client payment cycle is excellent. Consider expanding to new markets.',
            score: 90,
            priority: 'high' as const,
            actionable: true,
            actionItems: [
              {
                id: '3',
                title: 'Market expansion research',
                description: 'Research potential new markets for expansion',
                completed: false
              }
            ],
            metadata: {
              paymentCycle: 12.5,
              growthPotential: 'high'
            },
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setInsights(mockInsights);
      } catch (err) {
        setError('insights', 'Failed to load insights');
      } finally {
        setLoading('insights', false);
      }
    };

    loadInsightsData();
  }, [user?.uid, setInsights, setLoading, setError]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Target className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-gray-600">Intelligent recommendations to improve your financial health.</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Insights Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Insights</p>
                <p className="text-2xl font-bold text-gray-900">{insights.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actionable Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {insights.filter(i => i.actionable).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {insights.length > 0 
                    ? Math.round(insights.reduce((sum, i) => sum + i.score, 0) / insights.length)
                    : 0
                  }/100
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {loading.insights ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : error.insights ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-red-600">Error loading insights: {error.insights}</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No insights available yet. Check back later!</p>
            </div>
          ) : (
            insights.map((insight) => (
              <div key={insight.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getPriorityColor(insight.priority)}`}>
                      {getPriorityIcon(insight.priority)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                          {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)} Priority
                        </span>
                        <span className="text-sm text-gray-500">Score: {insight.score}/100</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Details
                  </button>
                </div>

                <p className="text-gray-700 mb-4">{insight.content}</p>

                {insight.actionable && insight.actionItems.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Action Items:</h4>
                    <div className="space-y-2">
                      {insight.actionItems.map((action) => (
                        <div key={action.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={action.completed}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{action.title}</p>
                            <p className="text-xs text-gray-500">{action.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
