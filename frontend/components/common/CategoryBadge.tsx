import React from 'react';
import { CivicCategory } from '@/lib/types/complaint';
import {
  Milestone,
  Trash2,
  Droplet,
  CloudRain,
  Lightbulb,
  Bus,
  Trees,
  Building2,
  AlertTriangle,
  TreeDeciduous,
  ShieldAlert,
  Landmark,
  LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<CivicCategory, LucideIcon> = {
  'Roads and footpaths': Milestone,
  'Waste and sanitation': Trash2,
  'Water supply': Droplet,
  'Drainage and flooding': CloudRain,
  'Streetlights and electricity': Lightbulb,
  'Public transportation': Bus,
  'Parks and public spaces': Trees,
  'Public buildings and facilities': Building2,
  'Traffic safety': AlertTriangle,
  'Trees and greenery': TreeDeciduous,
  'Encroachments and obstructions': ShieldAlert,
  'Other municipal services': Landmark,
};

interface CategoryBadgeProps {
  category: CivicCategory;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showIcon = true,
  className = '',
  size = 'md',
}) => {
  const IconComponent = CATEGORY_ICON_MAP[category] || Landmark;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 ${
        isSm ? 'text-xs px-2 py-0.5' : 'text-xs sm:text-sm px-2.5 py-1'
      } font-medium ${className}`}
    >
      {showIcon && <IconComponent size={isSm ? 12 : 14} className="text-emerald-700" aria-hidden="true" />}
      <span className="truncate">{category}</span>
    </span>
  );
};
