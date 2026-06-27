# PrepBud - Universal AI-Powered Learning Ecosystem

## Overview

PrepBud is an intelligent study companion that transforms how students learn across any domain. Whether you're studying medicine, engineering, computer science, business, law, or any other field, PrepBud provides AI-powered quizzes, smart summaries, personalized study plans, and performance analytics.

## Platform Transformation

This platform has been transformed from a medical-only application into a **universal, multi-domain AI learning ecosystem** while preserving the excellent quiz generation workflow and clean UI structure.

### What Changed

#### 1. **Universal Branding**
- **Logo**: Changed from medical stethoscope to graduation cap with gradient styling
- **App Name**: PrepBud (universal study companion)
- **Tagline**: "Your AI-powered study companion" (not "medical study coach")
- **Colors**: Modern gradient from primary to chart-2 for a tech-forward feel

#### 2. **Multi-Domain Support**
The platform now intelligently supports:
- 🩺 **Medical** - Anatomy, Physiology, Pharmacology, Surgery, etc.
- ⚙️ **Engineering** - Mechanical, Electrical, Civil, Thermodynamics, etc.
- 💻 **Computer Science** - DSA, Operating Systems, Networks, ML, etc.
- 💼 **Business** - Accounting, Finance, Marketing, Strategy, etc.
- ⚖️ **Law** - Constitutional, Criminal, Contract, Corporate Law, etc.
- 🔬 **Science** - Physics, Chemistry, Biology, Mathematics, etc.

#### 3. **Dynamic Content Adaptation**
- Subject dropdowns automatically show domain-relevant subjects
- Placeholder text adapts to selected domain
- Quiz topics and examples change based on context
- Academic profile supports any degree program

#### 4. **Universal Terminology**
All medical-specific language has been replaced:
- "Study snapshot" instead of "study snapshot for medicine"
- "Learning snapshot" instead of "medical dashboard"
- "Institution" instead of "medical college"
- "Program" instead of "MBBS/medical degree"

#### 5. **Enhanced Landing Page**
- Hero section showcases multi-domain capability
- Domain icons showing Medical, Engineering, CS, Business, Law, Science
- Universal value propositions
- Modern SaaS aesthetic

#### 6. **Premium Subscription System**
Three tiers designed for universal learning:

**Free Plan** - $0/month
- 1 learning domain
- 3 subjects
- 5 quizzes/month
- 5 summaries/month
- Basic features

**Pro Plan** - $9.99/month
- 3 learning domains
- Unlimited subjects
- 50 quizzes/month
- 50 summaries/month
- Advanced features

**Lifetime Plan** - $199 (one-time)
- 10 learning domains
- Unlimited subjects
- 500 quizzes/month
- 500 summaries/month
- All premium features forever

### What Stayed the Same

✅ **AI Quiz Generator** - Exact same workflow and UI (excellent as-is)
✅ **AI Summary Generator** - Same structure and functionality
✅ **Task Management** - Same clean interface
✅ **Study Planner** - Same spaced repetition system
✅ **Analytics Dashboard** - Same charts and insights
✅ **Navigation Structure** - Same sidebar and topbar layout
✅ **Component Architecture** - Same design system and patterns

## Key Features

### 🧠 AI Quiz Generator
- Generate quizzes from subjects, pasted notes, or uploaded files
- Multiple question types: MCQ, True/False, Short Answer
- Difficulty levels: Easy, Medium, Hard
- Timed mode with customizable durations
- Domain-adaptive subject suggestions

### 📝 AI Summary Generator
- 10+ summary types: Quick, Revision, Cheat Sheet, Flashcards, etc.
- Transform any study material into structured notes
- Domain-specific formatting and examples

### ✅ Smart Task Management
- Create tasks with priorities and due dates
- Recurring revisions with customizable schedules
- Browser notifications
- Calendar and list views

### 📅 Study Planner
- Generate day-by-day study plans
- Spaced repetition with SM-2 algorithm
- Interleaving and catch-up days
- Exam countdown tracking

### 📊 Performance Analytics
- Quiz accuracy over time
- Study hours tracking
- Weak subject identification
- Progress insights

### 🎯 Personalization
- Select your learning domains
- Customize subjects and topics
- Set academic profile (institution, degree, year)
- Theme customization (light/dark)

## Technical Architecture

### Domain System
```typescript
// lib/domain-config.ts
- DOMAIN_CONFIGS: Configuration for each learning domain
- getActiveDomain(): Get user's current domain
- setActiveDomain(): Switch domains
- getDomainSubjects(): Get subjects for a domain
```

### Subject Management
```typescript
// lib/constants.ts
- DOMAIN_SUBJECTS: Subject arrays for each domain
- Dynamically loaded based on active domain
- Custom subjects stored in localStorage
```

### Adaptive Components
- Subject combobox reads from active domain
- Quiz generator shows domain-relevant placeholders
- Dashboard adapts terminology and examples
- Academic profile supports any degree program

## Usage

### For Students

1. **Sign Up** - Create your account at `/signup`
2. **Onboarding** - Select your primary learning domain
3. **Academic Profile** - Add institution, degree, and year (optional)
4. **Generate Quizzes** - Use AI to create practice questions
5. **Create Summaries** - Transform notes into study materials
6. **Track Progress** - Monitor performance in analytics
7. **Upgrade** - Unlock more domains and features with Pro/Lifetime

### For Developers

#### Adding a New Domain
```typescript
// 1. Add to lib/constants.ts
export const DOMAIN_SUBJECTS = {
  // ...existing domains
  psychology: [
    "Cognitive Psychology",
    "Social Psychology",
    "Developmental Psychology",
    // ...
  ],
} as const;

// 2. Add to lib/domain-config.ts
export const DOMAIN_CONFIGS = {
  // ...existing configs
  psychology: {
    id: "psychology",
    name: "Psychology",
    icon: "🧠",
    color: "text-purple-500",
    placeholders: {
      quizTopic: "Cognitive biases, Pavlov's conditioning",
      summaryTopic: "Behavioral theories",
      taskExample: "Review research methodology",
    },
  },
};
```

#### Customizing UI for Domain
Components automatically adapt based on active domain. Use:
```typescript
import { getDomainConfig } from "@/lib/domain-config";

const config = getDomainConfig();
// Use config.placeholders, config.icon, config.color
```

## File Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup, password reset
│   ├── (dashboard)/     # Main application routes
│   ├── onboarding/      # First-time user setup
│   └── page.tsx         # Landing page
├── components/
│   ├── dashboard/       # Dashboard-specific components
│   ├── quizzes/         # Quiz generation and display
│   ├── summaries/       # Summary generation
│   ├── subscription/    # Pricing and plans
│   ├── settings/        # User preferences
│   └── shared/          # Reusable components
├── lib/
│   ├── constants.ts     # App-wide constants and domain subjects
│   ├── domain-config.ts # Domain configuration system
│   ├── nav.ts          # Navigation items
│   └── ...
└── types/
    ├── domain.types.ts  # Domain and subject types
    └── ...
```

## Design Philosophy

### Universal Yet Focused
- The platform feels universal and scalable
- Each user experiences it as personalized to their domain
- No medical-specific bias in UI or terminology
- Clean, modern SaaS aesthetic

### Consistent Experience
- Same navigation across all domains
- Same quiz workflow regardless of subject
- Same dashboard structure with adaptive content
- Familiar patterns from Notion, Linear, Duolingo

### Future-Proof Architecture
- Easy to add new domains
- Subjects can be customized per user
- Domain-specific features can be added without breaking existing flows
- Subscription tiers scale with usage

## Migration Notes

### Backward Compatibility
- Existing medical users automatically assigned "medical" domain
- Old localStorage keys maintained
- Database schema supports all domains
- No breaking changes to existing workflows

### Data Preservation
- All existing quizzes, summaries, and tasks preserved
- User profiles maintained
- Subscription status carried forward
- Analytics history intact

## Future Enhancements

### Planned Features
- [ ] Domain-specific AI models
- [ ] Cross-domain learning paths
- [ ] Collaborative study rooms
- [ ] Import from textbooks/PDFs with OCR
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] Custom domain creation for institutions

### Community Domains
Future support for:
- Languages (Spanish, French, Mandarin)
- Arts (Music Theory, Art History)
- Professional Certifications (PMP, CFA, CPA)
- High School subjects
- Test Prep (SAT, GRE, MCAT, LSAT)

## Contributing

When adding features, ensure:
1. Components remain domain-agnostic
2. Terminology is universal
3. UI adapts to active domain
4. Examples span multiple domains
5. Documentation is updated

## License

Proprietary - All rights reserved

## Support

- Documentation: [docs.prepbud.com](https://docs.prepbud.com)
- Email: support@prepbud.com
- Discord: [discord.gg/prepbud](https://discord.gg/prepbud)

---

**PrepBud** - Master any subject with AI-powered learning 🎓
