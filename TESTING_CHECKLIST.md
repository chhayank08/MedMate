# Testing Checklist - Quota Management & Model Rollover

## Pre-Deployment Checks

- [x] ✅ TypeScript compilation successful
- [x] ✅ All files created and modified
- [x] ✅ No syntax errors
- [x] ✅ Documentation complete

## Post-Deployment Testing

### 1. Basic Functionality Tests

#### Summary Generation
- [ ] Navigate to Summaries page
- [ ] Generate a "Quick Summary" (paste mode)
- [ ] Verify: Summary completes without truncation
- [ ] Verify: Console shows model selection (e.g., `gemini-3.1-flash-lite`)
- [ ] Generate an "Exam Cheat Sheet" (paste mode, longer content)
- [ ] Verify: Cheat sheet completes without mid-sentence cutoff
- [ ] Verify: Full content visible (check for biochemistry-style completeness)

#### Quiz Generation  
- [ ] Navigate to Quizzes → New Quiz
- [ ] Generate 10 MCQ questions
- [ ] Verify: Quiz generates successfully
- [ ] Verify: All 10 questions present with explanations
- [ ] Check console logs for model used

#### Image Upload / OCR
- [ ] Navigate to Summaries → New Summary
- [ ] Upload an image (PNG/JPG with text)
- [ ] Verify: Text extraction works
- [ ] Verify: Console shows vision router selection
- [ ] Verify: Different model pool used (e.g., `gemini-2.5-flash`)

#### Flashcards
- [ ] Generate flashcards from sample content
- [ ] Verify: Cards render correctly
- [ ] Verify: Front/back content complete

### 2. Model Rotation Tests

#### Simulate Rate Limit (Manual)
**Note**: This requires temporarily exhausting a model's quota.

- [ ] Monitor console for quota exhaustion logs
- [ ] Expected log pattern:
  ```
  [AI Router] ❌ Failed with gemini/gemini-X: rate_limit (429)
  [Quota Tracker] 🚫 gemini/gemini-X/summary exhausted (rate_limit)
  [AI Router] ⚠️  gemini-X rate_limit for task "summary", rotating...
  [AI Router] Attempting gemini/gemini-Y for task "summary"
  [AI Router] ✅ Success with gemini/gemini-Y
  ```
- [ ] Verify: Request succeeds on fallback model
- [ ] Verify: User never sees 429 error

#### Daily Reset Verification
**Note**: Requires waiting until midnight Pacific Time or adjusting system time in dev.

- [ ] Check console at midnight PT (~3am ET, 12am PT)
- [ ] Expected log:
  ```
  [Quota Tracker] 🌅 Daily reset: N models re-enabled
  [Quota Tracker] ✅ gemini/gemini-X daily quota reset, re-enabling
  ```
- [ ] Verify: Previously exhausted models become available again

### 3. Task Isolation Tests

#### Vision vs Generation Isolation
- [ ] Upload multiple images rapidly (to exhaust vision models)
- [ ] While vision is exhausted, generate a summary (text-based)
- [ ] Verify: Summary generation still works
- [ ] Verify: Console shows different model pools:
  ```
  [Vision Router] 🖼️  Attempting gemini/gemini-2.5-flash
  [AI Router] 🎯 Resolved ... for "summary" (generation): gemini/gemini-3.1-flash-lite
  ```
- [ ] Confirm: Vision exhaustion does NOT block generation

### 4. Observability Verification

#### Console Logs
- [ ] Check browser console (client-side) for:
  - No unexpected errors
  - No quota failure messages reaching user
  - Smooth loading states

- [ ] Check server logs (terminal running `npm run dev`) for:
  ```
  [AI Router] 🎯 Resolved candidates for "X": ...
  [AI Router] ✅ Success with gemini/model-name
  [Quota Tracker] logs (if any exhaustion occurs)
  ```

#### Langfuse Dashboard (if configured)
- [ ] Navigate to Langfuse dashboard
- [ ] Check for completion traces with:
  - Model names
  - Token usage
  - Latency metrics
- [ ] Check for quota event traces (if any exhaustion occurred)
- [ ] Check for model rotation events

### 5. Error Handling Tests

#### Complete Exhaustion Scenario (Rare)
**Note**: Hard to test without exhausting all models. Monitor production.

- [ ] Expected user message if all models exhausted:
  > "All AI models are temporarily exhausted. Please wait a few minutes and try again."
- [ ] Verify: User sees friendly message (not raw 429/500)
- [ ] Verify: Retry button available

#### Network Failure
- [ ] Temporarily disconnect network mid-generation
- [ ] Verify: User sees appropriate error message
- [ ] Verify: App doesn't crash
- [ ] Reconnect and retry
- [ ] Verify: Generation resumes successfully

### 6. Performance Tests

#### Concurrent Requests
- [ ] Open multiple tabs
- [ ] Generate summaries simultaneously in all tabs
- [ ] Verify: All requests succeed (may use different models)
- [ ] Verify: No race conditions in quota tracking
- [ ] Check console for model distribution

#### Large Document Processing
- [ ] Generate summary from very large text (100K+ chars)
- [ ] Verify: Map-reduce pipeline kicks in (check console for "Reading section X of Y")
- [ ] Verify: Complete output without truncation
- [ ] Verify: Proper streaming behavior

### 7. Edge Cases

#### Empty/Invalid Input
- [ ] Try generating summary with empty text
- [ ] Verify: Appropriate validation error
- [ ] Try uploading corrupted image
- [ ] Verify: Graceful error handling

#### Special Characters
- [ ] Generate summary with medical symbols, equations
- [ ] Verify: Special characters render correctly
- [ ] Verify: No encoding issues

#### Very Long Sessions
- [ ] Leave app open for extended period (4+ hours)
- [ ] Periodically generate content
- [ ] Verify: Quota tracker cleanup works (check logs every hour for cleanup)
- [ ] Verify: No memory leaks

## Production Monitoring (First 24 Hours)

### Metrics to Watch
- [ ] **Model Success Rate**: Should be >90% on first candidate
- [ ] **Fallback Frequency**: Should be <10% of requests
- [ ] **OpenRouter Usage**: Should be <5% of total
- [ ] **Average Response Time**: Should be consistent
- [ ] **Error Rate**: Should be <1%

### Key Questions
- [ ] Are models rotating as expected?
- [ ] Is daily reset occurring at midnight PT?
- [ ] Are vision and generation pools isolated?
- [ ] Are users experiencing any disruptions?
- [ ] Are observability traces appearing correctly?

## Rollback Triggers

Rollback immediately if:
- ❌ Error rate exceeds 5%
- ❌ Users consistently see "exhausted" errors
- ❌ Models not rotating on quota exhaustion
- ❌ Daily reset not occurring
- ❌ TypeScript compilation errors in production
- ❌ App crashes or becomes unresponsive

## Success Criteria

✅ **Deploy is successful if**:
1. All basic functionality tests pass
2. Model rotation working (verified in logs)
3. No increase in user-facing errors
4. Observability traces appearing
5. Summary truncation issue resolved
6. No performance degradation

## Post-Deployment Actions

After confirming success:
- [ ] Document any observed rotation patterns
- [ ] Note which models are most frequently used
- [ ] Identify any unexpected behaviors for optimization
- [ ] Update monitoring alerts based on actual patterns
- [ ] Schedule follow-up check at midnight PT for reset verification

## Notes Section

Use this space to record observations during testing:

```
Date: ___________
Tester: ___________

Summary Generation:
- Model used: ___________
- Completion time: ___________
- Any issues: ___________

Image Upload:
- Model used: ___________
- Extraction quality: ___________
- Any issues: ___________

Quota Events:
- Any exhaustions: ___________
- Rotation successful: ___________
- Fallback model: ___________

Observations:
___________________________________________
___________________________________________
___________________________________________
```
