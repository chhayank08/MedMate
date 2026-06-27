// ============================================================================
// Global Settings Store - Centralized Settings Management
// Consolidates domain, subject, and UI preferences into ONE system
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Domain, SubjectWithDomain } from '@/types/domain.types';

// ─── Safe Default State ─────────────────────────────────────────────────────

const DEFAULT_DOMAIN: Domain = {
  domain_id: 'default-medical',
  name: 'Medical',
  description: 'Medical education domain',
  icon_name: '🩺',
  is_predefined: true,
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const EMPTY_STATE = {
  domains: [],
  selectedDomainIds: [],
  subjects: [],
  isInitialized: false,
  isLoading: false,
  error: null as Error | null,
  lastSyncedAt: null as Date | null
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface UISettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  displayDensity: 'compact' | 'standard' | 'comfortable';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

interface GlobalSettingsState {
  // Domain State
  domains: Domain[];
  selectedDomainIds: string[];
  
  // Subject State
  subjects: SubjectWithDomain[];
  
  // UI State
  uiSettings: UISettings;
  
  // System State
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  lastSyncedAt: Date | null;
  
  // Actions
  initialize: () => Promise<void>;
  selectDomains: (domainIds: string[]) => Promise<void>;
  toggleSubject: (subjectId: string, enabled: boolean) => Promise<void>;
  updateUISettings: (settings: Partial<UISettings>) => Promise<void>;
  reset: () => void;
  
  // Getters
  getActiveDomain: () => Domain;
  getActiveDomains: () => Domain[];
  getEnabledSubjects: () => SubjectWithDomain[];
  isReady: () => boolean;
}

// ─── Validation Helpers ─────────────────────────────────────────────────────

function validateDomain(domain: unknown): domain is Domain {
  if (!domain || typeof domain !== 'object') return false;
  const d = domain as Partial<Domain>;
  return Boolean(d.domain_id && d.name);
}

function validateSubject(subject: unknown): subject is SubjectWithDomain {
  if (!subject || typeof subject !== 'object') return false;
  const s = subject as Partial<SubjectWithDomain>;
  return Boolean(
    s.subject_id && 
    s.name && 
    s.domain_id &&
    s.domain &&
    validateDomain(s.domain)
  );
}

function sanitizeDomains(domains: unknown): Domain[] {
  if (!Array.isArray(domains)) return [];
  return domains.filter(validateDomain);
}

function sanitizeSubjects(subjects: unknown): SubjectWithDomain[] {
  if (!Array.isArray(subjects)) return [];
  return subjects.filter(validateSubject);
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useGlobalSettings = create<GlobalSettingsState>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,
      
      uiSettings: {
        theme: 'system',
        language: 'en',
        displayDensity: 'standard',
        notifications: {
          email: true,
          push: true,
          inApp: true
        }
      },

      // ─── Initialize ───────────────────────────────────────────────────────
      
      initialize: async () => {
        const state = get();
        if (state.isInitialized || state.isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const res = await fetch('/api/preferences', {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          const json = await res.json();
          
          if (!json.success) {
            throw new Error(json.error?.message || 'Failed to load preferences');
          }

          const data = json.data;
          
          // Safely extract and validate data
          const domains = sanitizeDomains(data?.domains);
          const subjects = sanitizeSubjects(data?.subjects);
          const selectedDomainIds = domains
            .map(d => d.domain_id)
            .filter(Boolean);

          // Ensure at least one domain is selected
          const finalDomains = domains.length > 0 ? domains : [DEFAULT_DOMAIN];
          const finalSelectedIds = selectedDomainIds.length > 0 
            ? selectedDomainIds 
            : [DEFAULT_DOMAIN.domain_id];

          set({
            domains: finalDomains,
            selectedDomainIds: finalSelectedIds,
            subjects,
            uiSettings: data?.uiSettings || get().uiSettings,
            isInitialized: true,
            isLoading: false,
            lastSyncedAt: new Date(),
            error: null
          });

        } catch (error) {
          console.error('[GlobalSettings] Initialize error:', error);
          
          // Fallback to safe defaults
          set({
            domains: [DEFAULT_DOMAIN],
            selectedDomainIds: [DEFAULT_DOMAIN.domain_id],
            subjects: [],
            isInitialized: true,
            isLoading: false,
            error: error as Error
          });
        }
      },

      // ─── Select Domains ───────────────────────────────────────────────────
      
      selectDomains: async (domainIds: string[]) => {
        if (!Array.isArray(domainIds) || domainIds.length === 0) {
          console.warn('[GlobalSettings] Invalid domain selection');
          return;
        }

        // Optimistic update
        const previousIds = get().selectedDomainIds;
        set({ selectedDomainIds: domainIds });

        try {
          const res = await fetch('/api/preferences/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains: domainIds })
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const json = await res.json();
          
          if (!json.success) {
            throw new Error(json.error?.message || 'Update failed');
          }

          // Update subjects if returned
          if (json.data?.subjects) {
            const subjects = sanitizeSubjects(json.data.subjects);
            set({ subjects });
          }

          set({ lastSyncedAt: new Date(), error: null });

        } catch (error) {
          console.error('[GlobalSettings] Select domains error:', error);
          // Rollback on error
          set({ selectedDomainIds: previousIds, error: error as Error });
          throw error;
        }
      },

      // ─── Toggle Subject ───────────────────────────────────────────────────
      
      toggleSubject: async (subjectId: string, enabled: boolean) => {
        const { subjects } = get();
        
        // Optimistic update
        const previousSubjects = subjects;
        const updatedSubjects = subjects.map(s => 
          s.subject_id === subjectId ? { ...s, enabled } : s
        );
        set({ subjects: updatedSubjects });

        try {
          const payload = updatedSubjects.map(s => ({
            subjectId: s.subject_id,
            domainId: s.domain_id,
            enabled: s.enabled
          }));

          const res = await fetch('/api/preferences/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subjects: payload })
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const json = await res.json();
          
          if (!json.success) {
            throw new Error(json.error?.message || 'Update failed');
          }

          set({ lastSyncedAt: new Date(), error: null });

        } catch (error) {
          console.error('[GlobalSettings] Toggle subject error:', error);
          // Rollback on error
          set({ subjects: previousSubjects, error: error as Error });
          throw error;
        }
      },

      // ─── Update UI Settings ───────────────────────────────────────────────
      
      updateUISettings: async (settings: Partial<UISettings>) => {
        const previousSettings = get().uiSettings;
        const newSettings = { ...previousSettings, ...settings };
        set({ uiSettings: newSettings });

        try {
          const res = await fetch('/api/preferences/ui-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const json = await res.json();
          
          if (!json.success) {
            throw new Error(json.error?.message || 'Update failed');
          }

          set({ lastSyncedAt: new Date(), error: null });

        } catch (error) {
          console.error('[GlobalSettings] Update UI settings error:', error);
          set({ uiSettings: previousSettings, error: error as Error });
          throw error;
        }
      },

      // ─── Reset ────────────────────────────────────────────────────────────
      
      reset: () => {
        set({
          ...EMPTY_STATE,
          uiSettings: {
            theme: 'system',
            language: 'en',
            displayDensity: 'standard',
            notifications: { email: true, push: true, inApp: true }
          }
        });
      },

      // ─── Getters ──────────────────────────────────────────────────────────
      
      getActiveDomain: () => {
        const { domains, selectedDomainIds } = get();
        if (!selectedDomainIds.length || !domains.length) return DEFAULT_DOMAIN;
        
        const activeDomain = domains.find(d => 
          d.domain_id === selectedDomainIds[0]
        );
        
        return activeDomain || DEFAULT_DOMAIN;
      },

      getActiveDomains: () => {
        const { domains, selectedDomainIds } = get();
        if (!selectedDomainIds.length || !domains.length) return [DEFAULT_DOMAIN];
        
        const activeDomains = domains.filter(d => 
          selectedDomainIds.includes(d.domain_id)
        );
        
        return activeDomains.length > 0 ? activeDomains : [DEFAULT_DOMAIN];
      },

      getEnabledSubjects: () => {
        const { subjects } = get();
        return subjects.filter(s => s.enabled);
      },

      isReady: () => {
        const { isInitialized, isLoading } = get();
        return isInitialized && !isLoading;
      }
    }),
    {
      name: 'global-settings',
      partialize: (state) => ({
        selectedDomainIds: state.selectedDomainIds,
        uiSettings: state.uiSettings
      })
    }
  )
);

// ─── Initialization Hook ────────────────────────────────────────────────────

export function useInitializeSettings() {
  const initialize = useGlobalSettings(state => state.initialize);
  const isInitialized = useGlobalSettings(state => state.isInitialized);
  
  return { initialize, isInitialized };
}

// ─── Selector Hooks ─────────────────────────────────────────────────────────

export function useActiveDomain() {
  return useGlobalSettings(state => state.getActiveDomain());
}

export function useActiveDomains() {
  return useGlobalSettings(state => state.getActiveDomains());
}

export function useEnabledSubjects() {
  return useGlobalSettings(state => state.getEnabledSubjects());
}

export function useDomainSelection() {
  const selectDomains = useGlobalSettings(state => state.selectDomains);
  const selectedDomainIds = useGlobalSettings(state => state.selectedDomainIds);
  const isLoading = useGlobalSettings(state => state.isLoading);
  
  return { selectDomains, selectedDomainIds, isLoading };
}
