# Concurrency Acceptance Test

Goal: simulate 50 concurrent users for 10 seats with no double booking.

## Preconditions

1. Database is running.
2. Backend is running on port 4000.
3. Seed data is loaded.

## Run

From `backend`:

1. `npm run test:concurrency`

## Expected

- Exactly 10 successful bookings.
- Remaining attempts fail gracefully.
- No duplicate confirmed seat bookings for same event.

## Notes

- Script currently simulates 50 parallel booking attempts using one test user token and 10 seat targets.
- This validates locking and uniqueness behavior under contention.
