# Paywall & Onboarding Audit — Gita Pro

Scope: `app/onboarding/*.tsx`, `app/onboarding/paywall.tsx`, `src/components/PaywallPopup.tsx`, `src/context/AuthContext.tsx` (RevenueCat binding).

Severity: **Critical** (ship-blocking), **High** (ship-risky), **Medium** (launch-week), **Low** (polish).

---

## Critical

### C1. The web paywall bypasses payment entirely

`app/onboarding/paywall.tsx` — `handlePurchase()`:

```ts
if (packages.length === 0) {
  // Dev/web bypass — mark onboarding complete first
  await saveOnboardingStep('completedAt', new Date().toISOString());
  router.replace('/auth' as any);
  return;
}
```

On web, `Purchases.getOfferings()` throws because the RN Purchases SDK is native-only. `packages` stays empty, so tapping the Continue button skips the paywall and lets the user into the app for free. Any user on the web build gets Gita Pro with no payment.

**Fix:** on web, route the Continue button to a Stripe Checkout session (or a "Download the app to continue" state) — never to `/auth` without payment confirmation. Minimum acceptable ship-state: show a "Subscribe on mobile to continue" CTA with App Store / Play Store buttons, and do **not** call `saveOnboardingStep('completedAt', …)`.

### C2. `15-day trial` vs `14-day trial` copy drift

- `gita_master_manifest.md` → **15-day complimentary trial**
- `app/onboarding/paywall.tsx` → `TRIAL_DESCRIPTION = 'Includes 14-day free trial'`
- Store description / marketing must match whatever you configure in App Store Connect and Play Console.

**Fix:** pick one (likely 14 days, Apple default) and update manifest, paywall copy, onboarding copy, store listings, and RevenueCat offering.

### C3. Raw upstream error messages leaked in `Alert.alert`

```ts
Alert.alert('Purchase Error', e.message);
Alert.alert('Restore Error', e.message);
```

`e.message` from RevenueCat can contain internal SKU identifiers and store-specific detail. Users see technical jargon; worse, some internal IDs can help attackers trigger edge cases.

**Fix:** map known `PURCHASES_ERROR_CODE` values to friendly strings and send the raw message through `log.warn('paywall.purchase_error', …)`. Pattern:

```ts
} catch (e: any) {
  if (e.userCancelled) return;
  log.warn('paywall.purchase_error', { code: e.code, underlying: e.underlyingErrorMessage });
  Alert.alert(
    'Could not complete purchase',
    'Please check your payment method and try again.'
  );
}
```

---

## High

### H1. No entitlement re-check on app resume

`AuthContext.tsx` calls `Purchases.logIn(uid)` once on auth state change but never verifies the current entitlement on foregrounding. A user whose subscription lapses mid-session keeps unrestricted access until they restart.

**Fix:** in the `AppState` listener inside `app/_layout.tsx`, when app returns to `active`, call `Purchases.getCustomerInfo()` and gate premium screens on `customerInfo.entitlements.active['Gita Pro']`.

### H2. No rate limit on restore-purchase taps

A user holding the restore button can hit RevenueCat 100×/second. RevenueCat itself limits eventually, but the UI spams alerts.

**Fix:** disable the button while `isPurchasing`/`isRestoring` is true, and add a minimum 2s debounce.

### H3. `router.replace('/auth' as any)` after purchase is ambiguous

The paywall is shown as the last onboarding step before auth. Purchase → `/auth` is fine for a new user but also ends up there after `handleRestore()` succeeds. A returning user who already has an account is forced through sign-in instead of being recognized.

**Fix:** after `restorePurchases()` succeeds, check if `auth.currentUser` exists. If so, go to `(tabs)/index`. Only send to `/auth` if they are not signed in.

### H4. Google auth client ID hard-coded

`app/auth.tsx`:

```ts
clientId: '957696257946-uag2g20gi77kc514ua5n15re0j7u8jp4.apps.googleusercontent.com',
```

Not a secret per se, but should come from `env.FIREBASE_MESSAGING_SENDER_ID` + Google OAuth configuration for environment parity, and you need separate client IDs for iOS, Android, Web.

**Fix:** use `Google.useIdTokenAuthRequest({ iosClientId, androidClientId, webClientId })` all sourced from `EXPO_PUBLIC_` vars.

---

## Medium

### M1. Onboarding step count is inconsistent

`onboarding/` has 9 numbered steps plus `intro`, `dharma-focus`, and `paywall`. `_layout.tsx` hard-registers steps 1–9 but has no screen for `intro` or `dharma-focus`. Check `unstable_settings` or Stack entries to ensure both routes are reachable. Several step files are 200–480 lines each — consider a shared wrapper that renders step number + copy + CTA + progress bar to cut that by ~60%.

### M2. No `/terms` or `/privacy` links in paywall

App Store requires a visible link to your privacy policy and terms of service **on the paywall itself**. Currently the paywall has a `[showTerms, setShowTerms]` modal but the copy and links need to live at `https://gita-rouge-tau.vercel.app/privacy` and `/terms` as static pages.

**Fix:** write `app/privacy.tsx` and `app/terms.tsx`, link from the paywall footer.

### M3. No analytics on paywall funnel

Add these events via the new `log.action(...)`:

- `paywall.shown` — on mount (include `packageCount`, `selectedTier`)
- `paywall.tier_selected` — on tap (tier id)
- `paywall.purchase_started`
- `paywall.purchase_succeeded` — include `productId`, `priceString`
- `paywall.purchase_cancelled`
- `paywall.purchase_failed` — code
- `paywall.restore_started` / `paywall.restore_succeeded` / `paywall.restore_empty`

Without these you have no idea why conversion is where it is.

### M4. Free-trial legal strings

If a trial exists, Apple requires exact language: "14-day free trial, then $X/year". Play Console requires disclosing trial + automatic renewal terms near the CTA, not only in the modal.

**Fix:** show the full disclosure above the "Continue" button, not behind a toggle.

---

## Low

### L1. `FALLBACK_TIERS` prices are placeholder

`$99.99`, `$35.88`, `$4.99` — if the user ever sees these, they disagree with what the store will charge. On Apple/Play the RevenueCat SDK always returns real prices when offerings load, so this is only visible during the brief fetch window — but swap these to "—" with a skeleton loader instead.

### L2. No loading skeleton on paywall

`isFetching` true → bare ActivityIndicator. Swap in `<LoadingState label="Loading plans…" fullScreen />`.

### L3. `showTerms` modal duplicated

Terms text is inlined in `paywall.tsx`. Move to `src/constants/legal.ts` so web `/terms` and the mobile modal render the same content.

### L4. No haptic on tier tap

`expo-haptics` is already a dep; add `Haptics.selectionAsync()` on tier cards and CTA press for the "premium" feel.

---

## Action order

1. **Before submission**: C1, C2, C3, H1, M2, M4.
2. **Week 1 after submission**: H2, H3, H4, M3.
3. **Week 2**: M1, L1–L4.

