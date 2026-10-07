# UI / UX Specification

## 1. Product Interaction Model

The application is a user-centric fitness tracker with a clear personal dashboard, low-friction logging, and simple progress views. The UI is designed to feel helpful and lightweight rather than overengineered.

## 2. Layout and Navigation

### Primary layout

- top navigation or app shell
- left navigation for key sections on larger screens
- responsive behavior for mobile and tablet widths
- sticky header with user actions and account controls

### Navigation groups

- Dashboard
- Workouts
- Exercises
- Water
- Measurements
- Goals
- Nutrition
- Plans
- Profile
- Settings / account management

## 3. Authentication Screens

### Login

- email and password fields
- clear validation states
- submit button with loading state
- forgot-password flow may be future work, not initial MVP
- alternate registration link
- submits to `/api/v1/auth/login` and requests cookie credentials
- keeps the access token in application memory only
- displays the signed-in account and a sign-out action after authentication

### Registration

- email, password, and confirmation fields
- optional name field
- password strength guidance, if implemented
- explicit validation errors
- confirmation is validated before the registration request
- successful registration establishes a session and displays a success state

The refresh token is never exposed to page JavaScript or browser storage. The HTTP-only cookie restores the in-memory access-token session on application load.

### Account lifecycle states

- signed out views must be clear and secure
- protected pages should redirect to login when access is missing

## 4. Dashboard

The dashboard is the main landing screen for authenticated users.

Current dashboard content (Phase 3 shell, extended in Phases 4 through 7):

- account and profile setup overview
- profile link
- an available workout card and up to five recent workout entries
- available cards for workouts, water, measurements, and goals
- an available nutrition card linking to the nutrition log
- a concise overview of active goals and their current derived progress, with a link to goal management
- a recent-workout empty state when the user has no workouts

Design considerations:

- use strong contrast and accessible labels
- show empty states when no records exist yet
- include loading states for async data

## 5. Profile

Phase 3 profile page allows:

- viewing the account email (read-only)
- updating the display name
- updating optional height in centimeters
- selecting the preferred weight unit (kg or lb)

Date of birth, biography, avatar, and broader settings are not part of the implemented profile contract.

## 6. Workouts and Exercises

Phase 4 implementation includes protected, responsive screens for an exercise catalog and workout history.

### Workouts screen

- list workout entries, newest first, with date-range filtering and pagination
- create a workout with title, date, optional duration/notes, and zero or more exercise entries
- view workout detail and edit or delete a workout
- when editing, the exercise-entry list is submitted as a whole
- show loading, empty, validation, and server-error states

### Exercises screen

- list, search, create, edit, and delete the user's exercise catalog
- use an optional free-text category; do not imply a fixed taxonomy
- explain why deletion is blocked when an exercise is referenced by workout history
- keep exercise ownership private to the signed-in user

The workout entry form associates an existing exercise with optional sets, reps, weight, duration, and notes. Body measurements, goals, charts, nutrition, and plans remain outside Phase 4.

## 7. Water Tracking

Phase 5 provides one daily total in milliliters, a selectable inclusive date range and sum, and create/edit/delete actions. A second entry for the same day is not allowed. No user water target or target-based progress bar is shown.

## 8. Measurements

Phase 5 provides date-based snapshots for weight, waist, chest, hip, biceps, and body-fat percentage. Values may be omitted when not applicable; each snapshot needs at least one value. Weight is displayed/input using the profile preference, while storage and API values use kg; other dimensions use cm. Users can review history, compare the latest two snapshots, and create/edit/delete records.

Measurement history charts are available in Phase 6. The date fields represent user-selected calendar days.

## 9. Goals

- create, view, edit, and delete a goal for daily water (ml), workouts per
  calendar week, or target body weight (kg)
- show current values and progress derived from the user's existing records;
  users do not enter a separate current value
- show active, completed, or overdue state derived from the current progress
  and optional target date
- target-weight goals require an existing weight measurement and explain that
  the initial measurement establishes direction/baseline
- provide empty, loading, validation, and error states

## 10. Progress and Charts

- simple charts for daily water totals, workout counts, and recorded weight
- allow an inclusive date range and show only recorded values
- provide a textual/data-table equivalent and accessible chart labels
- show empty/loading/error states without fabricating activity

## 11. Nutrition

- allow a user to record a date, meal/intake description, optional calories
  (kcal), optional protein/carbohydrate/fat (grams), and optional notes
- show the user's entries newest first with inclusive date-range filtering
- allow editing and deleting an owned entry
- summarize logged values for the selected range, independently of list
  pagination; label totals as based on recorded values, since absent nutrient
  fields are unknown rather than zero
- provide loading, empty, validation, and server-error states
- do not include food search/catalog, serving-size calculations, dietary
  recommendations, or nutrition-derived goal progress

## 12. Plans and Scheduling

- create, view, edit, and delete a private training plan with optional
  description and date bounds
- add, edit, and delete dated workout sessions within a plan
- review upcoming (including today) and historical scheduled sessions
- manually mark an item complete or link it to a logged workout; linking
  marks it complete, and linked workouts can be unlinked
- clearly distinguish a scheduled item from its optional logged workout
- provide loading, empty, validation, and API error states
- keep dates calendar-day based; no recurrence or time-slot editor is included

## 13. Responsive Behavior

The UI should be designed for:

- mobile-first layout
- tablet table and card layouts
- desktop dashboard and multi-column views

The app should support responsive spacing, stacking of forms, and touch-friendly controls.

## 14. States and Validation

All interactive experiences must include:

- loading states
- empty states
- validation errors
- server error presentation
- optimistic or deferred state updates only when stable and clearly communicated

Examples:

- a form with required fields shows inline errors
- list pages with no data show helpful empty-state copy
- API failures show clear user-facing messaging without leaking internals

## 15. Accessibility Expectations

- semantic HTML structure
- accessible form labels
- keyboard navigation for controls
- visible focus states
- color contrast suitable for readability
- chart summaries or alternative text when visualizations are used
- screen-reader-safe announcements for important actions

## 16. Future UI Considerations

The UI should keep room for later phases such as:

- social feed and friend comparison
- AI guidance panels
- wearable data sync widgets
- coach and plan-sharing screens

These are not MVP requirements and should not be designed as core UI paths for the initial release.
