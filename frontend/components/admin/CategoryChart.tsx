'use client';

import React, { useEffect, useState } from 'react';
import { CategoryDistribution } from '@/lib/types/complaint';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CategoryChartProps {
  data: CategoryDistribution[];
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">Loading chart...</div>;
  }

  // Filter out categories with 0 count for a cleaner chart, or keep top ones
  const activeData = data
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);

  if (activeData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No complaint data to display in chart.
      </div>
    );
  }

  // Abbreviate long names for chart axis
  const formatLabel = (category: string) => {
    if (category.length > 14) {
      return category.slice(0, 12) + '...';
    }
    return category;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={activeData}
          margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
        >
          <XAxis
            dataKey="category"
            tickFormatter={formatLabel}
            tick={{ fontSize: 11, fill: '#64748b' }}
            interval={0}
            angle={-25}
            textAnchor="end"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            domain={[0, 'dataMax + 1']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value} report(s)`, 'Count']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {activeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? '#065f46' : index === 1 ? '#047857' : '#10b981'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
