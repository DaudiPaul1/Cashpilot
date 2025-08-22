import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartProps, ChartDataPoint } from '../../types';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface CashFlowChartProps extends ChartProps {
  view?: 'line' | 'area' | 'bar' | 'pie';
  showNet?: boolean;
  showIncome?: boolean;
  showExpenses?: boolean;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({
  data,
  height = 400,
  showLegend = true,
  view = 'line',
  showNet = true,
  showIncome = true,
  showExpenses = true
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date for x-axis
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-2">
            {new Date(label).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = ({ payload }: any) => {
    if (!showLegend) return null;

    return (
      <div className="flex items-center justify-center space-x-6 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Calculate summary statistics
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const totalNet = data.reduce((sum, item) => sum + item.net, 0);
  const avgNet = totalNet / data.length;

  // Color scheme
  const colors = {
    income: '#10B981',
    expenses: '#EF4444',
    net: '#3B82F6',
  };

  // Render different chart types
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (view) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {showIncome && (
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke={colors.income}
                fill={colors.income}
                fillOpacity={0.3}
                name="Income"
              />
            )}
            {showExpenses && (
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="1"
                stroke={colors.expenses}
                fill={colors.expenses}
                fillOpacity={0.3}
                name="Expenses"
              />
            )}
            {showNet && (
              <Area
                type="monotone"
                dataKey="net"
                stroke={colors.net}
                fill={colors.net}
                fillOpacity={0.1}
                name="Net"
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {showIncome && (
              <Bar
                dataKey="income"
                fill={colors.income}
                radius={[4, 4, 0, 0]}
                name="Income"
              />
            )}
            {showExpenses && (
              <Bar
                dataKey="expenses"
                fill={colors.expenses}
                radius={[4, 4, 0, 0]}
                name="Expenses"
              />
            )}
            {showNet && (
              <Bar
                dataKey="net"
                fill={colors.net}
                radius={[4, 4, 0, 0]}
                name="Net"
              />
            )}
          </BarChart>
        );

      case 'pie':
        const pieData = [
          { name: 'Income', value: totalIncome, color: colors.income },
          { name: 'Expenses', value: totalExpenses, color: colors.expenses },
        ];

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={activeIndex === index ? 1 : 0.8}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), '']}
            />
          </PieChart>
        );

      default: // line chart
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {showIncome && (
              <Line
                type="monotone"
                dataKey="income"
                stroke={colors.income}
                strokeWidth={3}
                dot={{ fill: colors.income, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors.income, strokeWidth: 2 }}
                name="Income"
              />
            )}
            {showExpenses && (
              <Line
                type="monotone"
                dataKey="expenses"
                stroke={colors.expenses}
                strokeWidth={3}
                dot={{ fill: colors.expenses, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors.expenses, strokeWidth: 2 }}
                name="Expenses"
              />
            )}
            {showNet && (
              <Line
                type="monotone"
                dataKey="net"
                stroke={colors.net}
                strokeWidth={4}
                dot={{ fill: colors.net, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: colors.net, strokeWidth: 2 }}
                name="Net"
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cash Flow</h3>
          <p className="text-sm text-gray-500">
            {data.length} days of financial data
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Summary stats */}
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className={`font-medium ${totalNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(totalNet)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {showLegend && view !== 'pie' && (
        <CustomLegend payload={[
          { value: 'Income', color: colors.income },
          { value: 'Expenses', color: colors.expenses },
          { value: 'Net', color: colors.net },
        ]} />
      )}

      {/* Mobile summary */}
      <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Income</p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Expenses</p>
            <p className="text-sm font-semibold text-red-600">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Net</p>
            <p className={`text-sm font-semibold ${totalNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(totalNet)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowChart;
