import React from 'react';
import { RecurringIssueCluster } from '@/lib/types/complaint';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { AlertTriangle, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RecurringIssuesCardProps {
  clusters: RecurringIssueCluster[];
  onSelectCluster?: (cluster: RecurringIssueCluster) => void;
}

export const RecurringIssuesCard: React.FC<RecurringIssuesCardProps> = ({
  clusters,
  onSelectCluster,
}) => {
  if (clusters.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
          <CheckCircle2 size={20} />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">No Recurring Clusters</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Complaints appear evenly distributed. No hotspots with 2+ duplicate issues detected.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-100 text-amber-800">
            <AlertTriangle size={16} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Recurring Problem Intelligence</h4>
            <p className="text-xs text-slate-500">Clusters of 2+ complaints in the same vicinity</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
          {clusters.length} Hotspots
        </span>
      </div>

      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {clusters.map((cluster, i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300 transition-colors space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <CategoryBadge category={cluster.category} size="sm" />
              <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                {cluster.count} Reports
              </span>
            </div>

            <div className="flex items-start gap-1.5 text-xs text-slate-700">
              <MapPin size={13} className="text-emerald-700 mt-0.5 shrink-0" />
              <span className="font-medium">{cluster.locationKeyword}</span>
            </div>

            <div className="text-[11px] text-slate-500 truncate">
              {cluster.sampleTitles.slice(0, 2).join(' • ')}
            </div>

            {onSelectCluster && (
              <button
                type="button"
                onClick={() => onSelectCluster(cluster)}
                className="w-full pt-1 flex items-center justify-between text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
              >
                <span>Filter ledger by this hotspot</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
