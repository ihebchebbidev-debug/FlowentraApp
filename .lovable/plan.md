
# Email Verification Plan

Add a full email verification flow for both `MainAdminUsers` (tenant owners) and `Users` (staff created by admin), reusing the existing backend email infrastructure (already used for password reset). Templates are localized (EN/FR) based on the user's language.

## 1. Database changes (Neon / PostgreSQL)

New migration `Backend/Neon/35_email_verification.sql`:

- `MainAdminUsers`
  - `EmailVerified BOOLEAN NOT NULL DEFAULT FALSE`
  - `EmailVerifiedAt TIMESTAMPTZ NULL`
- `Users`
  - `EmailVerified BOOLEAN NOT NULL DEFAULT FALSE`
  - `EmailVerifiedAt TIMESTAMPTZ NULL`
  - `FirstLoginAt TIMESTAMPTZ NULL` (used to trigger the "verify on first login" prompt)
- New table `EmailVerificationCodes`:
  - `Id SERIAL PK`
  - `UserId INT NOT NULL`
  - `UserType VARCHAR(20) NOT NULL` — `'MainAdmin' | 'User'`
  - `Email VARCHAR(255) NOT NULL` (snapshot in case email changes)
  - `CodeHash VARCHAR(255) NOT NULL` (SHA-256 + per-row salt; raw code never stored)
  - `Purpose VARCHAR(30) NOT NULL DEFAULT 'email_verify'` (future-proof: also `email_change`)
  - `Attempts INT NOT NULL DEFAULT 0`
  - `MaxAttempts INT NOT NULL DEFAULT 5`
  - `ExpiresAt TIMESTAMPTZ NOT NULL` (10 minutes)
  - `ConsumedAt TIMESTAMPTZ NULL`
  - `RequestedIp VARCHAR(64)`, `RequestedUserAgent TEXT`
  - `CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - Indexes on `(UserId, UserType, Purpose)` and `ExpiresAt`
- New table `EmailVerificationThrottle` (anti-spam ledger):
  - `Id SERIAL PK`, `Key VARCHAR(255)` (composite `userType:userId` or `ip:xxx`), `WindowStart TIMESTAMPTZ`, `Count INT`
  - Unique on `Key, WindowStart`
- Backfill policy:
  - **Existing MainAdminUsers rows: `EmailVerified = FALSE`** so any already-created admin is forced through the same verify flow on their next login (per the user's requirement).
  - Existing `Users` (staff) rows: `EmailVerified = FALSE` as well — they'll get the first-login prompt automatically.
  - This effectively opts everyone in; no one is grandfathered. Password reset still works while unverified so no one can get locked out.

## 2. Backend (C# / .NET)

### 2.1 Service: `EmailVerificationService`
`Backend/Services/EmailVerificationService.cs`. Responsibilities:
- `RequestCodeAsync(userType, userId, email, ip, userAgent, lang)`:
  - Anti-spam:
    - Max **3 codes per user per 15 min**
    - Max **10 codes per IP per hour**
    - Min **60s cooldown** between successive requests (returns `retryAfterSeconds`)
  - Generate cryptographically random 6-digit numeric code; hash with SHA-256 + per-row salt.
  - Invalidate previous unconsumed codes for `(userId, userType, purpose)`.
  - Insert row with `ExpiresAt = NOW() + 10 min`.
  - Enqueue email via existing sender (same infra as password reset) using localized template (§4). Language chosen by `lang` param (`en` / `fr`), fallback `en`.
- `VerifyCodeAsync(userType, userId, code)`:
  - Load most recent unconsumed, unexpired code.
  - Increment `Attempts`; if > `MaxAttempts` → invalidate and return `too_many_attempts`.
  - Constant-time hash compare. On success:
    - Set `ConsumedAt = NOW()`
    - Set target user's `EmailVerified = TRUE`, `EmailVerifiedAt = NOW()`
    - Audit log entry
- `GetStatusAsync(userType, userId)` → `{ emailVerified, email, canResendAt }`.

### 2.2 Controller: `EmailVerificationController`
Base route `api/email-verification`, JWT-authenticated (verification happens post-login or during pending-signup token).

- `GET /status` → current user's verification status.
- `POST /request` body `{ lang?: 'en' | 'fr' }` → sends code to authenticated user's stored email. Returns `{ sent: true, cooldownSeconds, expiresInSeconds }`.
- `POST /verify` body `{ code: string }` → verifies; returns updated status.

Signup-flow variant: same endpoints; MainAdmin signup issues an interim JWT with a `signup_pending_verification` claim that only allows `/email-verification/*` and `/auth/complete-signup`.

### 2.3 Auth changes

**MainAdmin signup (new account, empty app):**
- `AuthController.RegisterMainAdmin` creates the row with `EmailVerified = FALSE`.
- Immediately calls `EmailVerificationService.RequestCodeAsync`.
- Returns a **pending-verification token** + `next: 'verify-email'` (no full session yet).
- New `POST /auth/complete-signup`: requires pending token; if `EmailVerified = TRUE`, mints real session token, returns `next: 'onboarding'`.

**MainAdmin login (existing accounts, including already-created admins):**
- Password check succeeds → issue **full session token normally** (they need it to call `/email-verification/*`).
- Response includes `emailVerified` flag.
- If `emailVerified === false`, response also carries `next: 'verify-email'` so the frontend routes them to the verification page **before** letting them into the app.

**User (staff) login:**
- On successful password check, if `FirstLoginAt IS NULL` set it to `NOW()`.
- Login succeeds; response includes `emailVerified`. If `false`, frontend shows the banner and auto-opens the modal on first login (see §3.5).

- All login/refresh responses expose `emailVerified` for both user types.

### 2.4 Anti-spam hardening
- Throttle keyed on user + IP (see §2.1).
- Rate-limit endpoints via existing middleware (attribute: 20 req / 5 min / IP).
- Codes hashed at rest; raw code exists only in the sent email.
- Log every request/verify to `SystemLogs` (issued, verified, failed, throttled).
- No user enumeration for anonymous shapes; authenticated shape is fine because caller already knows the user.

## 3. Frontend

### 3.1 New API service
`src/services/emailVerificationApi.ts`:
- `getStatus()`, `requestCode(lang)`, `verifyCode(code)`, `completeSignup()`.

### 3.2 MainAdmin signup flow (fresh app)
`src/modules/auth/pages/SignUp.tsx` state machine:
- After successful register, if response is `next: 'verify-email'`:
  - Store pending token in `sessionStorage` (not localStorage).
  - Navigate to new `/auth/verify-email` step **before** `/onboarding`.
- New page `src/modules/auth/pages/VerifyEmailStep.tsx`:
  - Masked email (`j••••e@example.com`), 6-digit OTP input, resend button with `cooldownSeconds` countdown, expiry timer from `expiresInSeconds`.
  - On success, calls `/auth/complete-signup` → stores real token → navigates to `/onboarding`.
- Router guard: while pending token exists and email not verified, force `/auth/verify-email`; block `/onboarding`.

### 3.3 MainAdmin login flow (already-created admin, per new requirement)
- After a normal MainAdmin login, if the login response returns `emailVerified: false`:
  - Auth store keeps the session token (they're authenticated), but flags `mustVerifyEmail: true`.
  - Router guard redirects any navigation to `/auth/verify-email` **before** the app shell renders (no dashboard access until verified).
  - `VerifyEmailStep` page is reused; on success, guard releases and user lands on their intended route (default dashboard).
  - "Sign out" is available from that page so they can escape if needed.

### 3.4 Post-login banner (fallback + staff Users)
`src/shared/components/EmailVerificationBanner.tsx`:
- Rendered inside `AppHeader` when `currentUser.emailVerified === false`.
- For MainAdminUsers this rarely shows because the guard in §3.3 blocks access first — but it remains as a defensive fallback (e.g., verification state flips mid-session).
- For staff Users it shows once inside the app (they aren't hard-blocked like MainAdmin).
- Red destructive strip under the header, text: "Please verify your email. Click to verify." Buttons: `Verify now`, `Dismiss for this session`.
- Clicking opens `<EmailVerificationModal />`.

### 3.5 Verification modal
`src/shared/components/EmailVerificationModal.tsx`:
- Auto-triggers `requestCode(currentLang)` on first open (respecting cooldown).
- 6-digit OTP input (paste-friendly), inline countdown, `Resend` (disabled until cooldown ends), errors for `invalid_code`, `expired`, `too_many_attempts`, `rate_limited`.
- On success: closes, refreshes auth user (`emailVerified: true`), banner disappears, success toast.

### 3.6 First-login prompt for staff Users
- When a `Users` login response indicates `FirstLoginAt` was just set AND `emailVerified = false`, frontend auto-opens `EmailVerificationModal` once. Tracked via `firstLoginPrompted` in `sessionStorage`.
- Staff aren't hard-blocked from the app — they see the banner until verified.

### 3.7 i18n
Add keys in `src/modules/auth/locale/{en,fr}.json`:
- `verifyEmail.title`, `.description`, `.codeLabel`, `.resend`, `.resendIn`, `.expiresIn`, `.submit`, `.errors.invalid`, `.errors.expired`, `.errors.tooManyAttempts`, `.errors.rateLimited`, `.success`, `.banner.text`, `.banner.cta`, `.banner.dismiss`, `.maskedEmail`, `.signOut`.
- Email language sent to backend via `lang` param = current `i18n.language`.

## 4. Email templates (localized)

`Backend/Templates/Email/EmailVerification/`:
- `email-verification.en.html` + `.txt`
- `email-verification.fr.html` + `.txt`

Variables: `{{FirstName}}`, `{{Code}}`, `{{ExpiresInMinutes}}`, `{{AppName}}`, `{{SupportEmail}}`, `{{Year}}`.

Subjects:
- EN: `Your {{AppName}} verification code: {{Code}}`
- FR: `Votre code de vérification {{AppName}} : {{Code}}`

Bodies: greeting, prominent code block, expiry notice, "If you didn't request this, ignore this email", footer. Mirrored FR translation.

Template loader (same one used by password reset) is extended to pick the file by `lang`, falling back to `en`.

Anti-spam / deliverability:
- `multipart/alternative` with plain-text alt.
- Transactional headers: `Message-ID`, `Date`, `X-Auto-Response-Suppress: All`.
- Reuse the already-warmed sender identity used for password reset (SPF/DKIM already aligned).
- Code-only flow (no clickable link) reduces phishing signals and spam scoring.

## 5. Rollout / edge cases

- All existing MainAdminUsers and Users get `EmailVerified = FALSE`, so at their next login the flows in §3.3 (hard block for admins) and §3.5–§3.6 (banner + auto-modal for staff) kick in automatically — matches the user's requirement.
- Password reset stays open to unverified users so nobody is trapped.
- `Purpose = 'email_change'` reserved in the codes table for future email-change flow (not built now).
- `/api/onboarding/*` server-side guard rejects requests when `EmailVerified = FALSE` for MainAdmin (defense in depth).
- Tests: throttle math, code hashing/compare, expiry; integration tests for (a) fresh signup → verify → onboarding, (b) existing admin login-when-unverified → forced to verify page → dashboard, (c) staff login-with-unverified → banner + auto-modal.

## Deliverables checklist

1. Neon migration `35_email_verification.sql` (columns + tables + backfill).
2. `EmailVerificationService`, `EmailVerificationController`, auth changes (register, complete-signup, login response includes `emailVerified` + `next`).
3. Localized email templates + template loader change.
4. Frontend: API client, `VerifyEmailStep` page, banner, modal, router guard (hard block for MainAdmin, soft banner for Users), first-login auto-modal.
5. i18n additions EN + FR.
6. Rate-limit attribute + throttle table wiring.
7. Audit-log / `SystemLogs` entries.
