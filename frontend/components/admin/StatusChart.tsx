'use client';

import React, { useEffect, useState } from 'react';
import { StatusDistribution } from '@/lib/types/complaint';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface StatusChartProps {
  data: StatusDistribution[];
}

const STATUS_COLORS: Record<string, string> = {
  Submitted: '#0284c7',
  'Under Review': '#d97706',
  Assigned: '#4f46e5',
  'In Progress': '#ea580c',
  Resolved: '#059669',
  Closed: '#64748b',
};

export const StatusChart: React.FC<StatusChartProps> = ({ data }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Loading chart...
      </div>
    );
  }

  if (data.every((item) => item.count === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No complaint data to display in chart.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
          <XAxis
            dataKey="status"
            tick={{ fontSize: 10, fill: '#64748b' }}
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
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
