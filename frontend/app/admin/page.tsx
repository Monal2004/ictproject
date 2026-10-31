'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AdminMetrics,
  CategoryDistribution,
  CivicCategory,
  Complaint,
  ComplaintStatus,
  RecurringIssueCluster,
  SentimentDistribution,
  StatusDistribution,
} from '@/lib/types/complaint';
import { complaintService } from '@/lib/services/complaintService';
import { StatCard } from '@/components/common/StatCard';
import { CategoryChart } from '@/components/admin/CategoryChart';
import { StatusChart } from '@/components/admin/StatusChart';
import { SentimentChart } from '@/components/admin/SentimentChart';
import { RecurringIssuesCard } from '@/components/admin/RecurringIssuesCard';
import { ComplaintTable } from '@/components/admin/ComplaintTable';
import { StatusUpdateModal } from '@/components/admin/StatusUpdateModal';
import {
  Archive,
  BarChart3,
  CheckCircle2,
  Layers,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { authService, AuthUser } from '@/lib/api/auth';
import { LogOut } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [distribution, setDistribution] = useState<CategoryDistribution[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [sentimentDistribution, setSentimentDistribution] = useState<SentimentDistribution[]>([]);
  const [clusters, setClusters] = useState<RecurringIssueCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CivicCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | 'All'>('All');

  // Modal state
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadAdminData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
      }
      setError(null);
      const [list, kpis, dist, statusDist, sentimentDist, recurring] =
        await Promise.all([
          complaintService.getComplaints({
            searchQuery,
            category: selectedCategory,
            status: selectedStatus,
          }),
          complaintService.getMetrics(),
          complaintService.getCategoryDistribution(),
          complaintService.getStatusDistribution(),
          complaintService.getSentimentDistribution(),
          complaintService.getRecurringIssues(),
        ]);

      setComplaints(list);
      setMetrics(kpis);
      setDistribution(dist);
      setStatusDistribution(statusDist);
      setSentimentDistribution(sentimentDist);
      setClusters(recurring);
      setDbHealthy(true);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setDbHealthy(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the admin dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    const checkAuth = async () => {
      const current = await authService.me();
      if (!current || current.role !== 'ADMIN') {
        router.push('/admin/login');
        return;
      }
      setUser(current);
      setAuthChecked(true);
      loadAdminData(false);
    };
    checkAuth();
  }, [loadAdminData, router]);

  const handleStatusUpdate = async (id: string, newStatus: ComplaintStatus, note?: string) => {
    await complaintService.updateStatus(id, newStatus, note, user?.username || 'Admin');
    await loadAdminData(true);
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push('/admin/login');
  };

  const handleSelectCluster = (cluster: RecurringIssueCluster) => {
    setSelectedCategory(cluster.category);
    setSearchQuery(cluster.locationKeyword);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
  };

  if (!authChecked) {
    return <div className="py-12 text-center text-sm text-slate-500">Checking authentication...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Admin Environment Notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-2.5 text-slate-700 shadow-xs">
        <ShieldAlert size={20} className="text-slate-500 shrink-0" />
        <div className="text-xs">
          <span className="font-bold">Admin Environment:</span> Administrative status updates are enabled and persist in the CivicVoice MySQL database.
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <strong>Dashboard error:</strong> {error}
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Operations & Triage
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Municipal Issue Intelligence
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Monitor public reports, track department workloads, and dispatch maintenance crews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadAdminData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors self-start sm:self-auto shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors self-start sm:self-auto shadow-xs"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={metrics?.total ?? 0}
          icon={Layers}
          colorScheme="slate"
          description="Total recorded cases"
        />
        <StatCard
          title="Active Complaints"
          value={metrics?.activeCount ?? 0}
          icon={Wrench}
          colorScheme="amber"
          description="Submitted through in progress"
        />
        <StatCard
          title="Resolved"
          value={metrics?.resolved ?? 0}
          icon={CheckCircle2}
          colorScheme="emerald"
          description="Marked as resolved"
        />
        <StatCard
          title="Closed"
          value={metrics?.closed ?? 0}
          icon={Archive}
          colorScheme="slate"
          description="Completed and closed"
        />
      </div>

      {/* Intelligence & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Chart (2 cols on large) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-800">
                <BarChart3 size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Complaints by Civic Category</h3>
                <p className="text-xs text-slate-500">Distribution of active records</p>
              </div>
            </div>
          </div>
          <CategoryChart data={distribution} />
        </div>

        {/* Recurring Issues Cluster Card (1 col) */}
        <div className="lg:col-span-1">
          <RecurringIssuesCard
            clusters={clusters}
            onSelectCluster={handleSelectCluster}
          />
        </div>
      </div>

      {/* Status and Sentiment Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-sky-100 text-sky-800">
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Complaints by Status</h3>
              <p className="text-xs text-slate-500">Current resolution-stage distribution</p>
            </div>
          </div>
          <StatusChart data={statusDistribution} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-rose-100 text-rose-800">
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Complaint Wording Tone</h3>
              <p className="text-xs text-slate-500">VADER sentiment at submission time</p>
            </div>
          </div>
          <SentimentChart data={sentimentDistribution} />
          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
            Sentiment reflects the wording of the complaint, not its severity or whether it is true.
          </p>
        </div>
      </div>

      {/* Complaint Ledger Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Complaint Management Ledger</h2>
            <p className="text-xs text-slate-500">Search, filter, and transition complaint statuses in real time</p>
          </div>
        </div>

        <ComplaintTable
          complaints={complaints}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onResetFilters={handleResetFilters}
          onOpenUpdateModal={(c) => {
            setActiveComplaint(c);
            setModalOpen(true);
          }}
        />
      </div>

      {/* Status Update Modal */}
      <StatusUpdateModal
        complaint={activeComplaint}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveComplaint(null);
        }}
        onUpdate={handleStatusUpdate}
      />
    </div>
  );
}
