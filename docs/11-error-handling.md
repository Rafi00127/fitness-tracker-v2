# Error Handling

## 1. Error Handling Goals

The application must provide clear error responses to users and logs to operators without exposing sensitive information. This includes both API and UI error flows.

## 2. Error Categories

### Validation errors

Used for malformed or incomplete requests.

Examples:

- missing required fields
- invalid email format
- invalid date payloads
- negative numeric values where not allowed

### Authentication errors

Used when a request is missing valid authentication or current authentication has expired.

### Authorization errors

Used when a user is authenticated but not allowed to access a resource.

### Not-found errors

Used when the requested resource does not exist.

### Conflict errors

Used for duplicate or conflicting operations.

Examples:

- duplicate email on registration
- conflicting plan update state

### Server errors

Used for unexpected internal failures.

## 3. API Error Response Format

The API should return errors in a structured format such as:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload is invalid.",
    "details": [
      {
        "field": "email",
        "message": "Email is required."
      }
    ]
  }
}
```

## 4. Frontend Error Presentation

The frontend must translate API failures into clear and user-friendly messages. It should not show raw stack traces or sensitive internal errors.

Examples:

- validation issues appear inline on forms
- auth failures direct the user to log in again
- route access problems lead to signed-out or access-denied states

## 5. Logging Rules

- logs should include request IDs or correlation IDs where possible
- log levels should distinguish informational, warnings, and errors
- logs should not include passwords, tokens, or sensitive payloads
- security-related failures should be captured in a structured, reviewable way

## 6. Sensitive Data Protection

Error handling should never reveal:

- database connection details
- stack traces to end users
- token contents or secrets
- internal service names or private credential values
- sensitive user data in unrelated error contexts

## 7. Operational Guidance

When an unexpected server error occurs, the system should return a generic message while preserving enough internal logging for debugging, support, and secure incident review.

## 8. Current Assumptions

This document establishes a disciplined error model for the MVP. Additional custom error types can be added only when a real requirement emerges.
