export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export const COMPLAINT_STATUSES: readonly ComplaintStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
] as const;

export type CivicCategory =
  | 'Roads and footpaths'
  | 'Waste and sanitation'
  | 'Water supply'
  | 'Drainage and flooding'
  | 'Streetlights and electricity'
  | 'Public transportation'
  | 'Parks and public spaces'
  | 'Public buildings and facilities'
  | 'Traffic safety'
  | 'Trees and greenery'
  | 'Encroachments and obstructions'
  | 'Other municipal services';

export const CIVIC_CATEGORIES: readonly CivicCategory[] = [
  'Roads and footpaths',
  'Waste and sanitation',
  'Water supply',
  'Drainage and flooding',
  'Streetlights and electricity',
  'Public transportation',
  'Parks and public spaces',
  'Public buildings and facilities',
  'Traffic safety',
  'Trees and greenery',
  'Encroachments and obstructions',
  'Other municipal services',
] as const;

export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type SentimentDisplay = SentimentLabel | 'unavailable';

export interface StatusHistoryItem {
  status: ComplaintStatus;
  timestamp: string; // ISO 8601 string
  note?: string | null;
  updatedBy?: string | null;
}

/**
 * Legacy type retained only while the unused image-upload component awaits
 * cleanup. The active Flask-backed flow does not accept image files.
 */
export interface ComplaintAttachment {
  name: string;
  size: number;
  type: string;
  thumbnailDataUrl?: string;
}

export interface Complaint {
  id: string;                          // Database ID as a string
  referenceNumber: string;             // Human-readable tracking ID, e.g. "CV-2026-00001"
  title: string;                       // Brief title
  description: string;                 // Detailed description
  category: CivicCategory;             // One of the 12 municipal categories
  location: string;                    // Street, ward, or landmark
  status: ComplaintStatus;             // Current resolution status
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
  statusHistory: StatusHistoryItem[];  // Complete audit trail
  sentimentLabel?: SentimentLabel | null;
  sentimentScore?: number | null;
  attachment?: ComplaintAttachment;    // Legacy, unused by the active flow
}

export interface NewComplaintInput {
  title: string;
  description: string;
  category: CivicCategory;
  location: string;
  attachment?: ComplaintAttachment;    // Legacy, ignored by the API
}

export interface ComplaintFilterOptions {
  searchQuery?: string;
  category?: CivicCategory | 'All';
  status?: ComplaintStatus | 'All';
  sortBy?: 'newest' | 'oldest';
}

export interface AdminMetrics {
  total: number;
  submitted: number;
  underReview: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  activeCount: number;
}

export interface CategoryDistribution {
  category: CivicCategory;
  count: number;
}

export interface StatusDistribution {
  status: ComplaintStatus;
  count: number;
}

export interface SentimentDistribution {
  sentiment: SentimentDisplay;
  count: number;
}

export interface RecurringIssueCluster {
  category: CivicCategory;
  locationKeyword: string;
  count: number;
  sampleTitles: string[];
  complaintIds: string[];
}
