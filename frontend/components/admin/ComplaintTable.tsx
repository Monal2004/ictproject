'use client';

import React from 'react';
import Link from 'next/link';
import {
  CivicCategory,
  CIVIC_CATEGORIES,
  Complaint,
  ComplaintStatus,
  COMPLAINT_STATUSES,
} from '@/lib/types/complaint';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { SentimentBadge } from '@/components/common/SentimentBadge';
import { formatDate } from '@/lib/utils/dateUtils';
import { Search, RotateCcw, ExternalLink, Edit3, MapPin } from 'lucide-react';

interface ComplaintTableProps {
  complaints: Complaint[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CivicCategory | 'All';
  onCategoryChange: (cat: CivicCategory | 'All') => void;
  selectedStatus: ComplaintStatus | 'All';
  onStatusChange: (status: ComplaintStatus | 'All') => void;
  onResetFilters: () => void;
  onOpenUpdateModal: (complaint: Complaint) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onResetFilters,
  onOpenUpdateModal,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedStatus !== 'All';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search reference, title, location, or keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-52">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value as CivicCategory | 'All')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="All">All Categories</option>
              {CIVIC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as ComplaintStatus | 'All')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="All">All Statuses</option>
              {COMPLAINT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors shrink-0"
              title="Reset all active filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong>{complaints.length}</strong> complaint{complaints.length === 1 ? '' : 's'}
          </span>
          {hasActiveFilters && <span className="text-emerald-700 font-medium">Filters Applied</span>}
        </div>
      </div>

      {/* Table Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-semibold text-[11px] sm:text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Ref Number</th>
              <th className="py-3 px-4">Title & Category</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Filed Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Sentiment</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No complaints match the current filter criteria.
                </td>
              </tr>
            ) : (
              complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                    <Link
                      href={`/complaints/${encodeURIComponent(c.referenceNumber)}`}
                      className="text-emerald-800 hover:text-emerald-950 underline decoration-emerald-300 underline-offset-2"
                    >
                      {c.referenceNumber}
                    </Link>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-900 block line-clamp-1">{c.title}</span>
                      <CategoryBadge category={c.category} size="sm" />
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 max-w-[200px] truncate">
                      <MapPin size={13} className="text-emerald-700 shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(c.createdAt)}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={c.status} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <SentimentBadge
                      sentiment={c.sentimentLabel}
                      score={c.sentimentScore}
                    />
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenUpdateModal(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
                      >
                        <Edit3 size={12} />
                        <span>Update</span>
                      </button>

                      <Link
                        href={`/complaints/${encodeURIComponent(c.referenceNumber)}`}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="View Full Details"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
