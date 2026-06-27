// ============================================================================
// User Preferences Types
// Task 2.4: Create preferences TypeScript types
// Requirements: 3.1, 3.3, 9.3
// ============================================================================

import { Domain, SubjectWithDomain } from './domain.types';

// ─── UI Settings ────────────────────────────────────────────────────────────
export interface UISettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  displayDensity: 'compact' | 'standard' | 'comfortable';
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

// ─── User Preferences Aggregate ─────────────────────────────────────────────
export interface UserPreferences {
  domains: Domain[];
  subjects: SubjectWithDomain[];
  uiSettings: UISettings;
}

// ─── Pending Update (for optimistic updates) ────────────────────────────────
export interface PendingUpdate {
  id: string;
  type: 'domains' | 'subjects' | 'ui_settings';
  previousValue: unknown;
  newValue: unknown;
  timestamp: Date;
}
