import React from 'react';
import Link from 'next/link';
import { Complaint } from '@/lib/types/complaint';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { formatRelativeTime } from '@/lib/utils/dateUtils';
import { MapPin, ArrowRight, Clock } from 'lucide-react';

interface ComplaintCardProps {
  complaint: Complaint;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint }) => {
  return (
    <article className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <CategoryBadge category={complaint.category} size="sm" />
          <StatusBadge status={complaint.status} size="sm" />
        </div>

        <Link
          href={`/complaints/${encodeURIComponent(complaint.referenceNumber)}`}
          className="group block"
        >
          <h3 className="font-semibold text-base text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
            {complaint.title}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {complaint.description}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={13} className="text-emerald-700 shrink-0" />
          <span className="truncate">{complaint.location}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{formatRelativeTime(complaint.createdAt)}</span>
        </div>
        <Link
          href={`/complaints/${encodeURIComponent(complaint.referenceNumber)}`}
          className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>View Details</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
};
