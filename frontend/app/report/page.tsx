'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CivicCategory,
  CIVIC_CATEGORIES,
  Complaint,
} from '@/lib/types/complaint';
import { complaintService } from '@/lib/services/complaintService';
import { ApiError } from '@/lib/api/client';
import {
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  PlusCircle,
  AlertCircle,
  HelpCircle,
  Search,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';

function ReportFormContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get('category');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CivicCategory | ''>('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialCategoryParam) {
      const match = CIVIC_CATEGORIES.find(
        (c) => c.toLowerCase() === initialCategoryParam.toLowerCase()
      );
      if (match) {
        setCategory(match);
      }
    }
  }, [initialCategoryParam]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Title is required.';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters.';
    } else if (title.trim().length > 100) {
      errs.title = 'Title cannot exceed 100 characters.';
    }

    if (!category) {
      errs.category = 'Please select a civic category.';
    }

    if (!location.trim()) {
      errs.location = 'Location or street address is required.';
    } else if (location.trim().length < 3) {
      errs.location = 'Location must be at least 3 characters.';
    } else if (location.trim().length > 150) {
      errs.location = 'Location cannot exceed 150 characters.';
    }

    if (!description.trim()) {
      errs.description = 'Description is required.';
    } else if (description.trim().length < 20) {
      errs.description = 'Description must be at least 20 characters for field teams to investigate.';
    } else if (description.trim().length > 2000) {
      errs.description = 'Description cannot exceed 2000 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const created = await complaintService.createComplaint({
        title,
        category: category as CivicCategory,
        location,
        description,
      });
      setSubmittedComplaint(created);
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        if (err.fields) {
          setErrors(err.fields);
        } else {
          alert(err.message);
        }
      } else {
        alert('Failed to submit the complaint. Please check the Flask API and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyRefToClipboard = () => {
    if (submittedComplaint?.referenceNumber) {
      navigator.clipboard.writeText(submittedComplaint.referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setLocation('');
    setDescription('');
    setErrors({});
    setSubmittedComplaint(null);
  };

  // SUCCESS CONFIRMATION STATE
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Report Submitted Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Your Civic Issue Has Been Logged
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your complaint has been saved to the municipal registry. Keep your tracking reference number to follow resolution progress.
            </p>
          </div>

          {/* Highlighted Reference Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Tracking Reference Number
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-wider">
                {submittedComplaint.referenceNumber}
              </span>
              <button
                type="button"
                onClick={copyRefToClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
                title="Copy code to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <p className="text-xs text-emerald-700">
              Save or screenshot this code to track your issue anytime.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/track?ref=${encodeURIComponent(submittedComplaint.referenceNumber)}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900 transition-colors shadow-xs text-sm"
            >
              <Search size={16} />
              <span>Track This Issue Now</span>
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              <PlusCircle size={16} />
              <span>Submit Another Report</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 text-center">
          <p>
            <strong>Development Demo:</strong> This complaint has been saved to the CivicVoice MySQL database and will remain available after a service restart.
          </p>
        </div>
      </div>
    );
  }

  // ACTIVE REPORTING FORM
  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="space-y-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-800 transition-colors mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Report a Civic Issue
        </h1>
        <p className="text-sm text-slate-600">
          Provide accurate details so municipal service teams can investigate and dispatch maintenance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form (2 columns on large screens) */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6"
            noValidate
          >
            {/* Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="title" className="block text-sm font-semibold text-slate-800">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400">{title.length}/100</span>
              </div>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="e.g. Hazardous pothole near elementary school crosswalk"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                  errors.title
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500'
                    : 'border-slate-300 focus:border-emerald-600'
                }`}
              />
              {errors.title && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Civic Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CivicCategory)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none transition-colors ${
                  errors.category
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500'
                    : 'border-slate-300 focus:border-emerald-600'
                }`}
              >
                <option value="">Select a civic category...</option>
                {CIVIC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errors.category}</span>
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="location" className="block text-sm font-semibold text-slate-800">
                  Street Address or Landmark <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400">{location.length}/150</span>
              </div>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={150}
                placeholder="e.g. Corner of 5th Avenue & Elm Street, North Ward"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                  errors.location
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500'
                    : 'border-slate-300 focus:border-emerald-600'
                }`}
              />
              {errors.location && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errors.location}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="description" className="block text-sm font-semibold text-slate-800">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400">
                  {description.length}/2000 (min 20)
                </span>
              </div>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder="Please describe the issue in detail: when did it start, how severe is it, and any hazards to pedestrians or vehicles..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                  errors.description
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500'
                    : 'border-slate-300 focus:border-emerald-600'
                }`}
              />
              {errors.description && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errors.description}</span>
                </p>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                <span className="text-red-500">*</span> Required municipal fields
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900 transition-colors shadow-xs text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Issue Report</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Guidance & Tips */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <HelpCircle size={18} />
              <span>What Makes a Good Report?</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-1 shrink-0" />
                <span>
                  <strong>Precise location:</strong> Include cross-streets, house numbers, or nearby prominent landmarks.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-1 shrink-0" />
                <span>
                  <strong>Specific details:</strong> Note the size of the pothole, duration of the water leak, or number of dark lamps.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-1 shrink-0" />
                <span>
                  <strong>Useful context:</strong> Mention nearby landmarks, how long the issue has existed, and who or what it affects.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-2 text-emerald-950">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <ShieldAlert size={18} className="text-emerald-800" />
              <span>Privacy Guaranteed</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              CivicVoice never asks for or displays personal phone numbers, emails, or personal identification on public feeds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading form...</div>}>
      <ReportFormContent />
    </Suspense>
  );
}
