import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  colorScheme?: 'emerald' | 'amber' | 'blue' | 'slate' | 'orange';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorScheme = 'emerald',
}) => {
  const colorStyles = {
    emerald: {
      iconBg: 'bg-emerald-100 text-emerald-800',
      border: 'border-emerald-100',
    },
    amber: {
      iconBg: 'bg-amber-100 text-amber-800',
      border: 'border-amber-100',
    },
    blue: {
      iconBg: 'bg-sky-100 text-sky-800',
      border: 'border-sky-100',
    },
    orange: {
      iconBg: 'bg-orange-100 text-orange-800',
      border: 'border-orange-100',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-800',
      border: 'border-slate-200',
    },
  };

  const scheme = colorStyles[colorScheme] || colorStyles.emerald;

  return (
    <div className={`bg-white rounded-xl border ${scheme.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <div className={`p-2.5 rounded-lg ${scheme.iconBg}`}>
          <Icon size={20} aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && <span className="text-xs font-medium text-emerald-700">{trend}</span>}
      </div>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </div>
  );
};
