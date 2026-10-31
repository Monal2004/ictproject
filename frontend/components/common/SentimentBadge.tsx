import React from 'react';
import { Frown, Meh, MinusCircle, Smile, LucideIcon } from 'lucide-react';
import { SentimentDisplay, SentimentLabel } from '@/lib/types/complaint';

interface SentimentBadgeProps {
  sentiment?: SentimentLabel | SentimentDisplay | null;
  score?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}

const CONFIG: Record<
  SentimentDisplay,
  { label: string; bg: string; text: string; border: string; icon: LucideIcon }
> = {
  positive: {
    label: 'Positive',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: Smile,
  },
  neutral: {
    label: 'Neutral',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Meh,
  },
  negative: {
    label: 'Negative',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: Frown,
  },
  unavailable: {
    label: 'Not analyzed',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: MinusCircle,
  },
};

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  score,
  size = 'sm',
  className = '',
}) => {
  const key: SentimentDisplay = sentiment || 'unavailable';
  const config = CONFIG[key];
  const Icon = config.icon;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${
        isSmall ? 'gap-1 px-2 py-0.5 text-xs' : 'gap-1.5 px-2.5 py-1 text-xs sm:text-sm'
      } font-medium ${className}`}
      title="Sentiment reflects the wording of the complaint, not its severity or whether it is true."
    >
      <Icon size={isSmall ? 12 : 14} aria-hidden="true" />
      <span>{config.label}</span>
      {score !== null && score !== undefined && (
        <span className="font-mono text-[10px] opacity-70">
          {score > 0 ? '+' : ''}
          {score.toFixed(2)}
        </span>
      )}
    </span>
  );
};
