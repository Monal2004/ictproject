import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      {/* Educational Notice Banner */}
      <div className="bg-emerald-50 border-b border-emerald-100 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-emerald-900">
          <Info size={14} className="text-emerald-700 shrink-0" />
          <span>
            <strong>Development Demo:</strong> Civic reports are stored in the CivicVoice database. This is not connected to a live municipal authority.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-10">
          {/* Brand Col */}
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-900 text-white flex items-center justify-center font-bold">
                <ShieldAlert size={16} className="text-emerald-300" />
              </div>
              <span className="font-bold text-base text-slate-900">CivicVoice</span>
            </div>
            <p className="text-sm text-slate-500 max-w-md">
              A transparent issue intelligence portal allowing citizens to submit civic concerns and follow public service resolution.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:w-56 shrink-0">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-emerald-800 transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-emerald-800 transition-colors">
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-emerald-800 transition-colors">
                  Track Complaint Progress
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-800 transition-colors">
                  Admin Operations
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} CivicVoice. Development MVP.</p>
          <p>Local demonstration environment</p>
        </div>
      </div>
    </footer>
  );
};
