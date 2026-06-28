// ============================================================================
// DOMAIN SYSTEM USAGE GUIDE
// How to use the unified global domain management system
// ============================================================================

/**
 * OVERVIEW
 * ========
 * The domain system is now fully unified and synchronized across the entire app.
 * All domain state is managed through a single source of truth: the Global Settings Store.
 * 
 * KEY PRINCIPLES:
 * 1. ONE centralized domain state (Global Settings Store)
 * 2. Automatic synchronization between header and settings
 * 3. Persistent across sessions, refreshes, and navigation
 * 4. Real-time updates via event system
 * 5. Support for both single-domain (free) and multi-domain (pro) users
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

import { useDomainContext } from '@/hooks/use-domain-context';
import { useDomainListener } from '@/hooks/use-domain-listener';
import { getDomainConfig } from '@/lib/domain-config';

/**
 * Example 1: Basic Domain Context Usage
 * Use this in any component that needs to know the active domain
 */
export function ExampleComponent() {
  const {
    activeDomain,           // Primary active domain
    domainConfig,          // Config with icons, colors, placeholders
    isReady,               // True when initialized and not loading
    switchDomain,          // Function to switch domain
    getPlaceholders        // Get domain-specific placeholder text
  } = useDomainContext();

  if (!isReady) return <div>Loading...</div>;

  const placeholders = getPlaceholders();
  
  return (
    <div>
      <h1>Active Domain: {activeDomain.name}</h1>
      <p>Quiz placeholder: {placeholders.quizTopic}</p>
    </div>
  );
}

/**
 * Example 2: Listen for Domain Changes
 * Use this when you need to refresh data when domain changes
 */
export function ExampleDataComponent() {
  const [data, setData] = React.useState(null);
  
  // Automatically refresh when domain changes
  useDomainListener((event) => {
    console.log('Domain changed to:', event.domainName);
    // Refetch data for new domain
    fetchDataForDomain(event.domainId).then(setData);
  }, []);

  return <div>{/* render data */}</div>;
}

/**
 * Example 3: Multi-Domain Support
 * Check if user has selected multiple domains
 */
export function ExampleMultiDomainComponent() {
  const { activeDomains, selectedDomainIds, isDomainSelected } = useDomainContext();

  return (
    <div>
      <h2>Your Active Domains ({activeDomains.length})</h2>
      {activeDomains.map(domain => (
        <div key={domain.domain_id}>
          {domain.name} {isDomainSelected(domain.domain_id) ? '✓' : ''}
        </div>
      ))}
    </div>
  );
}

/**
 * Example 4: Using Domain Config for Icons
 */
export function ExampleIconComponent() {
  const { domainConfig } = useDomainContext();
  const IconComponent = domainConfig.iconComponent;

  return (
    <div>
      <IconComponent className={domainConfig.color} />
      <span>{domainConfig.name}</span>
    </div>
  );
}

/**
 * Example 5: Switch Domain Programmatically
 */
export function ExampleSwitchComponent({ targetDomainId }: { targetDomainId: string }) {
  const { switchDomain, isLoading } = useDomainContext();

  const handleSwitch = async () => {
    try {
      await switchDomain(targetDomainId);
      toast.success('Domain switched!');
    } catch (error) {
      toast.error('Failed to switch domain');
    }
  };

  return (
    <button onClick={handleSwitch} disabled={isLoading}>
      Switch Domain
    </button>
  );
}

// ============================================================================
// AVAILABLE HOOKS
// ============================================================================

/**
 * useDomainContext()
 * ------------------
 * Main hook for domain state and actions
 * 
 * Returns:
 * - activeDomain: Primary active domain object
 * - activeDomains: Array of all active domains (multi-domain users)
 * - selectedDomainIds: Array of selected domain IDs
 * - domainConfig: Configuration with icons, colors, placeholders
 * - switchDomain(id): Switch to a single domain
 * - toggleDomain(id): Toggle domain in multi-select mode
 * - selectDomains(ids): Set multiple domains
 * - isLoading: Boolean indicating loading state
 * - isInitialized: Boolean indicating if store is initialized
 * - isReady: Boolean (initialized && !loading)
 * - isDomainSelected(id): Check if domain is selected
 * - getDomainName(): Get active domain name
 * - getDomainIcon(): Get icon component
 * - getPlaceholders(): Get domain-specific placeholders
 */

/**
 * useDomainListener(callback, deps)
 * ----------------------------------
 * Subscribe to domain change events
 * 
 * Parameters:
 * - callback: Function called when domain changes
 * - deps: Optional dependency array
 * 
 * Use this to refresh data when domains change
 */

/**
 * useIsDomainChanging()
 * ---------------------
 * Returns boolean indicating if domain is currently changing
 * 
 * Use this to show loading states during transitions
 */

// ============================================================================
// DOMAIN CONFIG UTILITIES
// ============================================================================

/**
 * getDomainConfig(domainKey?)
 * Returns domain configuration object
 * 
 * getDomainSubjects(domainKey?)
 * Returns array of subjects for domain
 * 
 * getAllDomainKeys()
 * Returns all available domain keys
 * 
 * getAllDomainConfigs()
 * Returns all domain configurations
 * 
 * isValidDomainKey(key)
 * Check if string is valid domain key
 */

// ============================================================================
// GLOBAL EVENTS
// ============================================================================

/**
 * The system broadcasts these events:
 * 
 * 'domain-changed' - Fired when domain is changed from any component
 *   detail: { domainId: string, domainName?: string }
 * 
 * 'global-domain-updated' - Fired when domain selection is updated in store
 *   detail: { domainIds: string[] }
 * 
 * 'domain-context-refreshed' - Fired when context refresh is triggered
 *   detail: undefined
 * 
 * You can listen to these manually:
 * window.addEventListener('domain-changed', (e) => console.log(e.detail));
 */

// ============================================================================
// PERSISTENCE & SYNCHRONIZATION
// ============================================================================

/**
 * Domain state is persisted in:
 * 1. Zustand persist middleware (localStorage: 'global-settings')
 * 2. Legacy localStorage key: 'prepbud:active-domain'
 * 3. Database via /api/preferences/domains endpoint
 * 
 * Synchronization happens:
 * - On app initialization (SettingsInitializer)
 * - On domain selection change (immediate optimistic + server sync)
 * - Across tabs (via Zustand persist)
 * - On login/logout (via API)
 * 
 * NO manual refresh is ever needed!
 */

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * HeaderDomainSwitcher
 * --------------------
 * Location: Topbar/Header
 * Features:
 * - Searchable dropdown
 * - Icon display
 * - Multi-domain badge
 * - Smooth animations
 * - Keyboard accessible
 * 
 * Usage: Already integrated in layout, no action needed
 */

/**
 * DomainSelector
 * --------------
 * Location: Settings → Domains tab
 * Features:
 * - Card-based selection
 * - Visual feedback
 * - Single/multi-domain modes
 * - Hover animations
 * 
 * Usage: Already integrated in settings, no action needed
 */

/**
 * DomainSwitchInfo
 * ----------------
 * Location: Settings → Domains tab
 * Features:
 * - Shows current plan limits
 * - Upgrade CTA for free users
 * - Premium badge for pro users
 * 
 * Usage: Already integrated in settings, no action needed
 */

// ============================================================================
// FREE vs PRO LOGIC
// ============================================================================

/**
 * FREE USERS (limits.domains === 1):
 * - Can select ONE active domain at a time
 * - Can switch domains freely anytime
 * - Switching replaces the current domain
 * - Full domain-adaptive experience
 * - Upgrade CTA shown for multi-domain
 * 
 * PRO USERS (limits.domains > 1):
 * - Can select MULTIPLE domains simultaneously
 * - Dashboard shows content from all domains
 * - Can toggle domains on/off
 * - Cross-domain insights and recommendations
 */

// ============================================================================
// BEST PRACTICES
// ============================================================================

/**
 * DO:
 * ✓ Use useDomainContext() for domain state
 * ✓ Use useDomainListener() for reactive updates
 * ✓ Trust the global store as single source of truth
 * ✓ Use domain config for icons, colors, placeholders
 * ✓ Check isReady before rendering domain-dependent UI
 * 
 * DON'T:
 * ✗ Create separate domain state
 * ✗ Directly access localStorage for domains
 * ✗ Manually sync between components
 * ✗ Bypass the global store
 * ✗ Assume domain is always loaded
 */

import React from 'react';
import { toast } from 'sonner';
