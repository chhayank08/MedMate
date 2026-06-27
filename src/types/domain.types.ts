// ============================================================================
// Domain and Subject Types
// Task 2.2: Create domain and subject TypeScript types
// Requirements: 1.1, 2.2, 10.1, 10.2
// ============================================================================

// ─── Domain Types ───────────────────────────────────────────────────────────
export interface Domain {
  domain_id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  is_predefined: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Subject Types ──────────────────────────────────────────────────────────
export interface Subject {
  subject_id: string;
  domain_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Junction Table Types ───────────────────────────────────────────────────
export interface UserDomain {
  user_id: string;
  domain_id: string;
  selected_at: string;
}

export interface UserSubject {
  user_id: string;
  subject_id: string;
  enabled_at: string;
}

// ─── Composite Types ────────────────────────────────────────────────────────
export interface SubjectWithDomain extends Subject {
  domain: Domain;
  enabled: boolean;
}

export interface SubjectSelection {
  subjectId: string;
  domainId: string;
  enabled: boolean;
}

// ─── Filter Types ───────────────────────────────────────────────────────────
export interface FilterState {
  domains: string[];
  subjects: string[];
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
