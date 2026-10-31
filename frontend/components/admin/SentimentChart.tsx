'use client';

import React, { useEffect, useState } from 'react';
import { SentimentDistribution } from '@/lib/types/complaint';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface SentimentChartProps {
  data: SentimentDistribution[];
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#059669',
  neutral: '#d97706',
  negative: '#e11d48',
  unavailable: '#94a3b8',
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  unavailable: 'Not analyzed',
};

export const SentimentChart: React.FC<SentimentChartProps> = ({ data }) => {
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

  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No sentiment data yet.
      </div>
    );
  }

  const chartData = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      ...item,
      label: SENTIMENT_LABELS[item.sentiment] || item.sentiment,
    }));

  return (
    <div className="w-full">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={78}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.sentiment}
                  fill={SENTIMENT_COLORS[entry.sentiment] || '#94a3b8'}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
              }}
              formatter={(value: number, _name, item) => [
                `${value} report(s)`,
                item?.payload?.label || 'Count',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {data.map((item) => (
          <div
            key={item.sentiment}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs"
          >
            <span className="flex items-center gap-1.5 text-slate-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: SENTIMENT_COLORS[item.sentiment] || '#94a3b8',
                }}
              />
              {SENTIMENT_LABELS[item.sentiment] || item.sentiment}
            </span>
            <span className="font-semibold text-slate-800">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
