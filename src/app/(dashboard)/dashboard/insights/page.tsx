'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tooltip } from '@/components/ui/Tooltip';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Target,
  Zap,
  DollarSign,
  Users,
  Calendar,
  Brain,
  Activity,
  Shield,
  BarChart3
} from 'lucide-react';

export default function InsightsPage() {
  const { user } = useAuth();
  const { 
    insights, 
    loading, 
    error,
    setInsights, 
    setLoading,
    setError,
    transactions
  } = useData();

  // Transform AI insights to match our format
  const transformAIInsights = (aiInsights: any, healthScore: any, trends: any, risks: any) => {
    const transformed: any[] = [];
    
    // Add health score insight
    if (healthScore) {
      transformed.push({
        id: 'health-score',
        userId: user?.uid,
        type: 'health_score' as const,
        title: `Financial Health Score: ${healthScore.overall}/100`,
        content: `Your business has a ${healthScore.overall}/100 financial health score. ${healthScore.factors.positive.length > 0 ? 'Strengths: ' + healthScore.factors.positive.join(', ') : ''} ${healthScore.factors.negative.length > 0 ? 'Areas for improvement: ' + healthScore.factors.negative.join(', ') : ''}`,
        score: healthScore.overall,
        priority: healthScore.overall > 80 ? 'low' : healthScore.overall > 60 ? 'medium' : 'high',
        actionable: healthScore.factors.recommendations.length > 0,
        actionItems: healthScore.factors.recommendations.map((rec: string, index: number) => ({
          id: `health-${index}`,
          title: rec,
          description: rec,
          completed: false
        })),
        metadata: healthScore.categories,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }
    
    // Add AI-generated insights
    aiInsights.insights.forEach((insight: any, index: number) => {
      transformed.push({
        id: `ai-${index}`,
        userId: user?.uid,
        type: insight.category as any,
        title: insight.title,
        content: insight.description,
        score: insight.confidence,
        priority: insight.impact === 'high' ? 'high' : insight.impact === 'medium' ? 'medium' : 'low',
        actionable: insight.actionable,
        actionItems: insight.actionItems ? insight.actionItems.map((action: string, actionIndex: number) => ({
          id: `action-${index}-${actionIndex}`,
          title: action,
          description: action,
          completed: false
        })) : [],
        metadata: insight.data || {},
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    });
    
    // Add risk assessment
    if (risks && risks.level !== 'low') {
      transformed.push({
        id: 'risk-assessment',
        userId: user?.uid,
        type: 'risk_assessment' as const,
        title: `${risks.level.charAt(0).toUpperCase() + risks.level.slice(1)} Risk Level Detected`,
        content: `Your business has ${risks.level} risk factors. ${risks.recommendations.join(' ')}`,
        score: risks.level === 'critical' ? 20 : risks.level === 'high' ? 40 : 60,
        priority: risks.level === 'critical' ? 'critical' : 'high',
        actionable: risks.recommendations.length > 0,
        actionItems: risks.recommendations.map((rec: string, index: number) => ({
          id: `risk-${index}`,
          title: rec,
          description: rec,
          completed: false
        })),
        metadata: risks.factors,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }
    
    return transformed;
  };

  // Load insights data
  useEffect(() => {
    if (!user?.uid || !transactions) return;

    const loadInsightsData = async () => {
      try {
        setLoading('insights', true);
        setError('insights', null);

        // Get auth token for API call
        const token = await user.getIdToken();
        
        // Call AI insights API
        const response = await fetch('/api/ai/insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            transactions,
            shopifyOrders: [],
            quickbooksInvoices: [],
            quickbooksBills: []
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate insights');
        }

        const data = await response.json();
        
        if (data.success) {
          // Transform AI insights to match our format
          const transformedInsights = transformAIInsights(data.insights, data.healthScore, data.trends, data.risks);
          setInsights(transformedInsights);
        } else {
          throw new Error(data.error || 'Failed to generate insights');
        }
      } catch (err) {
        console.error('Error loading insights:', err);
        setError('insights', 'Failed to load insights');
        
        // Fallback to mock data if API fails
        const mockInsights = [
          {
            id: '1',
            userId: user?.uid,
            type: 'health_score' as const,
            title: 'Strong Financial Health',
            content: 'Your business is making more money than it\'s spending. Consider investing in marketing or new equipment to grow faster.',
            score: 85,
            priority: 'low' as const,
            actionable: true,
            actionItems: [
              {
                id: '1',
                title: 'Increase marketing budget',
                description: 'Allocate $2,000 more to marketing this month to attract new customers',
                completed: false
              },
              {
                id: '2',
                title: 'Review pricing strategy',
                description: 'Your profit margins suggest you could raise prices by 5-10%',
                completed: false
              }
            ],
            metadata: {
              cashFlow: 40000,
              runway: 45
            },
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ];

        setInsights(mockInsights);
      } finally {
        setLoading('insights', false);
      }
    };

    loadInsightsData();
  }, [user?.uid, transactions, setInsights, setLoading, setError]);

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
                <div className="flex items-center mb-2">
                  <Tooltip content="Total number of insights available to help improve your business performance.">
                    <p className="text-sm font-medium text-gray-600">Available Insights</p>
                  </Tooltip>
                </div>
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
                <div className="flex items-center mb-2">
                  <Tooltip content="Number of actionable steps you can take to improve your business right now.">
                    <p className="text-sm font-medium text-gray-600">Action Items</p>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {insights.filter(i => i.actionable).reduce((sum, i) => sum + i.actionItems.length, 0)}
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
                <div className="flex items-center mb-2">
                  <Tooltip content="Overall business health score based on your financial performance and growth potential.">
                    <p className="text-sm font-medium text-gray-600">Business Score</p>
                  </Tooltip>
                </div>
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
                    <h4 className="text-sm font-medium text-gray-900 mb-3">What You Can Do:</h4>
                    <div className="space-y-3">
                      {insight.actionItems.map((action) => (
                        <div key={action.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={action.completed}
                            readOnly
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{action.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{action.description}</p>
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
