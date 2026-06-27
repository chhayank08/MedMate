# Implementation Plan: Multi-Domain Learning Platform

## Overview

This implementation plan transforms PrepBud from a medical-focused application into a comprehensive multi-domain AI-powered learning platform. The implementation follows a logical sequence: database schema → backend APIs → state management → UI components → integration → testing and deployment.

**Technology Stack**: Next.js 16.2.9, React 19.2.4, TypeScript 5, Supabase PostgreSQL, Zustand 5.0.14, TanStack React Query 5.101.0, Radix UI, Tailwind CSS 4, Motion (Framer Motion) 12.40.0, React Hook Form 7.79.0, Zod 4.4.3

**Implementation Strategy**: Build foundation-first (database and types), then APIs with tier enforcement, state management with optimistic updates, UI components with responsive design, and finally integrate all features with comprehensive testing for backwards compatibility.

## Tasks

### Phase 1: Database Foundation & Type System

- [ ] 1. Create multi-domain database schema
  - [ ] 1.1 Create core domain and subject tables with indexes
    - Create Supabase migration file in migrations directory
    - Create `domains` table with domain_id (UUID PK), name (VARCHAR 100), description (VARCHAR 500), icon_name (VARCHAR 50), is_predefined (BOOLEAN), created_by (UUID FK), created_at, updated_at
    - Create `user_domains` junction table with composite PK (user_id, domain_id) and selected_at timestamp
    - Create `subjects` table with subject_id (UUID PK), domain_id (UUID FK), name (VARCHAR 100), description (VARCHAR 500), created_at, updated_at
    - Create `user_subjects` junction table with composite PK (user_id, subject_id) and enabled_at timestamp
    - Add unique constraints: unique_domain_name (name, created_by), unique_subject_per_domain (domain_id, name)
    - Create indexes on domain_id, subject_id, user_id columns for all tables
    - _Requirements: 1.1, 2.1, 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 1.2 Create subscription and usage tracking tables
    - Create `subscriptions` table with id (UUID PK), user_id (UUID FK UNIQUE), tier (VARCHAR 20 CHECK 'free'|'pro'|'premium'), billing_period_start, billing_period_end, auto_renew (BOOLEAN), stripe_subscription_id, stripe_customer_id, created_at, updated_at
    - Create `usage_tracking` table with id (UUID PK), user_id (UUID FK), billing_period_start, billing_period_end, quiz_count (INTEGER DEFAULT 0), summary_count (INTEGER DEFAULT 0), domain_count (INTEGER DEFAULT 0), subject_count (INTEGER DEFAULT 0), created_at, updated_at
    - Add unique constraint on usage_tracking: unique_user_period (user_id, billing_period_start)
    - Create indexes on user_id, tier, billing_period_start, billing_period_end columns
    - _Requirements: 6.1, 6.7, 6.8, 6.9, 13.1_

  - [ ] 1.3 Alter existing tables for multi-domain support
    - Alter `profiles` table: Add theme (VARCHAR 20 DEFAULT 'system'), language (VARCHAR 5 DEFAULT 'en'), display_density (VARCHAR 20 DEFAULT 'standard'), notification_email (BOOLEAN DEFAULT true), notification_push (BOOLEAN DEFAULT true), notification_in_app (BOOLEAN DEFAULT true)
    - Alter `quizzes` table: Add domain_id (UUID FK NULL), subject_id (UUID FK NULL) with indexes
    - Alter `summaries` table: Add domain_id (UUID FK NULL), subject_id (UUID FK NULL) with indexes
    - Alter `tasks` table: Add domain_id (UUID FK NULL), subject_id (UUID FK NULL) with indexes
    - Alter `subject_analytics` table: Drop subject column, add domain_id (UUID FK), subject_id (UUID FK) with indexes
    - Set CASCADE DELETE for user_domains and user_subjects; SET NULL for content tables; RESTRICT for domains/subjects
    - _Requirements: 3.3, 4.4, 13.1, 14.1, 14.2, 14.3, 16.1, 16.4_

  - [ ] 1.4 Seed predefined domains and subjects
    - Insert 7 predefined domains: Medical, Engineering, Business, Law, Science, Technology, Humanities with descriptions and icon names
    - Insert 10 subjects per domain (70 total subjects) - Medical: Anatomy, Physiology, Pharmacology, Pathology, Biochemistry, Microbiology, Immunology, Genetics, Embryology, Histology
    - Engineering: Calculus, Linear Algebra, Physics, Circuit Analysis, Thermodynamics, Statics, Dynamics, Materials Science, Fluid Mechanics, Control Systems
    - Business: Accounting, Finance, Marketing, Operations, Strategy, Economics, Business Law, Organizational Behavior, Supply Chain, Entrepreneurship
    - Law: Constitutional Law, Contract Law, Criminal Law, Torts, Civil Procedure, Property Law, Evidence, Legal Writing, Criminal Procedure, Administrative Law
    - Science: Chemistry, Biology, Physics, Geology, Astronomy, Meteorology, Oceanography, Environmental Science, Ecology, Botany
    - Technology: Programming, Data Structures, Algorithms, Databases, Networks, Security, Web Development, Mobile Development, Cloud Computing, Machine Learning
    - Humanities: History, Philosophy, Literature, Languages, Art, Music, Sociology, Anthropology, Political Science, Psychology
    - _Requirements: 1.1, 2.1_

  - [ ]* 1.5 Create database functions for tier limits and usage tracking
    - Create function `check_tier_limits(user_id UUID, resource_type TEXT, new_count INTEGER)` that returns BOOLEAN
    - Function queries subscriptions and usage_tracking, compares against tier limits, returns true if within limits
    - Create function `increment_usage_counter(user_id UUID, counter_type TEXT)` that atomically increments quiz_count or summary_count
    - Function handles billing period rollover by creating new usage_tracking record if current period ended
    - Create function `refresh_user_preferences_view()` to refresh materialized view
    - _Requirements: 6.5, 6.7, 13.7, 15.5_

  - [ ]* 1.6 Create materialized view for user preferences
    - Create `user_preferences_view` materialized view aggregating user_domains and user_subjects with JSON
    - View returns user_id, domains (JSON array), subjects (JSON array with domain context and enabled flag)
    - Create unique index on user_preferences_view(user_id)
    - Create triggers on user_domains and user_subjects to auto-refresh view on changes
    - _Requirements: 3.1, 3.7, 13.7_

- [ ] 2. Generate TypeScript types and create type definitions
  - [ ] 2.1 Generate Supabase database types
    - Run `npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts`
    - Verify generated types include all new tables and modified columns
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 2.2 Create domain and subject TypeScript types
    - Create `src/types/domain.types.ts` with Domain, Subject, UserDomain, UserSubject interfaces
    - Define SubjectWithDomain extending Subject with domain and enabled properties
    - Define SubjectSelection with subjectId, domainId, enabled
    - Define FilterState with domains and subjects arrays
    - _Requirements: 1.1, 2.2, 10.1, 10.2_

  - [ ] 2.3 Create subscription TypeScript types
    - Create `src/types/subscription.types.ts` with SubscriptionTier, Subscription, TierLimits, UsageTracking, UsageStats interfaces
    - Export TIER_LIMITS constant: Free (1 domain, 3 subjects, 5 quizzes), Pro (3 domains, 10000 subjects, 50 quizzes), Premium (10 domains, 10000 subjects, 500 quizzes)
    - Define LimitCheckResult with allowed, reason, currentUsage, limit, upgradeRequired
    - Define ActionType: 'add_domain' | 'add_subject' | 'generate_quiz' | 'generate_summary'
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 15.1, 15.2, 15.3_

  - [ ] 2.4 Create preferences TypeScript types
    - Create `src/types/preferences.types.ts` with UserPreferences, UISettings, NotificationPreferences, PendingUpdate interfaces
    - Define UISettings with theme, language, displayDensity, notifications
    - _Requirements: 3.1, 3.3, 9.3_

- [ ] 3. Checkpoint - Verify database and types
  - Run migration on development database
  - Verify all tables, indexes, and constraints created successfully
  - Check predefined domains and subjects seeded correctly
  - Verify TypeScript types compile without errors
  - Test database functions with sample data
  - Ensure all tests pass, ask the user if questions arise


### Phase 2: Backend API Layer

- [ ] 4. Create preferences management APIs
  - [ ] 4.1 Create preferences loading API
    - Create `src/app/api/preferences/route.ts` with GET handler
    - Implement GET /api/preferences returning user domains, subjects, and UI settings
    - Query user_preferences_view for domains and subjects
    - Query profiles table for UI settings
    - Return UserPreferences object with 5-minute cache header
    - _Requirements: 3.1, 3.4, 3.7_

  - [ ] 4.2 Create domain selection API
    - Create `src/app/api/preferences/domains/route.ts` with POST handler
    - Implement POST /api/preferences/domains accepting { domains: string[] }
    - Call check_tier_limits before allowing additions
    - Return 403 with { allowed: false, upgradeRequired: tier } if limit exceeded
    - Atomically update user_domains (delete all + insert new selections)
    - Return updated preferences within 500ms
    - _Requirements: 1.3, 1.4, 1.7, 6.5, 15.1, 15.5_

  - [ ] 4.3 Create subject selection API
    - Create `src/app/api/preferences/subjects/route.ts` with POST handler
    - Implement POST /api/preferences/subjects accepting { subjects: SubjectSelection[] }
    - Validate subjects belong to user's selected domains
    - Batch update user_subjects table efficiently
    - Trigger refresh_user_preferences_view function
    - Return updated preferences within 200ms
    - _Requirements: 2.3, 2.4, 2.7, 2.9, 3.8_

  - [ ] 4.4 Create UI settings API
    - Create `src/app/api/preferences/ui-settings/route.ts` with POST handler
    - Accept { theme?, language?, displayDensity?, notifications? }
    - Validate theme in ['light','dark','system'], language in ['en','es','fr','de'], displayDensity in ['compact','standard','comfortable']
    - Update profiles table
    - Return updated UI settings
    - _Requirements: 3.3, 3.8, 9.3, 9.5_

  - [ ] 4.5 Create preferences reset API
    - Create `src/app/api/preferences/reset/route.ts` with POST handler
    - Delete all user_domains and user_subjects for user
    - Reset profiles table to defaults: system theme, English language, standard density, all notifications enabled
    - Return empty preferences
    - _Requirements: 9.9_

- [ ] 5. Create domain and subject APIs
  - [ ] 5.1 Create domains API
    - Create `src/app/api/domains/route.ts` with GET and POST handlers
    - Implement GET /api/domains returning predefined domains + user's custom domains
    - Implement POST /api/domains accepting { name: string, description: string } to create custom domain
    - Validate name 1-50 characters, only letters/numbers/spaces/hyphens
    - Check user doesn't exceed 10 custom domains limit
    - Return validation errors with appropriate messages
    - _Requirements: 1.1, 1.2, 1.8, 1.9, 13.8_

  - [ ] 5.2 Create domain delete API
    - Create `src/app/api/domains/[domainId]/route.ts` with DELETE handler
    - Verify user owns the custom domain (check created_by)
    - Check for content references (quizzes, summaries, tasks with this domain_id)
    - Return error if references exist: "Domain has associated content. Reassign or delete content first."
    - Delete domain and cascade to user_domains
    - _Requirements: 13.9_

  - [ ] 5.3 Create subjects API
    - Create `src/app/api/subjects/route.ts` with GET handler
    - Implement GET /api/subjects?domainId=xxx returning subjects for specified domain(s)
    - Support multiple domainId query params for filtering multiple domains
    - Return all subjects if no domainId provided
    - Return 404 if domainId doesn't exist
    - _Requirements: 2.1, 2.2, 13.3_

- [ ] 6. Create subscription management APIs
  - [ ] 6.1 Create subscription status API
    - Create `src/app/api/subscription/status/route.ts` with GET handler
    - Query subscriptions and usage_tracking for current billing period
    - Calculate UsageStats with current/limit/resetsAt for domains, subjects, quizzes, summaries
    - Return subscription tier, billing dates, usage, and limits
    - Default to free tier if no subscription exists
    - _Requirements: 6.10, 7.10, 9.4, 15.4_

  - [ ] 6.2 Create subscription upgrade API
    - Create `src/app/api/subscription/upgrade/route.ts` with POST handler
    - Accept { targetTier: 'pro' | 'premium' }
    - Validate targetTier differs from current tier
    - For upgrades: Create Stripe checkout session and return checkoutUrl
    - For downgrades: Return { requiresConfirmation: true } to show modal in UI
    - _Requirements: 7.8, 7.9_

  - [ ] 6.3 Create usage increment API
    - Create `src/app/api/usage/increment/route.ts` with POST handler
    - Accept { type: 'quiz' | 'summary' }
    - Call check_tier_limits to verify user hasn't exceeded limit
    - Return 403 with upgrade prompt data if limit reached
    - Call increment_usage_counter to atomically update count
    - Handle billing period rollover automatically
    - _Requirements: 6.7, 6.8, 15.2, 15.7_

- [ ] 7. Create content filtering and tagging APIs
  - [ ] 7.1 Create content filtering API
    - Create `src/app/api/content/filtered/route.ts` with GET handler
    - Accept query params: type ('quiz'|'summary'), domains (array), subjects (array), page, pageSize
    - Build SQL query with domain_id IN and subject_id IN filters
    - Support domain-only filter (all subjects in domain) or domain+subject combination
    - Return paginated content with total count, hasMore flag
    - Optimize with indexes for sub-500ms response time
    - _Requirements: 4.1, 4.2, 10.3, 10.8, 10.9, 14.5_

  - [ ] 7.2 Update quiz generation API for domain tagging
    - Modify existing `src/app/api/quizzes/generate/route.ts`
    - Load user's enabled domains and subjects from preferences
    - Return error if no domains or subjects enabled with prompt to configure settings
    - Check quiz limit via check_tier_limits before generation
    - Include domain and subject context in AI prompt for appropriate content generation
    - Save quiz with domain_id and subject_id tags
    - Call /api/usage/increment with type: 'quiz'
    - _Requirements: 4.3, 4.4, 4.6, 4.7, 4.8, 6.5, 14.1_

  - [ ] 7.3 Update summary generation API for domain tagging
    - Modify existing `src/app/api/summaries/generate/route.ts`
    - Load user's enabled domains and subjects
    - Return error if no domains or subjects enabled
    - Check summary limit and summary type access based on tier
    - Include domain and subject context in AI prompt for domain-specific terminology
    - Save summary with domain_id and subject_id tags
    - Call /api/usage/increment with type: 'summary'
    - _Requirements: 4.3, 4.4, 4.6, 4.7, 4.8, 6.5, 14.2_

- [ ] 8. Create tier limits validation service
  - [ ] 8.1 Create tier limits service module
    - Create `src/lib/services/tier-limits.ts`
    - Implement checkDomainLimit(userId, newCount) returning LimitCheckResult
    - Implement checkSubjectLimit(userId, newCount) returning LimitCheckResult
    - Implement checkQuizLimit(userId) returning LimitCheckResult
    - Implement checkSummaryLimit(userId) returning LimitCheckResult
    - Each function queries subscription tier and usage_tracking, compares against TIER_LIMITS
    - Return { allowed, reason, currentUsage, limit, upgradeRequired }
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 15.5, 15.6_

- [ ] 9. Checkpoint - Test backend APIs
  - Test all API endpoints with Postman or API client
  - Verify tier limit enforcement for different subscription tiers
  - Test concurrent preference updates for race conditions
  - Verify content filtering with various domain/subject combinations
  - Test error handling returns appropriate status codes and messages
  - Ensure all tests pass, ask the user if questions arise


### Phase 3: State Management & Data Fetching

- [ ] 10. Create Zustand stores
  - [ ] 10.1 Create preferences store with optimistic updates
    - Create `src/lib/stores/preferences-store.ts`
    - Define PreferencesState with preferences, isLoading, error, lastSyncedAt, pendingUpdates
    - Implement loadPreferences(userId) fetching from /api/preferences
    - Implement updateDomains(domains) with optimistic update: immediately update local state, POST to API, rollback on error
    - Implement updateSubjects(subjects) with optimistic update pattern
    - Implement updateUISettings(settings) with optimistic update pattern
    - Implement resetToDefaults() calling /api/preferences/reset
    - Implement _rollback(updateId) to revert failed updates
    - Add localStorage persistence for offline backup
    - Debounce rapid updates with 500ms delay
    - _Requirements: 1.3, 1.7, 2.3, 2.7, 3.7, 3.8, 12.1, 12.3, 18.5, 18.6_

  - [ ] 10.2 Create subscription store
    - Create `src/lib/stores/subscription-store.ts`
    - Define SubscriptionState with subscription, usage, limits, isLoading, error
    - Implement loadSubscription(userId) fetching from /api/subscription/status
    - Implement checkLimit(action: ActionType) returning LimitCheckResult
    - Implement incrementUsage(type) for optimistic local counter updates
    - Implement getRemainingQuota(type) computed getter
    - Implement getUsagePercentage(type) for progress bars
    - Implement navigateToCheckout(tier) redirecting to Stripe
    - _Requirements: 6.10, 9.4, 15.4, 15.5_

  - [ ] 10.3 Create content filters store
    - Create `src/lib/stores/content-filters-store.ts`
    - Define ContentFiltersState with filters (domains, subjects), resultCount, isFiltering
    - Implement setDomainFilters(domains) action
    - Implement setSubjectFilters(subjects) action
    - Implement clearFilters() action
    - Persist filters to sessionStorage for same-session persistence
    - Clear sessionStorage on navigation away from quiz/summary pages
    - _Requirements: 10.3, 10.4, 10.6_

  - [ ] 10.4 Create UI state store
    - Create `src/lib/stores/ui-store.ts`
    - Define UIState with upgradeModal, errorToast, successToast, loadingStates
    - Implement showUpgradeModal(limitType, currentUsage, currentLimit, recommendedTier)
    - Implement hideUpgradeModal()
    - Implement showSuccessToast(message) with 4-second auto-dismiss
    - Implement showErrorToast(message, retry?) with retry callback
    - Implement setLoading(key, isLoading) for tracking async operations
    - _Requirements: 6.6, 19.1, 19.2_

- [ ] 11. Create custom React hooks
  - [ ] 11.1 Create usePreferences hook
    - Create `src/lib/hooks/usePreferences.ts`
    - Use React Query's useQuery for fetching preferences with 5-minute staleTime
    - Use useMutation for updateDomains, updateSubjects, updateUISettings
    - Integrate with preferences store for optimistic updates
    - Show error toast and rollback on mutation failures
    - Auto-refetch every 5 minutes when tab active
    - _Requirements: 3.4, 12.2, 12.4, 18.5_

  - [ ] 11.2 Create useSubscription hook
    - Create `src/lib/hooks/useSubscription.ts`
    - Use React Query's useQuery for subscription status
    - Expose canPerformAction(action) checking tier limits client-side
    - Expose getUpgradePrompt(action) returning modal data when limit reached
    - Integrate with subscription store
    - _Requirements: 6.5, 6.6, 15.5, 15.6_

  - [ ] 11.3 Create useContentFilters hook
    - Create `src/lib/hooks/useContentFilters.ts`
    - Use React Query's useQuery with filters as query key for auto-refetch
    - Debounce refetch with 300ms delay to reduce API calls
    - Integrate with content-filters store
    - _Requirements: 10.3, 10.6, 10.9_

  - [ ] 11.4 Create useDomains hook
    - Create `src/lib/hooks/useDomains.ts`
    - Use useQuery to fetch all domains (predefined + custom)
    - Implement createCustomDomain(name, description) mutation
    - Implement deleteDomain(domainId) mutation with confirmation
    - Handle validation errors for invalid characters and limits
    - _Requirements: 1.1, 1.2, 1.8, 1.9_

  - [ ] 11.5 Create useSubjects hook
    - Create `src/lib/hooks/useSubjects.ts`
    - Use useQuery to fetch subjects by domainIds parameter
    - Cache subjects with infinite staleTime (rarely change)
    - _Requirements: 2.1, 2.2_

- [ ] 12. Checkpoint - Test state management
  - Create test component to verify store actions and hooks
  - Test optimistic updates with simulated delays and failures
  - Verify rollback restores previous state correctly
  - Test localStorage and sessionStorage persistence
  - Ensure all tests pass, ask the user if questions arise


### Phase 4: Shared UI Components

- [ ] 13. Create foundational UI components
  - [ ] 13.1 Create Toast notification component
    - Create `src/components/ui/toast.tsx` using Radix UI Toast
    - Support success, error, info variants with semantic colors
    - Implement 4-second auto-dismiss with progress bar
    - Add close button for manual dismissal
    - Position in top-right with responsive stacking
    - Ensure accessibility: role="alert", aria-live="polite"
    - _Requirements: 19.1, 19.2_

  - [ ] 13.2 Create Modal/Dialog component
    - Create `src/components/ui/modal.tsx` using Radix UI Dialog
    - Support dismissible and non-dismissible modes
    - Implement backdrop with opacity animation
    - Add keyboard navigation (Escape, Tab trap)
    - Restore focus to trigger on close
    - Responsive: full-screen mobile, centered desktop
    - _Requirements: 6.6, 7.9, 11.2_

  - [ ] 13.3 Create Progress Bar component
    - Create `src/components/ui/progress.tsx` using Radix UI Progress
    - Color-code by percentage: green <70%, yellow 70-90%, red >90%
    - Animate value changes with 300ms transition
    - Support label and current/max value display
    - _Requirements: 15.4_

  - [ ] 13.4 Create Card component
    - Create `src/components/ui/card.tsx` with header/content/footer slots
    - Support variants: default, outlined, elevated
    - Implement hover effects: scale 1.02, shadow transition (150ms)
    - Responsive padding: 12px mobile, 16px tablet, 24px desktop
    - _Requirements: 11.1, 11.4_

  - [ ] 13.5 Create Badge component
    - Create `src/components/ui/badge.tsx` for tags
    - Support domain-specific color variants
    - Implement small and medium sizes
    - Add optional close button for removable badges
    - _Requirements: 4.5, 14.6_

  - [ ] 13.6 Create Button component variants
    - Create/extend `src/components/ui/button.tsx`
    - Support primary, secondary, outline, ghost variants
    - Implement loading state with spinner
    - Ensure 44x44px minimum touch target
    - Add hover/focus effects with 50ms response
    - _Requirements: 11.4, 11.7, 17.5_

- [ ] 14. Create Upgrade Modal component
  - [ ] 14.1 Create UpgradeModal component
    - Create `src/components/subscription/upgrade-modal.tsx`
    - Accept: isOpen, onClose, limitType, currentUsage, currentLimit, recommendedTier
    - Display limit type explanation (e.g., "Domain limit reached")
    - Show usage progress bar with current/limit
    - Display recommended tier with features and pricing
    - Add "Upgrade Now" button linking to /subscription page
    - Make non-dismissible when triggered by enforcement (pass dismissible prop)
    - _Requirements: 6.6, 15.1, 15.2, 15.3, 15.6_

- [ ] 15. Checkpoint - Test shared UI components
  - Create Storybook stories for all components
  - Test at 320px, 768px, 1024px, 1440px viewports
  - Verify keyboard navigation and screen reader accessibility
  - Test touch interactions on mobile simulator
  - Verify animations run at 60fps
  - Ensure all tests pass, ask the user if questions arise


### Phase 5: Domain & Subject Components

- [ ] 16. Create domain selector components
  - [ ] 16.1 Create DomainCard component
    - Create `src/components/domains/domain-card.tsx`
    - Display domain name, description, icon from lucide-react
    - Show selected state: checkmark overlay, border highlight
    - Show disabled state: opacity 0.5, cursor not-allowed when tier limit reached
    - Responsive sizing: full-width mobile, 50% tablet, 33% desktop
    - Hover animation: scale 1.02, shadow elevation
    - _Requirements: 1.1, 1.6, 11.4, 11.5_

  - [ ] 16.2 Create DomainSelector component
    - Create `src/components/domains/domain-selector.tsx`
    - Accept: selectedDomains, onSelectionChange, maxSelections, showUpgradePrompt, variant
    - Render grid of DomainCard (1 col mobile, 2 tablet, 3 desktop)
    - Disable cards beyond maxSelections
    - Show upgrade modal when disabled domain clicked
    - Implement optimistic UI with loading spinner
    - _Requirements: 1.1, 1.4, 1.6, 6.6_

  - [ ] 16.3 Create CustomDomainCreator component
    - Create `src/components/domains/custom-domain-creator.tsx`
    - Provide input field with 1-50 char validation using React Hook Form + Zod
    - Show inline error for invalid characters (letters/numbers/spaces/hyphens only)
    - Show inline error when 10 custom domain limit reached
    - Implement Create button with loading state
    - Clear input and show success toast on creation
    - _Requirements: 1.2, 1.8, 1.9, 19.6_

- [ ] 17. Create subject management components
  - [ ] 17.1 Create SubjectToggle component
    - Create `src/components/subjects/subject-toggle.tsx`
    - Display subject name with Radix UI Switch
    - Show enabled/disabled with 150ms transition
    - Implement optimistic toggle with rollback on error
    - Ensure 44x44px touch target
    - _Requirements: 2.2, 2.3, 11.5, 17.5_

  - [ ] 17.2 Create SubjectGroup component
    - Create `src/components/subjects/subject-group.tsx`
    - Use Radix UI Accordion for collapsible domain sections
    - Display domain name as trigger with expand/collapse icon
    - Show enabled count badge (e.g., "5 / 10 enabled")
    - Render SubjectToggle list in accordion content
    - Provide "Enable All" / "Disable All" bulk actions
    - _Requirements: 2.2, 2.8_

  - [ ] 17.3 Create SubjectTogglePanel component
    - Create `src/components/subjects/subject-toggle-panel.tsx`
    - Accept: domains, selectedSubjects, onToggle, groupByDomain, showEnabledCount
    - Render SubjectGroup components grouped by domain
    - Implement search/filter input for quick subject finding
    - Show empty state when no domains selected with prompt
    - Update subject list when domains change
    - _Requirements: 2.1, 2.7, 9.10_

- [ ] 18. Checkpoint - Test domain and subject components
  - Test domain selection with various tier limits
  - Verify custom domain creation validation
  - Test subject toggles with optimistic updates
  - Test bulk enable/disable actions
  - Verify responsive behavior across viewports
  - Ensure all tests pass, ask the user if questions arise


### Phase 6: Subscription & Filtering Components

- [ ] 19. Create subscription page components
  - [ ] 19.1 Create SubscriptionCard component
    - Create `src/components/subscription/subscription-card.tsx`
    - Accept: tier, pricing, features, isCurrentPlan, isRecommended, onActionClick, actionLabel
    - Display tier name (h3), pricing with /month suffix
    - Render feature list with checkmarks
    - Show "Recommended" badge for Pro tier (elevated card with border)
    - Display action button with dynamic label: "Upgrade", "Downgrade", "Current Plan"
    - Disable button if isCurrentPlan
    - Responsive: stacked mobile, grid desktop
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 19.2 Create SubscriptionPage component
    - Create `src/app/(dashboard)/subscription/page.tsx`
    - Display three SubscriptionCard components for Free, Pro ($10/mo), Premium ($30/mo)
    - Show current tier, billing period end date, usage stats at top
    - Highlight Pro tier as recommended
    - Handle upgrade button: navigate to Stripe checkout
    - Handle downgrade button: show confirmation modal with impact explanation
    - _Requirements: 7.1, 7.8, 7.9, 7.10_

  - [ ] 19.3 Create UsageStats component
    - Create `src/components/subscription/usage-stats.tsx`
    - Display domain count, subject count, quiz count, summary count
    - Show progress bars for each metric with current/limit
    - Color-code progress: green <70%, yellow 70-90%, red >90%
    - Display billing period reset date for quiz/summary quotas
    - _Requirements: 6.10, 9.4, 15.4_

- [ ] 20. Create content filtering components
  - [ ] 20.1 Create ContentFilter component
    - Create `src/components/filters/content-filter.tsx`
    - Accept: availableDomains, availableSubjects, selectedFilters, onFilterChange, resultCount, variant
    - Render multi-select domain chips
    - Render nested subject selection grouped by domain
    - Add "Clear All" button to reset filters
    - Display result count badge
    - Responsive: slide-out drawer mobile, sidebar desktop
    - _Requirements: 10.1, 10.2, 10.6_

  - [ ] 20.2 Create DomainFilter component
    - Create `src/components/filters/domain-filter.tsx`
    - Display domain checkboxes or chips
    - Show selected count badge
    - Handle multi-select with optimistic UI
    - _Requirements: 10.1, 10.3_

  - [ ] 20.3 Create SubjectFilter component
    - Create `src/components/filters/subject-filter.tsx`
    - Display subjects grouped by domain with accordion
    - Show only subjects for selected domains
    - Handle multi-select with clear action per domain
    - _Requirements: 10.2, 10.3_

- [ ] 21. Update quiz and summary list pages with filters
  - [ ] 21.1 Update quiz list page for filtering
    - Modify `src/app/(dashboard)/quizzes/page.tsx`
    - Add ContentFilter component in sidebar (desktop) or drawer (mobile)
    - Connect to useContentFilters hook
    - Display filtered quizzes with domain/subject badges
    - Show empty state: "No quizzes created yet" if none exist, "No matches found" if filters exclude all
    - Update list within 500ms of filter changes
    - _Requirements: 4.5, 10.3, 10.5, 10.7, 14.6_

  - [ ] 21.2 Update summary list page for filtering
    - Modify `src/app/(dashboard)/summaries/page.tsx`
    - Add ContentFilter component
    - Connect to useContentFilters hook
    - Display filtered summaries with domain/subject badges
    - Show empty state appropriately
    - _Requirements: 4.5, 10.3, 10.5, 10.7, 14.6_

- [ ] 22. Checkpoint - Test subscription and filtering
  - Test subscription card display for all tiers
  - Verify usage stats update correctly
  - Test content filters with various domain/subject combinations
  - Verify filter persistence in session
  - Test empty states for no content vs no matches
  - Ensure all tests pass, ask the user if questions arise


### Phase 7: Navigation & Settings Integration

- [ ] 23. Create enhanced navigation
  - [ ] 23.1 Update navigation component
    - Modify existing navigation component (likely `src/components/layout/navigation.tsx` or similar)
    - Add new tabs in order: Dashboard, Subjects, Quizzes, Summaries, AI Assistant, Subscription, Settings, Profile
    - Implement active tab indicator with 3:1 contrast ratio using background color change
    - Responsive: horizontal bar desktop (≥768px), hamburger menu mobile (<768px)
    - Navigate within 300ms of tab click
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 23.2 Implement notification badges
    - Add notification badge support to navigation tabs
    - Display unread count (max "99+") for new content
    - Connect to notification state store
    - Clear badge when user navigates to tab
    - _Requirements: 8.5, 8.6_

  - [ ] 23.3 Implement keyboard navigation
    - Add Tab key support to move between nav items
    - Add Enter key support to activate selected item
    - Ensure proper focus indicators
    - _Requirements: 8.10_

- [ ] 24. Create settings page
  - [ ] 24.1 Create settings page layout
    - Create `src/app/(dashboard)/settings/page.tsx`
    - Organize in sections: Domain Selection, Subject Preferences, UI Customization, Subscription Info
    - Show current tier, domain count, subject count, usage stats at top
    - _Requirements: 9.1, 9.4_

  - [ ] 24.2 Integrate domain selector in settings
    - Add DomainSelector component to Domain Selection section
    - Load max domains from subscription tier
    - Show upgrade prompt when limit reached
    - Display save confirmation within 1 second
    - _Requirements: 9.1, 9.5_

  - [ ] 24.3 Integrate subject toggle panel in settings
    - Add SubjectTogglePanel to Subject Preferences section
    - Group subjects by selected domains
    - Update dynamically when domains change
    - _Requirements: 9.2, 9.10_

  - [ ] 24.4 Create UI customization section
    - Add theme selector: light, dark, system with radio buttons
    - Add language selector: English, Spanish, French, German with dropdown
    - Add notification preferences: email, push, in-app with checkboxes
    - Apply changes immediately with optimistic UI
    - _Requirements: 9.3, 9.5_

  - [ ] 24.5 Add validation and reset functionality
    - Prevent saving when no domains selected (show error)
    - Prevent saving when no subjects selected (show error)
    - Add "Reset to Defaults" button
    - Show confirmation modal before reset
    - _Requirements: 9.6, 9.7, 9.8, 9.9_

- [ ] 25. Create adaptive UI system
  - [ ] 25.1 Create domain adapter utility
    - Create `src/lib/utils/domain-adapter.ts`
    - Define terminology mappings per domain (e.g., Medical: "patient cases", Engineering: "problem sets")
    - Define color schemes per domain
    - Define icon sets per domain
    - Export getDomainAdaptation(domainId) function
    - _Requirements: 5.1, 5.2_

  - [ ] 25.2 Create withDomainAdapter HOC
    - Create `src/lib/hoc/with-domain-adapter.tsx`
    - Wrap components to apply domain-specific styling and terminology
    - Use neutral styling when multiple domains active
    - Memoize for performance
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ] 25.3 Apply domain adaptation to dashboard
    - Update dashboard page to use domain adapter
    - Display domain-appropriate welcome messages
    - Apply domain-specific tips
    - Update within 500ms of domain changes
    - _Requirements: 5.3, 5.6, 5.7_

  - [ ] 25.4 Apply domain adaptation to navigation
    - Highlight domain-relevant features in navigation
    - Use domain terminology in tooltips
    - _Requirements: 5.4_

- [ ] 26. Checkpoint - Test navigation and settings
  - Test navigation across all tabs
  - Verify active tab indicator and keyboard navigation
  - Test settings with various tier limits
  - Verify domain/subject validation
  - Test UI customization applies immediately
  - Test domain adaptation for each predefined domain
  - Ensure all tests pass, ask the user if questions arise


### Phase 8: Backwards Compatibility & Migration

- [ ] 27. Create data migration scripts
  - [ ] 27.1 Create user migration script
    - Create migration script in `supabase/migrations/` directory
    - Assign Medical domain to all existing users in user_domains table
    - Create Free tier subscription for users without subscriptions
    - Set billing_period_start to migration date, billing_period_end to +30 days
    - Create initial usage_tracking records with zero counts
    - Log migration progress and errors
    - _Requirements: 16.1, 16.5_

  - [ ] 27.2 Create content tagging migration script
    - Tag all existing quizzes with Medical domain_id
    - Determine subject_id from existing topic field or default to "General Medicine" subject
    - Tag all existing summaries with Medical domain_id and appropriate subject_id
    - Tag existing tasks if applicable
    - Update subject_analytics to use domain_id and subject_id instead of subject text
    - _Requirements: 16.2, 16.4, 16.6_

  - [ ] 27.3 Implement migration error handling
    - Add retry logic: 3 attempts with 5-second delays
    - Log detailed errors: record ID, inconsistency type, error message
    - Mark failed records for manual review
    - Send admin email notification for failed migrations
    - Provide read-only access to unmigrated content with notice
    - _Requirements: 16.8, 16.9_

  - [ ] 27.4 Verify session continuity post-migration
    - Validate existing session tokens remain valid
    - Ensure users don't need to re-authenticate
    - Test with sample existing user sessions
    - _Requirements: 16.10_

- [ ] 28. Maintain backwards-compatible APIs
  - [ ] 28.1 Ensure legacy API endpoints work
    - Test existing quiz generation without domain/subject params (default to user's first enabled domain/subject)
    - Test existing summary generation similarly
    - Verify existing analytics queries work with new schema
    - _Requirements: 16.3_

  - [ ] 28.2 Test spaced repetition preservation
    - Verify existing due dates preserved after migration
    - Check interval values, ease factors, review history intact
    - Test spaced repetition algorithm still functions
    - _Requirements: 16.6_

  - [ ] 28.3 Test analytics data preservation
    - Verify historical study time data intact
    - Check quiz scores and completion rates preserved
    - Verify learning streaks maintained
    - _Requirements: 16.7_

- [ ] 29. Checkpoint - Verify backwards compatibility
  - Run migration scripts on test database with sample data
  - Verify all existing users migrated successfully
  - Test existing features still work for migrated users
  - Verify no data loss or corruption
  - Test migration rollback if needed
  - Ensure all tests pass, ask the user if questions arise


### Phase 9: Responsive Design & Performance

- [ ] 30. Implement responsive design
  - [ ] 30.1 Optimize settings panel responsiveness
    - Test settings page at 320px (mobile), 768px (tablet), 1024px+ (desktop)
    - Stack domain cards single column on mobile
    - Use two columns for domain cards on tablet
    - Use three columns for domain cards on desktop
    - Ensure all touch targets ≥44x44px on mobile
    - _Requirements: 17.1, 17.5_

  - [ ] 30.2 Optimize navigation responsiveness
    - Collapse navigation to hamburger menu below 768px
    - Show horizontal bar above 768px
    - Test navigation on iOS Safari and Chrome Mobile
    - _Requirements: 17.2, 17.7_

  - [ ] 30.3 Optimize subscription page responsiveness
    - Stack subscription cards vertically on mobile
    - Show 2-column grid on tablet
    - Show 3-column grid on desktop
    - _Requirements: 17.3_

  - [ ] 30.4 Optimize content filters responsiveness
    - Show filters in slide-out drawer on mobile
    - Show filters in sidebar on desktop
    - Ensure filter drawer accessible via button on mobile
    - _Requirements: 17.4_

  - [ ] 30.5 Test text readability
    - Verify all text has ≥4.5:1 contrast for normal text
    - Verify ≥3:1 contrast for large text
    - Ensure no horizontal scrolling at any viewport size
    - _Requirements: 17.6, 17.7_

- [ ] 31. Implement performance optimizations
  - [ ] 31.1 Optimize initial load performance
    - Implement code splitting for domain-specific components
    - Lazy-load images and non-critical assets
    - Minimize bundle size to <200KB gzipped for initial load
    - Test Lighthouse score ≥90 on desktop
    - Test dashboard loads in <3 seconds on 4G mobile
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.7_

  - [ ] 31.2 Optimize preferences caching
    - Cache user preferences in memory to avoid repeated database queries
    - Set React Query staleTime to 5 minutes for preferences
    - Implement localStorage backup for offline access
    - _Requirements: 18.5_

  - [ ] 31.3 Implement optimistic UI updates
    - Apply optimistic updates for all preference changes
    - Show loading state only after 200ms delay
    - Rollback on failure with error toast
    - _Requirements: 18.6_

  - [ ] 31.4 Optimize animations for 60fps
    - Use transform and opacity only for animations
    - Avoid animating layout properties (width, height, margin, padding)
    - Test animations on low-end devices
    - Ensure all transitions <300ms
    - _Requirements: 11.2, 11.5, 11.8_

- [ ] 32. Implement error handling and feedback
  - [ ] 32.1 Implement success notifications
    - Show success toast for: domain selection, subject toggle, preference save, quiz generation, summary creation, subscription change, filter application
    - Auto-dismiss after 4 seconds
    - _Requirements: 19.1_

  - [ ] 32.2 Implement error notifications
    - Show error toast with error type and next action for all failed operations
    - For HTTP 5xx or 10-second timeout: show connection error with retry button
    - Retry up to 2 additional times with 2-second delays
    - _Requirements: 19.2, 19.3, 19.4_

  - [ ] 32.3 Implement content generation error handling
    - Show specific error for invalid input
    - Show specific error for rate limiting
    - Show specific error for service unavailability
    - _Requirements: 19.5_

  - [ ] 32.4 Implement form validation
    - Validate input on blur event
    - Show inline errors within 200ms
    - Prevent submission if validation errors exist
    - Display all validation errors inline
    - _Requirements: 19.6, 19.7_

  - [ ] 32.5 Implement error logging
    - Log client-side errors with severity "error" or "fatal" to error tracking service
    - Include stack trace, user context, timestamp
    - _Requirements: 19.8_

  - [ ] 32.6 Implement loading fallbacks
    - Show fallback UI with error message if initial data loading fails
    - Show skeleton screens for content loading >200ms
    - _Requirements: 19.9_

- [ ] 33. Checkpoint - Test responsive design and performance
  - Test all pages at 320px, 768px, 1024px, 1440px viewports
  - Run Lighthouse audits and verify ≥90 score
  - Test on slow 3G connection for performance
  - Verify error handling for all failure scenarios
  - Test optimistic updates with network throttling
  - Ensure all tests pass, ask the user if questions arise


### Phase 10: Integration & End-to-End Testing

- [ ] 34. Integrate all features end-to-end
  - [ ] 34.1 Test complete user onboarding flow
    - New user signs up → defaults to Free tier with no domains/subjects
    - User navigates to Settings → selects domains (within free tier limit of 1)
    - User toggles subjects (within free tier limit of 3)
    - User generates first quiz → domain/subject tags applied, usage counter incremented
    - Verify user hits quiz limit after 5 quizzes → upgrade modal appears
    - _Requirements: 3.5, 6.5, 6.6, 15.1, 15.2_

  - [ ] 34.2 Test domain switching flow
    - User with multiple domains changes domain selection
    - UI adapts with new terminology and colors within 500ms
    - Subject list updates to show only subjects for selected domains
    - Content filters update to match new domains
    - Dashboard shows domain-appropriate welcome message
    - _Requirements: 5.1, 5.6, 9.10_

  - [ ] 34.3 Test subscription upgrade flow
    - Free tier user hits domain limit → upgrade modal appears
    - User clicks Upgrade → navigates to /subscription page
    - User selects Pro tier → redirects to Stripe checkout
    - After successful payment → user subscription updated to Pro
    - User can now select up to 3 domains and generate 50 quizzes/month
    - _Requirements: 7.8, 15.1, 15.3_

  - [ ] 34.4 Test content filtering flow
    - User navigates to Quizzes page
    - Opens filter drawer/sidebar → selects domains and subjects
    - Quiz list updates within 500ms showing only filtered content
    - Filters persist while on page (session storage)
    - Clear filters button resets to show all quizzes
    - Navigate away and back → filters cleared
    - _Requirements: 10.3, 10.4, 10.6_

  - [ ] 34.5 Test preference persistence flow
    - User updates domains → preferences saved within 500ms
    - User closes browser and reopens → preferences loaded within 2 seconds
    - User updates UI settings → changes apply immediately
    - Verify localStorage backup exists for offline access
    - _Requirements: 3.4, 3.7, 3.8, 18.5_

  - [ ] 34.6 Test error recovery flow
    - Simulate API failure during domain update → optimistic update rolls back, error toast shown
    - Simulate network timeout → retry button appears, retries up to 2 times
    - Simulate tier limit exceeded → upgrade modal appears with clear explanation
    - _Requirements: 19.2, 19.3, 19.4_

  - [ ] 34.7 Test mobile experience
    - Test complete flow on mobile viewport (320px)
    - Verify hamburger menu navigation works
    - Verify touch targets ≥44x44px
    - Test filter drawer opens and closes smoothly
    - Verify subscription cards stack properly
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 35. Create automated tests
  - [ ]* 35.1 Write unit tests for stores
    - Test preferences store: optimistic updates, rollback, localStorage persistence
    - Test subscription store: tier limit checks, usage calculations
    - Test content filters store: filter persistence, session storage
    - Test UI store: modal and toast state management
    - _Requirements: 12.1, 12.3_

  - [ ]* 35.2 Write unit tests for hooks
    - Test usePreferences: data fetching, mutations, error handling
    - Test useSubscription: limit checks, upgrade prompts
    - Test useContentFilters: filter updates, debouncing
    - Test useDomains and useSubjects: CRUD operations
    - _Requirements: 12.2, 12.4_

  - [ ]* 35.3 Write integration tests for API endpoints
    - Test preferences APIs: domain selection, subject toggle, UI settings
    - Test subscription APIs: status, upgrade, usage increment
    - Test content APIs: filtering, generation with tagging
    - Test tier limit enforcement across all endpoints
    - _Requirements: 6.5, 15.5_

  - [ ]* 35.4 Write component tests
    - Test DomainSelector: selection, tier limits, upgrade prompts
    - Test SubjectTogglePanel: toggles, bulk actions, search
    - Test ContentFilter: multi-select, clear filters
    - Test SubscriptionCard: display, button states
    - _Requirements: 1.1, 2.2, 10.1, 7.2_

  - [ ]* 35.5 Write E2E tests for critical flows
    - Test user onboarding: signup → domain selection → quiz generation
    - Test subscription upgrade: hit limit → upgrade modal → checkout
    - Test content filtering: apply filters → verify results → clear filters
    - Test backwards compatibility: existing user login → verify data intact
    - _Requirements: 16.1, 16.2, 16.10_

- [ ] 36. Final checkpoint - Production readiness
  - Run full test suite and verify all tests pass
  - Perform manual QA on staging environment
  - Test migration scripts on staging with production-like data
  - Verify Lighthouse scores ≥90
  - Check accessibility with keyboard and screen reader
  - Review error logging and monitoring setup
  - Ensure all tests pass, ask the user if questions arise


## Notes

- **Task Ordering**: Tasks are organized in logical dependency order - database schema first, then backend APIs, state management, UI components, and finally integration
- **Optional Tasks**: Tasks marked with `*` are optional and primarily focused on testing and optimization
- **Checkpoints**: Checkpoint tasks provide natural stopping points to verify progress before moving to the next phase
- **Requirements Traceability**: Each task references specific requirements from requirements.md for full traceability
- **Backwards Compatibility**: Phase 8 focuses entirely on maintaining backwards compatibility with existing medical-focused features
- **Incremental Implementation**: Each task builds on previous work, allowing for incremental validation and deployment
- **Technology-Specific**: All tasks use TypeScript with Next.js 16.2.9, React 19.2.4, Supabase, and the specified tech stack
- **Performance First**: Phase 9 ensures responsive design and performance optimizations are built in, not bolted on
- **Test Coverage**: Phase 10 provides comprehensive testing from unit tests to E2E tests for production readiness

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3"]
    },
    {
      "id": 1,
      "tasks": ["1.4", "1.5", "1.6", "2.1"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.3", "2.4"]
    },
    {
      "id": 3,
      "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "5.1", "5.2", "5.3"]
    },
    {
      "id": 4,
      "tasks": ["6.1", "6.2", "6.3", "8.1"]
    },
    {
      "id": 5,
      "tasks": ["7.1", "7.2", "7.3"]
    },
    {
      "id": 6,
      "tasks": ["10.1", "10.2", "10.3", "10.4"]
    },
    {
      "id": 7,
      "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5"]
    },
    {
      "id": 8,
      "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6"]
    },
    {
      "id": 9,
      "tasks": ["14.1"]
    },
    {
      "id": 10,
      "tasks": ["16.1"]
    },
    {
      "id": 11,
      "tasks": ["16.2", "16.3"]
    },
    {
      "id": 12,
      "tasks": ["17.1"]
    },
    {
      "id": 13,
      "tasks": ["17.2"]
    },
    {
      "id": 14,
      "tasks": ["17.3"]
    },
    {
      "id": 15,
      "tasks": ["19.1"]
    },
    {
      "id": 16,
      "tasks": ["19.2", "19.3"]
    },
    {
      "id": 17,
      "tasks": ["20.1"]
    },
    {
      "id": 18,
      "tasks": ["20.2", "20.3"]
    },
    {
      "id": 19,
      "tasks": ["21.1", "21.2"]
    },
    {
      "id": 20,
      "tasks": ["23.1", "23.2", "23.3"]
    },
    {
      "id": 21,
      "tasks": ["24.1"]
    },
    {
      "id": 22,
      "tasks": ["24.2", "24.3", "24.4"]
    },
    {
      "id": 23,
      "tasks": ["24.5", "25.1"]
    },
    {
      "id": 24,
      "tasks": ["25.2"]
    },
    {
      "id": 25,
      "tasks": ["25.3", "25.4"]
    },
    {
      "id": 26,
      "tasks": ["27.1"]
    },
    {
      "id": 27,
      "tasks": ["27.2", "27.3", "27.4"]
    },
    {
      "id": 28,
      "tasks": ["28.1", "28.2", "28.3"]
    },
    {
      "id": 29,
      "tasks": ["30.1", "30.2", "30.3", "30.4", "30.5"]
    },
    {
      "id": 30,
      "tasks": ["31.1", "31.2", "31.3", "31.4"]
    },
    {
      "id": 31,
      "tasks": ["32.1", "32.2", "32.3", "32.4", "32.5", "32.6"]
    },
    {
      "id": 32,
      "tasks": ["34.1", "34.2", "34.3", "34.4", "34.5", "34.6", "34.7"]
    },
    {
      "id": 33,
      "tasks": ["35.1", "35.2", "35.3", "35.4", "35.5"]
    }
  ]
}
```
