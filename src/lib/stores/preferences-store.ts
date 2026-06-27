// ============================================================================
// Preferences Store - Task 10.1
// Requirements: 1.3, 1.7, 2.3, 2.7, 3.7, 3.8, 12.1, 12.3, 18.5, 18.6
// ============================================================================

import { create } from 'zustand';
import { UserPreferences, PendingUpdate } from '@/types/preferences.types';
import { SubjectSelection } from '@/types/domain.types';

interface PreferencesState {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: Error | null;
  lastSyncedAt: Date | null;
  pendingUpdates: PendingUpdate[];
  loadPreferences: () => Promise<void>;
  updateDomains: (domains: string[]) => Promise<void>;
  updateSubjects: (subjects: SubjectSelection[]) => Promise<void>;
  updateUISettings: (settings: Partial<UserPreferences['uiSettings']>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  _rollback: (updateId: string) => void;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: null,
  isLoading: false,
  error: null,
  lastSyncedAt: null,
  pendingUpdates: [],

  loadPreferences: async () => {
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
      if (!json.success) throw new Error(json.error?.message || 'Failed to load preferences');
      
      const prefs = json.data;
      if (!prefs || typeof prefs !== 'object') {
        throw new Error('Invalid preferences data');
      }
      
      set({ preferences: prefs, isLoading: false, lastSyncedAt: new Date() });
      
      // Cache preferences safely
      try {
        localStorage.setItem('preferences_cache', JSON.stringify(prefs));
      } catch (cacheError) {
        console.warn('[PreferencesStore] Failed to cache preferences:', cacheError);
      }
      
      // Persist active domain for domain-config system
      if (Array.isArray(prefs.domains) && prefs.domains.length > 0) {
        try {
          const activeDomain = prefs.domains[0];
          if (activeDomain?.name) {
            const domainKey = activeDomain.name.toLowerCase().replace(/\s+/g, '_');
            localStorage.setItem('prepbud:active-domain', domainKey);
          }
        } catch (domainError) {
          console.warn('[PreferencesStore] Failed to sync active domain:', domainError);
        }
      }
    } catch (error) {
      console.error('[PreferencesStore] Load preferences error:', error);
      set({ error: error as Error, isLoading: false });
      
      // Fallback to cached preferences
      try {
        const cached = localStorage.getItem('preferences_cache');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache && typeof parsedCache === 'object') {
            set({ preferences: parsedCache });
          }
        }
      } catch (cacheError) {
        console.warn('[PreferencesStore] Failed to load cache:', cacheError);
      }
    }
  },

  updateDomains: async (domains: string[]) => {
    const updateId = crypto.randomUUID();
    const previousValue = get().preferences?.domains;
    const previousSubjects = get().preferences?.subjects;
    
    set(state => ({
      pendingUpdates: [...state.pendingUpdates, { 
        id: updateId, 
        type: 'domains', 
        previousValue, 
        newValue: domains, 
        timestamp: new Date() 
      }]
    }));

    try {
      if (!Array.isArray(domains)) {
        throw new Error('Invalid domains array');
      }

      const res = await fetch('/api/preferences/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      if (!json.success) { 
        get()._rollback(updateId); 
        throw new Error(json.error?.message || 'Failed to update domains'); 
      }
      
      set(state => {
        if (!state.preferences) return state;
        
        const newPrefs = { 
          ...state.preferences, 
          domains: Array.isArray(json.data?.domains) ? json.data.domains : [], 
          subjects: Array.isArray(json.data?.subjects) ? json.data.subjects : (previousSubjects || [])
        };
        
        // Update localStorage cache
        try {
          localStorage.setItem('preferences_cache', JSON.stringify(newPrefs));
        } catch (cacheError) {
          console.warn('[PreferencesStore] Cache update failed:', cacheError);
        }
        
        // Sync active domain
        if (newPrefs.domains && newPrefs.domains.length > 0) {
          try {
            const activeDomain = newPrefs.domains[0];
            if (activeDomain?.name) {
              const domainKey = activeDomain.name.toLowerCase().replace(/\s+/g, '_');
              localStorage.setItem('prepbud:active-domain', domainKey);
            }
          } catch (domainError) {
            console.warn('[PreferencesStore] Domain sync failed:', domainError);
          }
        }
        
        return {
          preferences: newPrefs,
          pendingUpdates: state.pendingUpdates.filter(u => u.id !== updateId),
          lastSyncedAt: new Date()
        };
      });
    } catch (error) {
      console.error('[PreferencesStore] Update domains error:', error);
      get()._rollback(updateId);
      throw error;
    }
  },

  updateSubjects: async (subjects: SubjectSelection[]) => {
    const updateId = crypto.randomUUID();
    const previousValue = get().preferences?.subjects;
    set(state => ({ pendingUpdates: [...state.pendingUpdates, { id: updateId, type: 'subjects', previousValue, newValue: subjects, timestamp: new Date() }] }));

    try {
      const res = await fetch('/api/preferences/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subjects }) });
      const json = await res.json();
      if (!json.success) { get()._rollback(updateId); throw new Error(json.error.message); }
      set(state => ({ preferences: state.preferences ? { ...state.preferences, subjects: json.data.subjects } : null, pendingUpdates: state.pendingUpdates.filter(u => u.id !== updateId), lastSyncedAt: new Date() }));
    } catch (error) {
      get()._rollback(updateId);
      throw error;
    }
  },

  updateUISettings: async (settings) => {
    const updateId = crypto.randomUUID();
    const previousValue = get().preferences?.uiSettings;
    set(state => ({ preferences: state.preferences ? { ...state.preferences, uiSettings: { ...state.preferences.uiSettings, ...settings } } : null, pendingUpdates: [...state.pendingUpdates, { id: updateId, type: 'ui_settings', previousValue, newValue: settings, timestamp: new Date() }] }));

    try {
      const res = await fetch('/api/preferences/ui-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const json = await res.json();
      if (!json.success) { get()._rollback(updateId); throw new Error(json.error.message); }
      set(state => ({ preferences: state.preferences ? { ...state.preferences, uiSettings: json.data.uiSettings } : null, pendingUpdates: state.pendingUpdates.filter(u => u.id !== updateId), lastSyncedAt: new Date() }));
    } catch (error) {
      get()._rollback(updateId);
      throw error;
    }
  },

  resetToDefaults: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/preferences/reset', { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      set({ preferences: json.data, isLoading: false, lastSyncedAt: new Date() });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  _rollback: (updateId: string) => {
    set(state => {
      const update = state.pendingUpdates.find(u => u.id === updateId);
      if (!update || !state.preferences) return state;
      const key = update.type === 'domains' ? 'domains' : update.type === 'subjects' ? 'subjects' : 'uiSettings';
      return { preferences: { ...state.preferences, [key]: update.previousValue }, pendingUpdates: state.pendingUpdates.filter(u => u.id !== updateId), error: new Error('Update failed - changes reverted') };
    });
  }
}));
