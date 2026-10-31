'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CIVIC_CATEGORIES,
  CivicCategory,
  Complaint,
  AdminMetrics,
} from '@/lib/types/complaint';
import { complaintService } from '@/lib/services/complaintService';
import { CATEGORY_ICON_MAP } from '@/components/common/CategoryBadge';
import { ComplaintCard } from '@/components/complaint/ComplaintCard';
import {
  PlusCircle,
  Search,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

const CATEGORY_DESCRIPTIONS: Record<CivicCategory, string> = {
  'Roads and footpaths': 'Potholes, damaged roads, and broken footpaths.',
  'Waste and sanitation': 'Garbage accumulation, overflowing bins, and missed collections.',
  'Water supply': 'Water shortages, leaking pipes, and water quality concerns.',
  'Drainage and flooding': 'Blocked drains, stagnant water, and flooding.',
  'Streetlights and electricity': 'Broken streetlights and exposed electrical hazards.',
  'Public transportation': 'Damaged bus stops and public transport service issues.',
  'Parks and public spaces': 'Damaged benches, playground equipment, and public litter.',
  'Public buildings and facilities': 'Damaged public buildings and poorly maintained facilities.',
  'Traffic safety': 'Unsafe crossings, damaged traffic signs, and road safety hazards.',
  'Trees and greenery': 'Fallen trees, damaged greenery, and overgrown vegetation.',
  'Encroachments and obstructions': 'Blocked footpaths and unauthorized obstructions.',
  'Other municipal services': 'Civic problems that do not fit another category.',
};

export default function HomePage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [list, kpis] = await Promise.all([
        complaintService.getComplaints(),
        complaintService.getMetrics(),
      ]);
      setComplaints(list.slice(0, 4)); // Show recent 4
      setMetrics(kpis);
    } catch (err) {
      console.error('Failed to load home page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-900 to-emerald-950 text-white p-8 sm:p-12 lg:p-16 shadow-lg">
        {/* Subtle geometric background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-400 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-600 blur-3xl"></div>
        </div>

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Open Civic Infrastructure</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Empowering Citizens, Improving Communities Together.
          </h1>

          <p className="text-base sm:text-lg text-emerald-100 max-w-2xl leading-relaxed">
            Report municipal concerns in under 2 minutes. Receive a real-time tracking code and follow every step of public service resolution with complete transparency.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/report"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-emerald-950 font-bold hover:bg-emerald-50 transition-colors shadow-md text-base"
            >
              <PlusCircle size={18} className="text-emerald-800" />
              <span>Report an Issue</span>
            </Link>

            <Link
              href="/track"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-800/60 border border-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors text-base"
            >
              <Search size={18} className="text-emerald-300" />
              <span>Track a Complaint</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Snapshot Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{metrics?.total ?? '...'}</p>
          <span className="text-xs text-slate-500">Citizen logged issues</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Fieldwork</span>
          <p className="mt-1 text-2xl font-bold text-orange-600">{metrics?.inProgress ?? '...'}</p>
          <span className="text-xs text-slate-500">Under active repair</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved Cases</span>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {(metrics?.resolved ?? 0) + (metrics?.closed ?? 0)}
          </p>
          <span className="text-xs text-slate-500">Successfully closed</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Rate</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {metrics?.total
              ? `${Math.round((((metrics.resolved + metrics.closed) / metrics.total) * 100))}%`
              : '...'}
          </p>
          <span className="text-xs text-slate-500">Public service efficiency</span>
        </div>
      </section>

      {/* Civic Categories Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Municipal Scope</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Civic Issue Categories</h2>
            <p className="text-sm text-slate-600 mt-1">
              Choose a category to report a civic issue.
            </p>
          </div>
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>Report another issue</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CIVIC_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICON_MAP[category];
            const desc = CATEGORY_DESCRIPTIONS[category];
            return (
              <Link
                key={category}
                href={`/report?category=${encodeURIComponent(category)}`}
                className="group bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-800 group-hover:text-white transition-colors mb-3">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {category}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800 group-hover:text-emerald-950">
                  <span>Report this issue</span>
                  <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Process Transparency</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">How CivicVoice Works</h2>
          <p className="text-sm text-slate-600">
            A simple 3-step lifecycle ensuring accountability from report to resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="relative bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="text-base font-semibold text-slate-900">1. Submit in 2 Minutes</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Describe the issue and specify the street location. No cumbersome account creation required.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="text-base font-semibold text-slate-900">2. Track in Real Time</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get an instant reference code (`CV-2026-00001`). Check the visual timeline at any time to see department triage and crew assignment.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="text-base font-semibold text-slate-900">3. Verified Resolution</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Field teams log resolution notes. The public status changes to Resolved with clear verification notes.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Public Reports Feed */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Public Transparency</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Recent Public Reports</h2>
            <p className="text-sm text-slate-600 mt-1">
              Issues logged across the community (citizen private contact information is protected).
            </p>
          </div>
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>Search by tracking ID</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-slate-500">Loading civic complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-sm text-slate-500">
            No complaints logged yet. Be the first to report an issue!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
