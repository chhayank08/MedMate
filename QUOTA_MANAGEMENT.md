# AI Model Quota Management & Rollover System

## Overview

MedMate uses a comprehensive quota-aware AI routing system that prevents repeated failures from exhausted models and provides seamless fallback across multiple free-tier AI providers.

## Key Features

### 1. Daily Quota Reset Awareness
- **Gemini free-tier quotas reset at midnight Pacific Time** (PT)
- System automatically tracks reset times and re-enables models after daily reset
- No manual intervention needed for quota recovery

### 2. Task-Specific Model Pools
Different AI tasks use separate model pools to prevent quota exhaustion in one area from blocking others:

- **Vision tasks** (OCR, image parsing): Only vision-capable models (gemini-2.5-flash, gemini-3.5-flash)
- **Generation tasks** (summaries, quizzes, plans): Prioritize high-quota models (gemini-3.1-flash-lite: 500 RPD, gemini-2.0-flash-lite: 1500 RPD)
- **Reasoning tasks** (medical reasoning, coach): Use primary quality models
- **Embedding tasks**: Dedicated embedding models

### 3. Intelligent Model Rotation
When a model hits quota limits:
1. **Immediate rotation** to next available model in the pool
2. **Task-specific tracking** prevents exhausted parsing models from blocking generation
3. **Exponential backoff** with shorter cooldowns for faster recovery
4. **Automatic fallback** to OpenRouter free models when all Gemini models exhausted

### 4. Comprehensive Observability
Integrated with:
- **Langfuse**: Tracks quota events, model rotations, and completion traces
- **LangSmith**: Optional secondary tracing backend
- **Helicone**: Request-level monitoring (via headers)
- **Arize Phoenix**: Performance analytics

Events tracked:
- Model quota exhaustion (with reason and cooldown time)
- Model rotation (from/to model with reason)
- Successful completions (model, tokens, latency)
- Daily quota resets

## Architecture

### Core Components

#### 1. Quota Tracker (`src/lib/ai/quota-tracker.ts`)
- Tracks exhausted models per task with expiration times
- Automatically clears models after cooldown or daily reset
- Periodic cleanup of expired cooldowns (every minute)

#### 2. Model Pools (`src/lib/ai/model-pools.ts`)
- Defines task categories and model capabilities
- Maps tasks to appropriate model pools
- Provides model metadata for observability

#### 3. AI Router (`src/lib/ai/router.ts`)
- Main entry point for all AI requests
- Resolves candidates based on task type
- Filters out exhausted models
- Handles retries and fallbacks
- Traces events to observability platforms

#### 4. Vision Router (`src/lib/ai/vision-router.ts`)
- Dedicated router for image/OCR tasks
- Separate quota tracking from generation tasks
- Prevents vision exhaustion from blocking summaries

### Model Priority Order

#### Generation Tasks (summary, quiz, flashcards, plan)
```
1. gemini-3.1-flash-lite   (500 RPD, 15 RPM)  ← Highest quota
2. gemini-2.0-flash-lite   (1500 RPD, 10 RPM) ← Best reliability
3. gemini-2.5-flash        (20 RPD, 5 RPM)
4. gemini-3.5-flash        (20 RPD, 5 RPM)
5. gemini-2.5-flash-lite   (20 RPD, 10 RPM)
→ OpenRouter free models (gpt-oss-120b, llama-3.3-70b, etc.)
```

#### Vision Tasks (OCR, image parsing)
```
1. gemini-2.5-flash        (Vision + 20 RPD)
2. gemini-3.5-flash        (Vision + 20 RPD)
→ No OpenRouter fallback (most free models lack vision)
```

## Quota Types & Cooldowns

### Rate Limit (RPM/TPM temporarily exceeded)
- **Cooldown**: 1.5 minutes base, exponential backoff up to 30 minutes
- **Recovery**: Automatic after cooldown expires
- **Action**: Rotate to next model immediately

### Quota (RPD daily limit exhausted)
- **Cooldown**: Until midnight Pacific Time (next reset)
- **Recovery**: Automatic at daily reset
- **Action**: Rotate to high-quota fallback models

### Credit (Payment/billing issue)
- **Cooldown**: 10 minutes base
- **Recovery**: May require manual intervention
- **Action**: Surface error to user (never silently retry)

## Usage Examples

### Standard Generation (Summaries, Quizzes)
```typescript
import { aiRouter } from "@/lib/ai/router";

const result = await aiRouter.run({
  task: "summary",  // Uses generation pool
  messages: [{ role: "user", content: "Summarize..." }],
  temperature: 0.5,
  log: { supabase, userId },
  signal: abortController.signal,
});
```

### Image Parsing
```typescript
import { extractImageText } from "@/lib/ai/vision-router";

const { text, model } = await extractImageText(
  imageBytes,
  "image/jpeg",
  signal
);
// Uses vision pool, separate from generation quota
```

### Structured Output (Quiz, Plan)
```typescript
const { data, result } = await aiRouter.runObject(
  {
    task: "quiz",
    messages: [{ role: "user", content: "..." }],
    log: { supabase, userId },
  },
  quizSchema  // Zod schema
);
```

## Error Handling

### User-Facing Errors
- **503 All models exhausted**: "All AI models are temporarily exhausted. Please wait a few minutes and try again."
- **429 Rate limited**: Automatically rotates to next model (user never sees this)
- **402 Credit/quota**: "AI service quota reached. Please wait a few minutes before retrying."

### Automatic Recovery
- Retries with exponential backoff (up to 2 retries)
- Rotates through all available models
- Falls back to OpenRouter free tier
- Surfaces only non-recoverable errors to user

## Observability Dashboard

### Langfuse Traces
View real-time:
- Which model handled each request
- Quota exhaustion events with reasons
- Model rotation paths
- Token usage and costs
- Latency per model

### Console Logs
```
[AI Router] 🎯 Resolved 5 candidates for "summary" (generation): gemini/gemini-3.1-flash-lite, gemini/gemini-2.0-flash-lite, ...
[AI Router] Attempting gemini/gemini-3.1-flash-lite for task "summary"
[AI Router] ✅ Success with gemini/gemini-3.1-flash-lite
```

```
[AI Router] ❌ Failed with gemini/gemini-2.5-flash: rate_limit (429)
[Quota Tracker] 🚫 gemini/gemini-2.5-flash/summary exhausted (rate_limit: RPM exceeded), cooldown: 90s, attempt: 1
[AI Router] ⚠️  gemini-2.5-flash rate_limit for task "summary", rotating to next candidate...
```

```
[Quota Tracker] 🌅 Daily reset: 3 models re-enabled
[Quota Tracker] ✅ gemini/gemini-2.5-flash daily quota reset, re-enabling
```

## Configuration

### Environment Variables
```bash
# Required for Gemini models
GEMINI_API_KEY=your_gemini_key

# Optional OpenRouter fallback
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-oss-120b:free  # Override default

# Observability (optional)
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGSMITH_API_KEY=ls__...
```

### Customizing Model Pools
Edit `src/lib/ai/model-pools.ts`:
```typescript
// Add new model to generation pool
const GEMINI_MODELS = {
  "gemini-new-model": {
    vision: false,
    rpd: 100,
    rpm: 10,
    priority: 2,
    description: "New high-quota model"
  },
  ...
};
```

## Monitoring & Alerts

### Key Metrics to Track
1. **Model success rate** (per model, per task)
2. **Quota exhaustion frequency** (should be rare after optimizations)
3. **Average fallback depth** (how many models tried before success)
4. **Daily reset effectiveness** (models successfully re-enabled)
5. **OpenRouter fallback usage** (should be < 5% of requests)

### Health Indicators
✅ **Healthy**: Most requests succeed on first or second candidate
⚠️ **Warning**: Frequently exhausting primary models (>20% of requests)
🚨 **Critical**: All models exhausted, users seeing errors

## Troubleshooting

### Issue: Summaries failing with 500/429 errors
**Cause**: Primary generation models exhausted
**Solution**: System automatically rotates to high-quota fallbacks (gemini-3.1-flash-lite, gemini-2.0-flash-lite)

### Issue: Image parsing not working
**Cause**: Vision models exhausted separately from generation
**Solution**: Wait for vision model cooldown or use different file type (PDF/DOCX parsing doesn't use vision)

### Issue: Repeated quota exhaustion
**Cause**: High request volume exceeding free-tier limits
**Solution**: 
1. System prioritizes high-quota models (500-1500 RPD)
2. Spreads load across multiple models
3. Falls back to OpenRouter when needed
4. Consider upgrading to paid tier for higher limits

### Manual Override
```typescript
import { clearExhaustion, clearProvider } from "@/lib/ai/quota-tracker";

// Clear specific model
clearExhaustion("gemini", "gemini-2.5-flash", "summary");

// Clear all models for a provider
clearProvider("gemini");
```

## Best Practices

1. **Use appropriate task types** for proper model pool selection
2. **Always pass abort signals** for user-cancellable operations
3. **Log usage** to track costs and quota consumption
4. **Monitor observability dashboards** for quota patterns
5. **Test quota exhaustion scenarios** in development
6. **Spread load** across different times of day when possible

## Future Enhancements

- [ ] Redis-backed quota tracker for multi-instance deployments
- [ ] Per-user quota limits and tracking
- [ ] Automatic paid-tier model upgrade when free exhausted
- [ ] Predictive model selection based on historical success rates
- [ ] Cost optimization through model performance analysis
