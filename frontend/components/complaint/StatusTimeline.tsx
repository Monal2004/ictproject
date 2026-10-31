import React from 'react';
import { ComplaintStatus, COMPLAINT_STATUSES, StatusHistoryItem } from '@/lib/types/complaint';
import { Check, Clock, CircleDot, AlertCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/dateUtils';

interface StatusTimelineProps {
  currentStatus: ComplaintStatus;
  statusHistory: StatusHistoryItem[];
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  statusHistory,
}) => {
  // Determine the index of the current status in the standard 6-step workflow
  const currentIdx = COMPLAINT_STATUSES.indexOf(currentStatus);

  // Find the most recent timestamp for a given status from history
  const getTimestampForStatus = (status: ComplaintStatus): string | undefined => {
    const item = [...statusHistory].reverse().find((h) => h.status === status);
    return item ? item.timestamp : undefined;
  };

  return (
    <div className="py-4">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Connecting track line */}
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0" />

        {COMPLAINT_STATUSES.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;
          const timestamp = getTimestampForStatus(step);

          return (
            <div key={step} className="flex-1 flex flex-col items-center relative z-10 px-2 text-center">
              {/* Node Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                  isCompleted
                    ? 'bg-emerald-800 text-white ring-4 ring-emerald-50'
                    : isCurrent
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check size={16} />
                ) : isCurrent ? (
                  <CircleDot size={18} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Status Label */}
              <span
                className={`mt-2.5 text-xs font-semibold ${
                  isCurrent
                    ? 'text-amber-800 font-bold'
                    : isCompleted
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {step}
              </span>

              {/* Timestamp if reached */}
              {timestamp ? (
                <span className="text-[10px] text-slate-500 mt-0.5 max-w-[100px] truncate">
                  {formatDateTime(timestamp)}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 mt-0.5">Pending</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Stepper (Vertical) */}
      <div className="md:hidden space-y-4 relative pl-6 border-l-2 border-slate-200 ml-4">
        {COMPLAINT_STATUSES.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;
          const timestamp = getTimestampForStatus(step);

          return (
            <div key={step} className="relative flex items-start gap-3">
              {/* Node marker */}
              <div
                className={`absolute -left-[31px] top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCompleted
                    ? 'bg-emerald-800 text-white'
                    : isCurrent
                    ? 'bg-amber-500 text-white ring-2 ring-amber-100'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? <Check size={12} /> : isCurrent ? <CircleDot size={12} /> : idx + 1}
              </div>

              <div className="pt-0.5">
                <span
                  className={`text-xs font-semibold block ${
                    isCurrent
                      ? 'text-amber-800 font-bold'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {timestamp ? formatDateTime(timestamp) : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
