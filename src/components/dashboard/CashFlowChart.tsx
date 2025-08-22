'use client';

import { Transaction } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface CashFlowChartProps {
  data: Transaction[];
  loading?: boolean;
}

export default function CashFlowChart({ data, loading = false }: CashFlowChartProps) {
  // Process data for chart
  const processChartData = () => {
    if (!data || data.length === 0) return [];

    // Get date range (last 30 days)
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    
    // Create date range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group transactions by date
    const transactionsByDate = data.reduce((acc, transaction) => {
      const date = format(transaction.date, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[date].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        acc[date].expenses += transaction.amount;
      }
      
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    // Create chart data
    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayData = transactionsByDate[dateStr] || { income: 0, expenses: 0 };
      
      return {
        date: format(date, 'MMM dd'),
        income: dayData.income,
        expenses: dayData.expenses,
        net: dayData.income - dayData.expenses
      };
    });
  };

  const chartData = processChartData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-80 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-500">Add some transactions to see your cash flow chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => [formatCurrency(value), '']}
            labelStyle={{ color: '#374151', fontWeight: '600' }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            name="Income"
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            name="Expenses"
          />
          <Line 
            type="monotone" 
            dataKey="net" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            name="Net Cash Flow"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
