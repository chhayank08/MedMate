# Zustand Infinite Render Loop & Premium UI Hydration Fixes - FINAL PASS

## Critical Root Cause Fixed

**React 19's `useSyncExternalStore` requires:**
- Selectors return stable primitives ONLY
- No array/object derivation inside selectors
- Derivation must happen in React's memoization layer

---

## Fixed Issues

### 1. ✅ Zustand Selector Infinite Loop in `useActiveDomains` (FINAL FIX)

**Problem:** Even with `shallow`, `domains.filter()` created new arrays every render.

**Root Cause:**
```ts
// ❌ BAD: Creates new array in selector
useGlobalSettings(
  state => state.domains.filter(...),
  shallow
)
```

**Final Fix Applied:**
- Moved array filtering OUTSIDE selector
- Split into primitive selectors only
- Use React `useMemo` for derivation
- Created stable helper function

```ts
// ✅ GOOD: Primitives only in selectors
const DEFAULT_DOMAIN_ARRAY = Object.freeze([DEFAULT_DOMAIN]);

function getActiveDomains(
  domains: Domain[],
  selectedDomainIds: string[]
): Domain[] {
  if (!selectedDomainIds.length || !domains.length) {
    return DEFAULT_DOMAIN_ARRAY;
  }
  const filtered = domains.filter(d => selectedDomainIds.includes(d.domain_id));
  return filtered.length ? filtered : DEFAULT_DOMAIN_ARRAY;
}

export function useActiveDomains() {
  const domains = useGlobalSettings(state => state.domains);
  const selectedDomainIds = useGlobalSettings(state => state.selectedDomainIds);
  
  return useMemo(() => {
    return getActiveDomains(domains, selectedDomainIds);
  }, [domains, selectedDomainIds]);
}
```

**Files Changed:**
- `src/lib/stores/global-settings-store.ts`

---

### 2. ✅ `useDomainContext()` Unstable Dependencies

**Problem:** `useMemo` depended on entire `activeDomain` object, causing infinite recomputations.

**Root Cause:**
```ts
// ❌ BAD: Object reference changes every render
useMemo(() => ..., [activeDomain])
```

**Fix Applied:**
- Extract only primitive values (`activeDomainId`, `activeDomainName`)
- Wrap callbacks in `useCallback`
- Use primitive dependencies in memoization

```ts
// ✅ GOOD: Primitive dependencies
const activeDomainId = activeDomain?.domain_id;
const activeDomainName = activeDomain?.name;

const domainConfig = useMemo(() => {
  if (!activeDomainId || !activeDomainName) return null;
  const domainKey = activeDomainName.toLowerCase().replace(/\s+/g, '_') as DomainKey;
  return getDomainConfig(domainKey);
}, [activeDomainId, activeDomainName]);

const switchDomain = useCallback(async (domainId: string) => {
  await selectDomains([domainId]);
}, [selectDomains]);
```

**Files Changed:**
- `src/hooks/use-domain-context.ts`

---

### 3. ✅ Premium UI Not Updating (FINAL FIX)

**Problem:** Subscription page stuck loading even after successful hydration.

**Root Cause:**
- Mixed hydration state with data validation
- Single `if (!subscription)` check trapped both states

**Fix Applied:**
- Split hydration loading from missing data states
- Check `isInitialized` separately from `subscription`
- Split object selectors into primitives

```ts
// ✅ GOOD: Separate primitive selectors
export function useSubscriptionReady() {
  const subscription = useSubscriptionStore(state => state.subscription);
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const isLoading = useSubscriptionStore(state => state.isLoading);

  return useMemo(() => ({
    subscription,
    isInitialized,
    isLoading,
  }), [subscription, isInitialized, isLoading]);
}

// In component:
if (!isMounted || !subInitialized || !premiumInitialized) {
  return <Loader />; // Hydration loading
}

if (!subscription) {
  return <ErrorState />; // Missing data after hydration
}
```

**Files Changed:**
- `src/hooks/use-subscription.ts` (added `useSubscriptionReady`)
- `src/lib/stores/subscription-store.ts` (improved hydration logic)
- `src/components/subscription/subscription-plans.tsx` (fixed loading gates)

---

### 4. ✅ Router.refresh() Triggering Client Rerenders

**Problem:** `router.refresh()` called on domain change caused unnecessary server component refreshes, triggering client component rerenders.

**Root Cause:**
```ts
// ❌ BAD: Triggers full route refresh
router.refresh();
```

**Fix Applied:**
- Removed `router.refresh()` from domain selection
- Zustand reactivity handles client updates automatically
- CustomEvent broadcasts handle cross-component updates

```ts
// ✅ GOOD: Client-side reactivity only
window.dispatchEvent(new CustomEvent('global-domain-updated', { 
  detail: { domainIds: newSelection } 
}));
// No router.refresh() needed
```

**Files Changed:**
- `src/components/dashboard/header-domain-switcher.tsx`

---

### 5. ✅ useDomains Hook Inline Fallbacks

**Problem:** `|| []` fallbacks created new arrays every render.

**Fix Applied:**
- Created stable `EMPTY_DOMAINS` constant
- Wrapped returns in `useMemo`

```ts
// ✅ GOOD: Stable constants
const EMPTY_DOMAINS: Domain[] = Object.freeze([]);

const predefinedDomains = useMemo(
  () => data?.predefined ?? EMPTY_DOMAINS,
  [data?.predefined]
);
```

**Files Changed:**
- `src/hooks/use-domains.ts`

**Problem:** Components rendered before domain context was ready, accessing undefined config.

**Fix Applied:**
- Added early return guards checking `isReady`, `activeDomain`, and `domainConfig`
- Display loader until all data is available
- Prevent accessing `domainConfig.placeholders` before hydration

```ts
// ✅ GOOD: Hydration guard
if (!isReady || !activeDomain || !domainConfig) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading quiz generator...</p>
      </CardContent>
    </Card>
  );
}

// Now safe to access
const placeholders = domainConfig.placeholders;
```

**Files Changed:**
- `src/components/quizzes/quiz-generator.tsx`
- `src/components/summaries/summary-generator.tsx`

---

## Summary of Final Changes

### React 19 + Zustand Stability Rules

**NEVER do this in selectors:**
```ts
// ❌ Creates new reference every time
useStore(state => state.array.filter(...))
useStore(state => state.array.map(...))
useStore(state => ({ a: state.a, b: state.b }))
useStore(state => [state.a, state.b])
useStore(state => state.array || [])
```

**ALWAYS do this instead:**
```ts
// ✅ Primitives only in selectors
const array = useStore(state => state.array);
const derived = useMemo(() => array.filter(...), [array]);

const a = useStore(state => state.a);
const b = useStore(state => state.b);
const obj = useMemo(() => ({ a, b }), [a, b]);
```

### Key Patterns Applied

1. **Object.freeze() for Constants**
   ```ts
   const EMPTY_ARRAY = Object.freeze([]);
   const DEFAULT_CONFIG = Object.freeze({ ... });
   ```

2. **Split Selectors into Primitives**
   ```ts
   // ❌ BAD
   const { a, b } = useStore(s => ({ a: s.a, b: s.b }));
   
   // ✅ GOOD
   const a = useStore(s => s.a);
   const b = useStore(s => s.b);
   ```

3. **React useMemo for Derivation**
   ```ts
   const array = useStore(s => s.array);
   const filtered = useMemo(() => array.filter(...), [array]);
   ```

4. **Separate Hydration from Data Validation**
   ```ts
   // ✅ GOOD: Two separate checks
   if (!isInitialized) return <Loader />;
   if (!data) return <EmptyState />;
   
   // ❌ BAD: Mixed check
   if (!isInitialized || !data) return <Loader />;
   ```

5. **useCallback for Stable Functions**
   ```ts
   const handler = useCallback(() => {}, [deps]);
   ```

---

## Verification Checklist

Run these commands to verify fixes:

```bash
npm run build
npm run dev
```

### Expected Console State

✅ **No errors:**
- React Error #185
- Maximum update depth exceeded
- getSnapshot should be cached
- forceStoreRerender spam

✅ **Subscription works:**
- Premium UI visible instantly
- Lifetime badge/crown visible
- No "Loading subscription details..." lock
- Usage stats display correctly

✅ **Quizzes/Summaries work:**
- Pages load without crashes
- No ErrorBoundary loops
- Placeholders render correctly

✅ **Domains work:**
- Clicking selected domain deselects it (for premium)
- Domain switcher updates instantly
- No infinite rerenders in React DevTools

---

## React 19 Compatibility Notes

React 19 is stricter about:
1. **Referential stability** in `useSyncExternalStore`
2. **Snapshot consistency** between renders
3. **Effect dependency arrays** must be stable
4. **No inline object/array creation** in selectors

All fixes align with React 19's requirements for external store integration.
