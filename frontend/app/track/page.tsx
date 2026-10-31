'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Complaint } from '@/lib/types/complaint';
import { complaintService } from '@/lib/services/complaintService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { SentimentBadge } from '@/components/common/SentimentBadge';
import { StatusTimeline } from '@/components/complaint/StatusTimeline';
import { formatDate, formatDateTime } from '@/lib/utils/dateUtils';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  HelpCircle,
  FileText,
  AlertTriangle,
  History,
  ExternalLink,
} from 'lucide-react';

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRef = searchParams.get('ref') || '';

  const [refInput, setRefInput] = useState(initialRef);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const performSearch = async (refNumber: string) => {
    const normalized = refNumber.trim().toUpperCase();
    if (!normalized) return;
    setRefInput(normalized);
    setLoading(true);
    setSearched(true);
    try {
      const found = await complaintService.getComplaintByReference(normalized);
      setComplaint(found);
    } catch (err) {
      console.error(err);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      setRefInput(initialRef);
      performSearch(initialRef);
    }
  }, [initialRef]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = refInput.trim().toUpperCase();
    if (normalized) {
      router.push(`/track?ref=${encodeURIComponent(normalized)}`);
      performSearch(normalized);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          Public Issue Registry
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Track Your Complaint
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Enter your unique reference number (e.g., CV-2026-00001) to view department triage and resolution status.
        </p>
      </div>

      {/* Search Bar Form */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="Enter reference number (e.g. CV-2026-00001)"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 uppercase font-mono tracking-wider transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !refInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900 transition-colors shadow-xs text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Track Complaint</span>
              </>
            )}
          </button>
        </div>

        <p className="pt-1 text-xs text-slate-500">
          Reference numbers use the format <span className="font-mono font-semibold">CV-YYYY-NNNNN</span>. You received one when the report was submitted.
        </p>
      </form>

      {/* Result Section */}
      {searched && (
        <>
          {complaint ? (
            <div className="space-y-6">
              {/* Main Complaint Overview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {complaint.referenceNumber}
                      </span>
                      <CategoryBadge category={complaint.category} size="sm" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 pt-1">
                      {complaint.title}
                    </h2>
                  </div>
                  <div className="shrink-0 flex flex-wrap items-center gap-2">
                    <SentimentBadge
                      sentiment={complaint.sentimentLabel}
                      score={complaint.sentimentScore}
                    />
                    <StatusBadge status={complaint.status} size="lg" />
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                    Resolution Lifecycle
                  </span>
                  <StatusTimeline
                    currentStatus={complaint.status}
                    statusHistory={complaint.statusHistory}
                  />
                </div>

                {/* Meta details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 bg-white">
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

                {/* Narrative */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold text-slate-900">Issue Description</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {complaint.description}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sentiment reflects the wording of the complaint, not its severity or whether it is true.
                  </p>
                </div>

                {/* Audit History Timeline */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-emerald-800" />
                    <h3 className="text-sm font-semibold text-slate-900">Chronological Audit History</h3>
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

                {/* Shareable Link */}
                <div className="pt-2 flex justify-end">
                  <Link
                    href={`/complaints/${encodeURIComponent(complaint.referenceNumber)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
                  >
                    <span>Permanent Link to Details</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Not Found State */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  No Complaint Found for &ldquo;{refInput}&rdquo;
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Reference numbers are formatted like <strong>CV-2026-00001</strong>. Please check your tracking code and try again.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 text-white font-medium hover:bg-emerald-900 transition-colors text-sm"
                >
                  <span>File a New Complaint</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading tracking portal...</div>}>
      <TrackContent />
    </Suspense>
  );
}
