import {
  AdminMetrics,
  CategoryDistribution,
  CivicCategory,
  CIVIC_CATEGORIES,
  Complaint,
  ComplaintFilterOptions,
  COMPLAINT_STATUSES,
  ComplaintStatus,
  NewComplaintInput,
  RecurringIssueCluster,
  SentimentDistribution,
  SentimentLabel,
  StatusDistribution,
  StatusHistoryItem,
} from '../types/complaint';
import { ApiError, apiClient, buildQuery } from '../api/client';

interface ApiStatusHistoryItem {
  status: ComplaintStatus;
  timestamp: string;
  note?: string | null;
  updated_by?: string | null;
}

interface ApiComplaint {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  category: CivicCategory;
  location: string;
  status: ComplaintStatus;
  sentiment_label: SentimentLabel | null;
  sentiment_score: number | null;
  created_at: string;
  updated_at: string;
  status_history: ApiStatusHistoryItem[];
}

interface ApiStatistics {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_sentiment: Record<string, number>;
}

function mapHistory(item: ApiStatusHistoryItem): StatusHistoryItem {
  return {
    status: item.status,
    timestamp: item.timestamp,
    note: item.note,
    updatedBy: item.updated_by,
  };
}

function mapComplaint(raw: ApiComplaint): Complaint {
  return {
    id: String(raw.id),
    referenceNumber: raw.reference_number,
    title: raw.title,
    description: raw.description,
    category: raw.category,
    location: raw.location,
    status: raw.status,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    statusHistory: (raw.status_history || []).map(mapHistory),
    sentimentLabel: raw.sentiment_label,
    sentimentScore: raw.sentiment_score,
  };
}

class ComplaintService {
  /**
   * Retrieves complaints from Flask with optional server-side filtering.
   */
  async getComplaints(filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    const query = buildQuery({
      search: filters?.searchQuery?.trim() || undefined,
      category:
        filters?.category && filters.category !== 'All'
          ? filters.category
          : undefined,
      status:
        filters?.status && filters.status !== 'All' ? filters.status : undefined,
      sort: filters?.sortBy === 'oldest' ? 'oldest' : undefined,
    });

    const response = await apiClient.get<{ complaints: ApiComplaint[]; count: number }>(
      `/complaints${query}`
    );
    return response.complaints.map(mapComplaint);
  }

  /**
   * Retrieves a complaint by database ID or reference number.
   */
  async getComplaintById(id: string): Promise<Complaint | null> {
    if (id.trim().toUpperCase().startsWith('CV-')) {
      return this.getComplaintByReference(id);
    }
    const list = await this.getComplaints();
    return list.find((complaint) => complaint.id === id) || null;
  }

  /**
   * Retrieves a complaint by its human-friendly reference number.
   */
  async getComplaintByReference(ref: string): Promise<Complaint | null> {
    const normalized = ref.trim();
    if (!normalized) return null;

    try {
      const response = await apiClient.get<{ complaint: ApiComplaint }>(
        `/complaints/reference/${encodeURIComponent(normalized)}`
      );
      return mapComplaint(response.complaint);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Creates a complaint. The backend supplies the reference, status,
   * timestamps, history, and VADER sentiment.
   */
  async createComplaint(input: NewComplaintInput): Promise<Complaint> {
    const response = await apiClient.post<{ complaint: ApiComplaint }>('/complaints', {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      location: input.location.trim(),
    });
    return mapComplaint(response.complaint);
  }

  /**
   * Updates a complaint status and appends an audit-history entry.
   */
  async updateStatus(
    id: string,
    newStatus: ComplaintStatus,
    note?: string,
    updatedBy: string = 'Admin (demo)'
  ): Promise<Complaint> {
    const response = await apiClient.patch<{ complaint: ApiComplaint }>(
      `/complaints/${encodeURIComponent(id)}/status`,
      {
        status: newStatus,
        note: note?.trim() || undefined,
        updated_by: updatedBy,
      }
    );
    return mapComplaint(response.complaint);
  }

  private async getStatistics(): Promise<ApiStatistics> {
    const response = await apiClient.get<{ statistics: ApiStatistics }>('/statistics');
    return response.statistics;
  }

  /**
   * Calculates KPI metrics from the backend statistics endpoint.
   */
  async getMetrics(): Promise<AdminMetrics> {
    const stats = await this.getStatistics();
    const byStatus = stats.by_status;

    return {
      total: stats.total,
      submitted: byStatus.Submitted || 0,
      underReview: byStatus['Under Review'] || 0,
      assigned: byStatus.Assigned || 0,
      inProgress: byStatus['In Progress'] || 0,
      resolved: byStatus.Resolved || 0,
      closed: byStatus.Closed || 0,
      activeCount:
        (byStatus.Submitted || 0) +
        (byStatus['Under Review'] || 0) +
        (byStatus.Assigned || 0) +
        (byStatus['In Progress'] || 0),
    };
  }

  /**
   * Returns all twelve categories, including zero counts.
   */
  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const stats = await this.getStatistics();
    return CIVIC_CATEGORIES.map((category) => ({
      category,
      count: stats.by_category[category] || 0,
    }));
  }

  /**
   * Returns all six statuses, including zero counts.
   */
  async getStatusDistribution(): Promise<StatusDistribution[]> {
    const stats = await this.getStatistics();
    return COMPLAINT_STATUSES.map((status) => ({
      status,
      count: stats.by_status[status] || 0,
    }));
  }

  /**
   * Returns positive, neutral, negative, and unavailable sentiment counts.
   */
  async getSentimentDistribution(): Promise<SentimentDistribution[]> {
    const stats = await this.getStatistics();
    return [
      { sentiment: 'positive', count: stats.by_sentiment.positive || 0 },
      { sentiment: 'neutral', count: stats.by_sentiment.neutral || 0 },
      { sentiment: 'negative', count: stats.by_sentiment.negative || 0 },
      { sentiment: 'unavailable', count: stats.by_sentiment.unavailable || 0 },
    ];
  }

  /**
   * Groups complaints by exact normalized category + location and returns
   * the top five groups containing at least two complaints.
   */
  async getRecurringIssues(): Promise<RecurringIssueCluster[]> {
    const all = await this.getComplaints();
    const clusters = new Map<
      string,
      {
        category: CivicCategory;
        location: string;
        complaints: Complaint[];
      }
    >();

    all.forEach((complaint) => {
      const normalizedLocation = complaint.location
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
      const key = `${complaint.category}:::${normalizedLocation}`;

      if (!clusters.has(key)) {
        clusters.set(key, {
          category: complaint.category,
          location: complaint.location.trim(),
          complaints: [],
        });
      }
      clusters.get(key)?.complaints.push(complaint);
    });

    return Array.from(clusters.values())
      .filter((cluster) => cluster.complaints.length >= 2)
      .map((cluster) => ({
        category: cluster.category,
        locationKeyword: cluster.location,
        count: cluster.complaints.length,
        sampleTitles: cluster.complaints.map((complaint) => complaint.title),
        complaintIds: cluster.complaints.map((complaint) => complaint.id),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

export const complaintService = new ComplaintService();
