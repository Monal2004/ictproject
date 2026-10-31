'use client';

import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus, COMPLAINT_STATUSES } from '@/lib/types/complaint';
import { StatusBadge } from '@/components/common/StatusBadge';
import { X, Check, AlertCircle } from 'lucide-react';

interface StatusUpdateModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, newStatus: ComplaintStatus, note?: string) => Promise<void>;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('Submitted');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setNote('');
      setError(null);
    }
  }, [complaint]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);
      await onUpdate(complaint.id, selectedStatus, note);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to update complaint status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              {complaint.referenceNumber}
            </span>
            <h3 id="modal-title" className="text-base font-bold text-slate-900 line-clamp-1">
              Update Resolution Status
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <span className="text-xs text-slate-500 block mb-1">Complaint:</span>
            <p className="text-sm font-semibold text-slate-800 line-clamp-1">
              {complaint.title}
            </p>
          </div>

          <div className="flex items-center gap-3 py-2 border-y border-slate-100 text-xs">
            <span className="text-slate-500">Current Status:</span>
            <StatusBadge status={complaint.status} size="sm" />
          </div>

          <div>
            <label htmlFor="newStatus" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select New Status:
            </label>
            <select
              id="newStatus"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              {COMPLAINT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="adminNote" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Internal Remark / Dispatch Note:
            </label>
            <textarea
              id="adminNote"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Field crew dispatched to repair pipeline. Expected completion in 48 hours."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
            />
            <span className="text-[11px] text-slate-400">
              This remark will be added to the public tracking audit trail.
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-sm font-semibold text-white hover:bg-emerald-900 transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Update Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
