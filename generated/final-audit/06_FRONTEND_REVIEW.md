# 06 FRONTEND REVIEW
**Date:** 2026-07-06  
**Auditor:** React Native / Expo Expert & UI/UX Reviewer

This report evaluates the frontend layer (React Native/Expo App), reviewing state persistence, background lifecycles, form validation, and screen layout responsiveness.

---

## 1. STATE & LIFE CYCLE HARDENING

### Polling Resume Cycle in MessageContext
- **File:** `context/MessageContext.jsx:70`
- **Behavior:** The AppState listener pause/resume cycle tracks whether the app is active:
  - Going to the background stops active polling intervals immediately to prevent resource drain.
  - Returning to the foreground checks the `isPolling` intent state. If the user was actively inside a chat session, it automatically resumes the polling loop.
- **Fix Verification:** Checked state retention. The user's active messaging state is persisted successfully during transitions.
- **Status:** **PASS**

### Duplicate Request Suppression
- **Behavior:** The `showArchived` trigger toggles filters and clears standard state counters. It cancels active polling interval routines before booting the new polling loop, ensuring requests do not overlap.
- **Status:** **PASS**

---

## 2. NAVIGATION STACK REGISTRATION

### Contact Screen Integration
- **File:** `app/admin/_layout.jsx`, `app/faculty/_layout.jsx`, `app/student/_layout.jsx`
- **Remediation:** Added `<Stack.Screen name="contact" options={{ title: 'Contact Directory' }} />` to all layouts.
- **Verification:** Navigating to the contact screen renders the correct navigation header style, title, back-navigation button, and allows smooth transition between the contacts list and messaging window.
- **Status:** **PASS**

---

## 3. UI / UX SMOKE CHECKS
- **Form Inputs:** Input forms use clean components with built-in validation messages (e.g. register number patterns, email formats).
- **Responsive Layouts:** Layout containers utilize Flexbox with dynamic spacing percentages to support multiple screen dimensions.
- **Keyboard Avoidance:** Input forms use `KeyboardAvoidingView` wrapping to prevent the soft keyboard from covering buttons and input fields on iOS/Android.
- **Loading & Skeleton States:** Search list displays clean placeholders or loader spinners during async fetches.
- **Empty States:** Renders clean icons and call-to-action text when lists (like notifications or inbox messages) are empty.
