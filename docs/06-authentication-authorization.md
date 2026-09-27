# Authentication and Authorization

## 1. Authentication Overview

Authentication answers the question: "Who is the user?" Authorization answers the question: "Is this user allowed to do this action on this resource?"

The project requires both to be clearly separated.

## 2. Registration

The default registration flow:

- user provides email and password
- server validates input
- server checks for duplicate email or unique constraint conflicts
- server creates the user record and related initial profile data where relevant
- server stores a strong password hash, not plaintext data

This is the conservative MVP default.

## 3. Login

The default login flow:

- user submits email and password
- server verifies password against the stored hash
- server issues authenticated tokens
- server may also create or refresh a session context depending on the final implementation

## 4. Logout

The logout flow should:

- invalidate active server-side tokens or session data where applicable
- clear browser cookies or secure client-side token state
- redirect the user to a signed-out state

## 5. Token and Session Strategy

The starting design for the application is:

- short-lived access token returned in the authentication response for API calls
- refresh token delivered only in an HTTP-only cookie for browser clients
- refresh token hashes stored in the database; plaintext refresh tokens are never persisted
- Authorization bearer headers for access tokens used by API clients or future non-browser clients
- production refresh cookies use `Secure`, `HttpOnly`, `SameSite=Lax`, and an auth-only path

The refresh cookie is scoped to `/api/v1/auth`. Clients must send the cookie when calling refresh or logout. Refresh tokens are not returned in JSON responses.
The web client holds access tokens only in memory, restores its session through the refresh endpoint on load, and clears that in-memory state after a successful logout.

## 6. Refresh Behavior

The refresh flow should:

- validate the refresh token
- verify the user and token integrity
- rotate the refresh token to reduce replay risk
- reject invalid or expired tokens with clear API errors
- revoke the previous token and persist only the hash of the replacement

## 7. Password Handling

- never store plaintext passwords
- always hash with a strong password hashing algorithm
- limit passwords to 72 UTF-8 bytes while bcrypt is used
- avoid leaking password requirements or hashes in logs or responses
- handle unsuccessful login attempts in a safe and rate-limited way

The API requires distinct `JWT_SECRET` and `REFRESH_TOKEN_SECRET` values of at least 32 characters at startup. There are no fallback or development secrets.

## 8. Authorization Model

The default authorization model is owner-only access.

Rules:

- authenticated users can access their own records
- users cannot access other users’ records unless a documented share feature is introduced
- object IDs or URLs do not imply ownership
- server-side checks are required for every protected resource

## 9. Protected Resources

Protected resources include, at minimum:

- profile data
- workouts and exercises
- water logs
- measurement history
- goals
- nutrition records
- plans and scheduling data

These routes must reject unauthorized access with status codes and error payloads that do not expose internal implementation details.

## 10. Ownership Checks

Every resource retrieval or mutation must verify:

- the request is authenticated
- the resource exists
- the resource belongs to the current user

Production behavior must not trust client-submitted IDs without server enforcement.

## 11. Account Lifecycle

The initial account lifecycle should support:

- registration
- active account state
- login/logout
- account deactivation or suspension as needed for security or policy reasons

A full account-management system is not required in MVP beyond the basic lifecycles that support secure access.

## 12. Future Role Support

The project should leave room for future role-based authorization if the application later requires it, for example a coach or admin model. At MVP, user-level ownership is the default authorization assumption.

## 13. Security Boundary

The frontend must never be treated as the source of truth for authorization. Client-side hiding of buttons or sections is not enough.

The backend is the single source of truth for access decisions.

## 14. Phase 2 Session Behavior

- registration and login issue a short-lived access token and set a refresh cookie
- refresh returns the user identity and a new access token while rotating the cookie
- refresh atomically revokes the presented token and rotates to a new token
- logout revokes the presented refresh token and clears the cookie
- access tokens are not revoked individually; they expire after 15 minutes
- existing refresh sessions are revoked when migrating from plaintext-token storage
