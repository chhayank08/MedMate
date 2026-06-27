# Requirements Document

## Introduction

This document specifies the requirements for transforming PrepBud from a medical-focused learning application into a comprehensive multi-domain AI-powered learning platform. The system will support multiple learning domains (Medical, Engineering, Business, Law, Science, Technology, Humanities, and custom categories) with intelligent personalization, dynamic content generation, adaptive UI, subscription management, and enhanced navigation. The transformation maintains all existing functionality while adding scalable domain-agnostic features that deliver a premium, modern learning experience comparable to leading AI SaaS platforms.

## Glossary

- **Platform**: The complete multi-domain learning application system
- **Domain**: A broad learning category (e.g., Medical, Engineering, Business, Law, Science, Technology, Humanities)
- **Subject**: A specific topic within a domain (e.g., Anatomy within Medical, Calculus within Engineering)
- **User_Preferences**: Persistent storage of user-selected domains, subjects, and personalization settings
- **Content_Generator**: The AI system that produces quizzes, summaries, and study materials
- **Subscription_System**: The billing and access control mechanism managing Free, Pro, and Premium tiers
- **Navigation_System**: The application's routing and menu structure
- **Settings_Panel**: The interface for configuring domain selection, subject toggles, and user preferences
- **Dashboard**: The primary user interface showing personalized learning metrics and quick actions
- **UI_Adapter**: The system component that transforms interface elements based on selected domain
- **Pricing_Tier**: A subscription level (Free, Pro ~$10/month, Premium) with associated feature access
- **State_Manager**: The client-side state management system for user preferences and application data
- **Backend_Service**: The server-side API and database layer supporting multi-domain operations

## Requirements

### Requirement 1: Multi-Domain Support

**User Story:** As a learner, I want to select from multiple learning domains beyond just medical studies, so that I can use the platform for diverse learning needs across different fields.

#### Acceptance Criteria

1. THE Platform SHALL display the following predefined domains for user selection: Medical, Engineering, Business, Law, Science, Technology, and Humanities
2. THE Platform SHALL allow users to create custom domain categories with names between 1 and 50 characters
3. WHEN a user selects a domain, THE Platform SHALL persist the selection to User_Preferences
4. THE Platform SHALL allow users to select up to 20 domains simultaneously
5. THE Platform SHALL maintain the list of selected domains across user sessions
6. THE Platform SHALL display visual indication of which domains are currently selected
7. WHEN a user adds or removes a domain, THE Platform SHALL update the User_Preferences within 500ms
8. IF a custom domain name contains characters other than letters, numbers, spaces, or hyphens, THEN THE Platform SHALL reject the input and display an error message indicating invalid characters
9. IF a user attempts to create more than 10 custom domains, THEN THE Platform SHALL reject the creation and display an error message indicating the limit has been reached
10. IF domain selection persistence fails, THEN THE Platform SHALL display an error message indicating the selection could not be saved and retain the previous selection state

### Requirement 2: Dynamic Subject Management

**User Story:** As a learner using multiple domains, I want to manage subjects within each domain independently, so that I can focus on specific topics relevant to my learning goals.

#### Acceptance Criteria

1. THE Platform SHALL display domain-specific subject lists for each predefined domain with unique identifiers
2. THE Settings_Panel SHALL display toggleable subject options grouped by domain with visual state indication
3. WHEN a user toggles a subject, THE Platform SHALL update User_Preferences within 200ms
4. THE Platform SHALL persist subject selections across user sessions
5. WHILE a user has enabled subjects, THE Content_Generator SHALL filter quiz and summary generation to include only those subjects
6. THE Dashboard SHALL display tasks and content filtered by enabled subjects
7. WHEN subject preferences change, THE Platform SHALL refresh displayed content within 1 second
8. WHEN a user first accesses a domain, THE Platform SHALL enable all subjects for that domain by default
9. IF subject toggle persistence fails, THEN THE Platform SHALL display an error notification and revert the toggle state
10. IF a user disables all subjects within all selected domains, THEN THE Platform SHALL display a prompt to enable at least one subject

### Requirement 3: Persistent User Preferences

**User Story:** As a returning user, I want my domain and subject selections to be remembered, so that I don't have to reconfigure the platform every time I log in.

#### Acceptance Criteria

1. THE User_Preferences SHALL persist domain selections in the database with a maximum of 10 domains per user
2. THE User_Preferences SHALL persist subject selections in the database with a maximum of 20 subjects per user
3. THE User_Preferences SHALL persist UI customization settings in the database including theme preference, language preference, and display density
4. WHEN a user logs in, THE Platform SHALL load User_Preferences within 2 seconds
5. IF a user has no existing preferences, THEN THE Platform SHALL initialize default preferences with no domains selected, no subjects selected, system theme, English language, and standard display density
6. IF User_Preferences fail to load within 2 seconds, THEN THE Platform SHALL display an error notification indicating preferences are unavailable and proceed with default preferences
7. THE State_Manager SHALL maintain User_Preferences in memory during the session
8. WHEN User_Preferences are updated, THE Backend_Service SHALL save changes to the database within 500ms
9. IF database persistence fails, THEN THE Platform SHALL display an error notification indicating the save failed, retain the changes in memory, and retry the save operation once
10. IF the retry save operation fails, THEN THE Platform SHALL display an error notification indicating preferences were not saved and will revert on next login

### Requirement 4: Domain-Aware Content Generation

**User Story:** As a learner, I want the AI to generate quizzes and summaries relevant to my selected domains and subjects, so that all generated content matches my learning focus.

#### Acceptance Criteria

1. WHEN generating a quiz, THE Content_Generator SHALL use only the enabled domains from User_Preferences
2. WHEN generating a summary, THE Content_Generator SHALL use only the enabled subjects from User_Preferences
3. THE Content_Generator SHALL include domain identifier and subject identifier in AI generation requests
4. WHEN content is generated, THE Platform SHALL tag the content with the domain identifier and subject identifier used during generation
5. THE Platform SHALL display domain and subject tags on quiz and summary cards
6. IF a user has no enabled subjects, THEN THE Platform SHALL display a prompt directing the user to the Settings_Panel to configure preferences
7. IF a user has no enabled domains, THEN THE Platform SHALL display a prompt directing the user to the Settings_Panel to select at least one domain
8. THE Content_Generator SHALL support all predefined domains with domain-specific terminology and context
9. IF preference retrieval fails during content generation, THEN THE Platform SHALL display an error notification indicating content generation cannot proceed without preferences
10. THE Platform SHALL validate that generated content matches the requested domain and subject identifiers before saving

### Requirement 5: Adaptive User Interface

**User Story:** As a learner, I want the platform's UI to adapt to my selected domain, so that the interface uses appropriate terminology and visual styling for my field of study.

#### Acceptance Criteria

1. WHEN a primary domain is selected, THE UI_Adapter SHALL update terminology throughout the interface
2. THE UI_Adapter SHALL apply domain-specific color schemes and iconography
3. THE Dashboard SHALL display domain-appropriate welcome messages and tips
4. THE Navigation_System SHALL highlight domain-relevant features
5. WHEN multiple domains are active, THE UI_Adapter SHALL use neutral terminology and styling
6. THE UI_Adapter SHALL update the interface within 500ms of domain selection changes
7. THE Platform SHALL maintain visual consistency across all domain adaptations

### Requirement 6: Subscription Management System

**User Story:** As a platform operator, I want to implement a subscription system with multiple pricing tiers, so that users can access features appropriate to their subscription level.

#### Acceptance Criteria

1. THE Subscription_System SHALL provide three selectable Pricing_Tiers: Free, Pro, and Premium
2. THE Subscription_System SHALL enforce Free tier limits of 1 Domain, 3 Subjects, 5 Quizzes per Billing_Period, and access to Standard_Summaries only
3. THE Subscription_System SHALL enforce Pro tier limits of 3 Domains, 50 Quizzes per Billing_Period, and access to Standard_Summaries and Detailed_Summaries, with no limit on Subjects up to 10,000 per Domain
4. THE Subscription_System SHALL enforce Premium tier limits of 10 Domains, 500 Quizzes per Billing_Period, and access to all Summary_Types, with no limit on Subjects up to 10,000 per Domain
5. WHEN a User attempts to create a resource that would exceed their current Pricing_Tier limits, THE Platform SHALL prevent the action
6. WHEN a User attempts to create a resource that would exceed their current Pricing_Tier limits, THE Platform SHALL display a non-dismissible modal upgrade prompt with current usage and available upgrade options
7. THE Subscription_System SHALL track Domain_Count, Subject_Count, Quiz_Count, and Summary_Request_Count per User per Billing_Period
8. THE Subscription_System SHALL reset Quiz_Count and Summary_Request_Count to zero at the start of each Billing_Period
9. THE Subscription_System SHALL define Billing_Period as a calendar month starting at 00:00:00 UTC on the first day of the month in which the subscription was activated
10. THE Subscription_System SHALL provide a subscription management interface displaying Current_Tier, Billing_Period_End_Date, Domain_Count, Subject_Count, Quiz_Count, Summary_Request_Count, and available upgrade options

### Requirement 7: Subscription Page and Pricing Display

**User Story:** As a prospective subscriber, I want to view clear pricing information and subscription benefits, so that I can choose the appropriate tier for my needs.

#### Acceptance Criteria

1. THE Platform SHALL provide a dedicated subscription page accessible via the Navigation_System at route /subscription
2. THE subscription page SHALL display three Pricing_Tier cards with exact pricing: Free ($0/month), Pro ($10/month), Premium ($30/month)
3. THE subscription page SHALL list the feature set defined in Requirement 6 for each Pricing_Tier with visual differentiation using color coding or typography
4. THE subscription page SHALL highlight the Pro tier as recommended using visual emphasis such as border highlight, badge, or elevated card styling
5. IF the user's Current_Tier is Free, THEN THE Platform SHALL display "Current Plan" on the Free card, "Upgrade to Pro" on the Pro card, and "Upgrade to Premium" on the Premium card
6. IF the user's Current_Tier is Pro, THEN THE Platform SHALL display "Downgrade to Free" on the Free card, "Current Plan" on the Pro card, and "Upgrade to Premium" on the Premium card
7. IF the user's Current_Tier is Premium, THEN THE Platform SHALL display "Downgrade to Free" on the Free card, "Downgrade to Pro" on the Pro card, and "Current Plan" on the Premium card
8. WHEN a user clicks an "Upgrade" button, THE Platform SHALL navigate to the checkout flow for the selected tier within 500ms
9. WHEN a user clicks a "Downgrade" button, THE Platform SHALL display a confirmation modal explaining the downgrade impact before proceeding
10. THE subscription page SHALL display the user's Current_Tier, Billing_Period_End_Date, and current usage statistics at the top of the page

### Requirement 8: Enhanced Navigation Structure

**User Story:** As a user, I want organized navigation with clear access to all platform features, so that I can efficiently navigate between different sections of the application.

#### Acceptance Criteria

1. THE Navigation_System SHALL provide the following primary tabs in order: Dashboard, Subjects, Quizzes, Summaries, AI Assistant, Subscription, Settings, Profile
2. THE Navigation_System SHALL indicate the currently active tab by changing its background color to distinguish it from inactive tabs with a contrast ratio of at least 3:1
3. IF the viewport width is 768 pixels or greater, THEN THE Navigation_System SHALL display all tabs in a horizontal bar
4. WHEN a user clicks a navigation tab, THE Platform SHALL navigate to the corresponding page within 300ms
5. WHEN new content becomes available for a feature, THE Navigation_System SHALL display a notification badge containing the count of unread items on the corresponding tab
6. IF the notification count exceeds 99, THEN THE Navigation_System SHALL display "99+" instead of the exact count
7. IF the viewport width is less than 768 pixels, THEN THE Navigation_System SHALL collapse the navigation into a hamburger menu icon
8. WHEN a user navigates between pages, THE Navigation_System SHALL preserve the active tab indicator to reflect the current page
9. IF navigation to a selected page fails, THEN THE Platform SHALL display an error message indicating the navigation failure and retain the user on the current page
10. THE Navigation_System SHALL support keyboard navigation using Tab key to move between navigation items and Enter key to activate the selected item

### Requirement 9: Settings Panel Enhancement

**User Story:** As a user, I want comprehensive settings to control domain selection, subject preferences, and platform personalization, so that I can customize my learning experience.

#### Acceptance Criteria

1. THE Settings_Panel SHALL provide a domain selection interface allowing users to select multiple domains up to their Pricing_Tier limit
2. THE Settings_Panel SHALL provide subject toggle controls grouped by domain
3. THE Settings_Panel SHALL provide UI customization options: theme (light, dark, system), language (English, Spanish, French, German), notification preferences (email, push, in-app)
4. THE Settings_Panel SHALL display Current_Tier, Domain_Count, Subject_Count, Quiz_Count, and Summary_Request_Count
5. WHEN a user changes settings and clicks save, THE Settings_Panel SHALL display a success confirmation message within 1 second
6. IF a user attempts to select domains exceeding their tier limit, THEN THE Settings_Panel SHALL display a validation error message indicating the tier limit and prevent saving
7. IF a user attempts to save settings with all domains deselected, THEN THE Settings_Panel SHALL display a validation error message requiring at least one domain selection and prevent saving
8. IF a user attempts to save settings with all subjects deselected across all domains, THEN THE Settings_Panel SHALL display a validation error message requiring at least one subject selection and prevent saving
9. THE Settings_Panel SHALL provide a reset button that restores default settings: no domains selected, no subjects selected, system theme, English language, all notifications enabled
10. WHEN a user selects or deselects a domain, THE Settings_Panel SHALL automatically update the displayed subject list to show only subjects belonging to selected domains

### Requirement 10: Domain and Subject Toggle Filtering

**User Story:** As a user viewing quizzes and summaries, I want to filter content by domain and subject, so that I can focus on specific learning materials.

#### Acceptance Criteria

1. THE quiz list page SHALL provide domain and subject filter controls
2. THE summary list page SHALL provide domain and subject filter controls
3. WHEN a user selects or deselects a domain or subject filter option, THE Platform SHALL update the displayed content list within 500ms
4. WHILE a user remains on the quiz list page or summary list page, THE Platform SHALL maintain the filter selections for that page in session state only
5. THE Platform SHALL display the count of filtered items
6. THE Platform SHALL provide a clear-filters action to reset all filters
7. IF no content exists on the page, THEN THE Platform SHALL display an empty state message indicating no content has been created yet; IF content exists but no items match the active filters, THEN THE Platform SHALL display an empty state message indicating no matches found and suggesting filter adjustment or using the clear-filters action
8. WHEN a domain filter is selected without selecting any specific subject filters, THE Platform SHALL display all content tagged with that domain regardless of subject
9. WHEN both domain and subject filters are selected, THE Platform SHALL display only content where the domain matches any selected domain AND the subject matches any selected subject within those domains

### Requirement 11: Modern UX/UI Refinement

**User Story:** As a user, I want a polished, modern interface with smooth animations and intuitive interactions, so that the platform feels premium and professional.

#### Acceptance Criteria

1. THE Platform SHALL apply spacing using multiples of 4px (4px, 8px, 12px, 16px, 24px, 32px), use a consistent typographic scale (12px, 14px, 16px, 20px, 24px, 32px, 48px), and maintain a color palette with defined primary, secondary, neutral, success, warning, and error colors
2. WHEN the Platform transitions between views, THE transition SHALL complete within 300ms using cubic-bezier easing
3. WHEN an asynchronous operation takes longer than 200ms, THE Platform SHALL display a skeleton screen or progress indicator
4. WHEN a user hovers over a clickable element, THE Platform SHALL provide visual feedback within 50ms such as color change, scale transformation, or shadow change
5. WHEN a user triggers a state change (toggle switch, checkbox selection, button click), THE Platform SHALL display an animation lasting 150-300ms
6. THE Platform SHALL emphasize important interactive elements using size (larger elements for primary actions), position (top or center placement), and contrast (higher contrast for primary actions)
7. THE Platform SHALL ensure all text has a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text, and all touch targets have a minimum size of 44x44 pixels
8. THE Platform SHALL limit animations to transform and opacity properties to maintain 60fps performance

### Requirement 12: State Management Architecture

**User Story:** As a developer, I want robust state management for user preferences and domain data, so that the application maintains consistent state across all components.

#### Acceptance Criteria

1. THE State_Manager SHALL maintain user preferences in a centralized store
2. THE State_Manager SHALL synchronize state changes across all components within 100ms
3. THE State_Manager SHALL persist critical state to local storage as backup
4. WHEN the application initializes, THE State_Manager SHALL load preferences from the Backend_Service
5. THE State_Manager SHALL handle concurrent state updates without data loss
6. THE State_Manager SHALL provide typed interfaces for all state properties
7. THE State_Manager SHALL trigger re-renders only for components affected by state changes

### Requirement 13: Backend Multi-Domain Schema

**User Story:** As a developer, I want a scalable database schema that supports multi-domain data, so that the system can efficiently store and query domain-specific information.

#### Acceptance Criteria

1. THE Backend_Service SHALL provide a domains table with fields: domain_id (primary key), name (string, max 100 characters), description (string, max 500 characters), icon_name (string, max 50 characters), created_at (timestamp), updated_at (timestamp)
2. THE Backend_Service SHALL provide a user_domains junction table with fields: user_id (foreign key), domain_id (foreign key), selected_at (timestamp), and a composite primary key on (user_id, domain_id)
3. THE Backend_Service SHALL provide a subjects table with fields: subject_id (primary key), domain_id (foreign key), name (string, max 100 characters), description (string, max 500 characters), created_at (timestamp), updated_at (timestamp)
4. THE Backend_Service SHALL provide a user_subjects junction table with fields: user_id (foreign key), subject_id (foreign key), enabled_at (timestamp), and a composite primary key on (user_id, subject_id)
5. THE Backend_Service SHALL create indexes on domain_id and subject_id columns in all junction tables and on the domain_id column in the subjects table
6. THE Backend_Service SHALL enforce referential integrity using database foreign key constraints with CASCADE delete behavior for junction table associations and RESTRICT delete behavior for domains and subjects referenced by content
7. THE Backend_Service SHALL execute queries filtering user content by domains and subjects within 500ms for result sets up to 1000 records
8. WHEN a domain or subject is created, THE Backend_Service SHALL validate that name fields contain 1 to 100 characters and reject entries outside this range with a validation error message indicating the constraint violation
9. IF a domain deletion is attempted while content references that domain exist, THEN THE Backend_Service SHALL reject the deletion operation and return an error message indicating referenced content must be reassigned or deleted first
10. THE Backend_Service SHALL enforce a maximum of 50 subjects per domain and reject subject creation attempts exceeding this limit with an error message indicating the maximum has been reached

### Requirement 14: Content Tagging and Filtering

**User Story:** As a user, I want all my learning content properly tagged with domain and subject information, so that I can organize and filter my materials effectively.

#### Acceptance Criteria

1. THE Platform SHALL tag all quizzes with associated domain and subject at creation time
2. THE Platform SHALL tag all summaries with associated domain and subject at creation time
3. THE Platform SHALL tag all tasks with optional domain and subject associations
4. THE Backend_Service SHALL store tags in normalized database tables
5. THE Platform SHALL support filtering content by multiple tags simultaneously
6. THE Platform SHALL display tags visually on content cards using color-coded badges
7. THE Platform SHALL provide tag-based search and filtering across all content types

### Requirement 15: Subscription Tier Enforcement

**User Story:** As a platform operator, I want automatic enforcement of subscription tier limits, so that users receive appropriate access based on their subscription level.

#### Acceptance Criteria

1. WHEN a Free tier user attempts to add a second domain, THE Platform SHALL display an upgrade prompt and prevent the action
2. WHEN a Free tier user attempts to generate the sixth quiz in a billing period, THE Platform SHALL display an upgrade prompt and prevent generation
3. WHEN a Pro tier user attempts to add a fourth domain, THE Platform SHALL display an upgrade prompt and prevent the action
4. THE Platform SHALL display usage progress bars in the Settings_Panel showing consumption against tier limits
5. THE Platform SHALL check tier limits before executing restricted actions
6. THE Platform SHALL provide clear messaging explaining tier limitations when limits are reached
7. THE Backend_Service SHALL track and reset usage counters at the start of each billing period

### Requirement 16: Backwards Compatibility

**User Story:** As an existing user of the medical-focused platform, I want to continue using all current features without disruption, so that the upgrade doesn't break my workflow.

#### Acceptance Criteria

1. WHEN the Platform migrates existing users, THE migration process SHALL complete within 24 hours of deployment and automatically assign the Medical domain to all existing users
2. THE Platform SHALL preserve all existing tasks, quizzes, summaries, and study plans during the migration by maintaining original identifiers and relationships intact
3. THE Platform SHALL maintain existing API endpoints with backwards-compatible behavior by supporting legacy request formats and response structures
4. WHEN tagging existing content during migration, THE Platform SHALL assign Medical domain and determine subject based on existing topic fields or default to "General Medicine" if no topic is specified
5. THE Platform SHALL preserve existing user authentication and profile data including email addresses, hashed passwords, profile information, and session tokens
6. THE Platform SHALL maintain existing spaced repetition schedules by preserving due dates, interval values, ease factors, and review history
7. THE Platform SHALL maintain analytics data including historical study time, quiz scores, completion rates, and learning streaks
8. IF the migration encounters data inconsistencies, THEN THE Platform SHALL log detailed error messages including record identifiers and inconsistency type, reattempt migration for that record up to 3 times with 5-second delays, and if all retries fail, mark the record for manual review while proceeding with other migrations
9. IF a record cannot be migrated after retries, THEN THE Platform SHALL notify administrators via email with error details and provide the user read-only access to their unmigrated content with a notice that full functionality will be restored after manual review
10. WHEN a user logs in post-migration, THE Platform SHALL verify session continuity by validating existing session tokens without requiring re-authentication

### Requirement 17: Responsive Design Across Devices

**User Story:** As a user on mobile, tablet, or desktop, I want the multi-domain features to work seamlessly across all device sizes, so that I can access the platform from any device.

#### Acceptance Criteria

1. THE Platform SHALL render the Settings_Panel appropriately for mobile (320px), tablet (768px), and desktop (1024px+) viewports
2. THE Navigation_System SHALL adapt to mobile viewports using a collapsible menu
3. THE subscription page SHALL display Pricing_Tier cards in a responsive grid that stacks on mobile
4. THE domain and subject filters SHALL be accessible via a filter drawer on mobile viewports
5. THE Platform SHALL maintain touch-friendly interactive targets (minimum 44x44px) on mobile devices
6. THE Platform SHALL ensure all text remains readable across viewport sizes without horizontal scrolling
7. THE Platform SHALL test responsive behavior on iOS Safari, Chrome Mobile, and major tablet browsers

### Requirement 18: Performance Optimization

**User Story:** As a user, I want the platform to load quickly and respond instantly to my interactions, so that my learning experience is smooth and uninterrupted.

#### Acceptance Criteria

1. THE Platform SHALL achieve a Lighthouse performance score of 90+ on desktop
2. THE Platform SHALL load the Dashboard within 3 seconds on 4G mobile connections
3. THE Platform SHALL implement code splitting for domain-specific components
4. THE Platform SHALL lazy-load images and non-critical assets
5. THE Platform SHALL cache User_Preferences in memory to avoid repeated database queries
6. THE Platform SHALL implement optimistic UI updates for preference changes with rollback on failure
7. THE Platform SHALL minimize bundle size for initial page load to under 200KB (gzipped)

### Requirement 19: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when actions succeed or fail, so that I always understand the system state and what went wrong.

#### Acceptance Criteria

1. WHEN a user action (domain selection, subject toggle, preference save, quiz generation, summary creation, subscription change, or filter application) succeeds, THE Platform SHALL display a success toast notification for 4 seconds
2. WHEN a user action (domain selection, subject toggle, preference save, quiz generation, summary creation, subscription change, or filter application) fails, THE Platform SHALL display an error notification containing the error type and next action to take
3. IF the Backend_Service returns HTTP 5xx status codes or fails to respond within 10 seconds, THEN THE Platform SHALL display a connection error message with a retry button
4. IF the user clicks retry after a connection error, THEN THE Platform SHALL reattempt the failed operation up to 2 additional times with 2-second delays between attempts
5. WHEN the Content_Generator fails, THE Platform SHALL display an error notification indicating whether the failure was due to invalid input, rate limiting, or service unavailability
6. WHEN a user inputs data into a form field, THE Platform SHALL validate the input on blur event and display validation error messages inline below the field within 200ms
7. IF validation errors exist when the user submits a form, THEN THE Platform SHALL prevent submission and display all validation errors inline below their respective fields
8. WHEN a client-side error with severity level "error" or "fatal" occurs, THE Platform SHALL log the error with stack trace, user context, and timestamp to the error tracking service
9. IF initial data loading fails for a page or component, THEN THE Platform SHALL display a fallback UI containing an error message describing the failure and a retry button

### Requirement 20: Analytics and Domain Usage Tracking

**User Story:** As a user, I want to see my learning progress broken down by domain and subject, so that I can identify areas needing more focus.

#### Acceptance Criteria

1. THE Platform SHALL track study time per domain and subject with precision to the nearest second
2. THE Platform SHALL track quiz performance per domain and subject as percentage score (0-100%), correct answer count, and incorrect answer count
3. THE Dashboard SHALL display domain-specific performance metrics in visual charts including bar charts, line charts, or pie charts
4. THE Analytics page SHALL provide filterable views of progress by domain and subject with filters for date range (last 7 days, last 30 days, last 90 days, all time), domain selection, and subject selection
5. THE Platform SHALL calculate weak areas as domains and subjects where the average quiz performance is below 60% accuracy over the selected time period
6. THE Platform SHALL track domain usage patterns including time spent per domain, quizzes completed per domain, and summaries viewed per domain for personalized recommendations
7. THE Backend_Service SHALL aggregate analytics data efficiently using database views or materialized queries
8. IF analytics data is incomplete or unavailable for a domain or subject, THEN THE Platform SHALL display "No data available" for that domain or subject instead of incorrect or misleading metrics
9. THE Platform SHALL update analytics displays within 2 seconds after new quiz completion or study session ends

