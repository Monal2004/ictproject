'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Complaint } from '@/lib/types/complaint';
import { complaintService } from '@/lib/services/complaintService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { SentimentBadge } from '@/components/common/SentimentBadge';
import { StatusTimeline } from '@/components/complaint/StatusTimeline';
import { formatDate, formatDateTime } from '@/lib/utils/dateUtils';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  History,
  AlertCircle,
  LayoutDashboard,
  Search,
} from 'lucide-react';

export default function ComplaintDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaint = async () => {
      if (!id) return;
      try {
        const found = await complaintService.getComplaintByReference(
          decodeURIComponent(id)
        );
        setComplaint(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading complaint record...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Complaint Record Not Found</h1>
        <p className="text-sm text-slate-500">
          No complaint with that reference exists in the CivicVoice database.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-800 text-white text-sm font-medium hover:bg-emerald-900 transition-colors"
          >
            <Search size={14} />
            <span>Search Tracking Registry</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/track"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Tracker</span>
        </Link>

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors"
        >
          <LayoutDashboard size={14} />
          <span>Admin Console</span>
        </Link>
      </div>

      {/* Main Complaint Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {complaint.referenceNumber}
              </span>
              <CategoryBadge category={complaint.category} size="sm" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {complaint.title}
            </h1>
          </div>
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            <SentimentBadge
              sentiment={complaint.sentimentLabel}
              score={complaint.sentimentScore}
            />
            <StatusBadge status={complaint.status} size="lg" />
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
            Resolution Lifecycle
          </span>
          <StatusTimeline
            currentStatus={complaint.status}
            statusHistory={complaint.statusHistory}
          />
        </div>

        {/* Location & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50">
            <MapPin size={16} className="text-emerald-700 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Location</span>
              <span className="font-medium text-slate-800">{complaint.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50">
            <Calendar size={16} className="text-emerald-700 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date Filed</span>
              <span className="font-medium text-slate-800">{formatDate(complaint.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-slate-900">Issue Details</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
            {complaint.description}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sentiment reflects the wording of the complaint, not its severity or whether it is true.
          </p>
        </div>

        {/* Complete Audit Trail */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <History size={16} className="text-emerald-800" />
            <h2 className="text-sm font-semibold text-slate-900">Complete Audit Trail</h2>
          </div>

          <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {complaint.statusHistory.map((item, i) => (
              <div key={i} className="relative pl-8 flex flex-col gap-0.5 text-xs">
                <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full border-2 border-emerald-700 bg-white" />
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} size="sm" showIcon={false} />
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-500">{formatDateTime(item.timestamp)}</span>
                  {item.updatedBy && (
                    <>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-600 font-medium">{item.updatedBy}</span>
                    </>
                  )}
                </div>
                {item.note && (
                  <p className="text-slate-700 mt-1 pl-1 bg-slate-50 py-1 px-2 rounded border border-slate-100">
                    {item.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
