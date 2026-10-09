# Smart CNG hardening branch

This branch is an isolated implementation branch based on `ui/premium-dashboard-polish`. It does not overwrite the existing branch.

## Implemented in this branch

- Added a `bookingId` reference to queue entries so refueling can be tied to the exact reservation, not merely a customer with the same account.
- Added a unique partial index to prevent multiple queue records from being linked to the same booking.
- Queue status transitions are constrained: Waiting → Refueling/Cancelled and Refueling → Completed/Cancelled. Completed and Cancelled entries cannot be reopened.
- Staff cannot mark a queue entry Completed unless it has first entered Refueling.
- Completing a queue entry completes only its linked booking; a walk-in queue entry does not complete an unrelated booking.
- Booking completion is blocked for customers. Station staff must complete the queue/refueling workflow.
- Station-admin completion checks use the exact booking reference rather than matching only station and customer.
- Booking creation validates MongoDB IDs, calendar/time formats, station approval/open status, operating hours, the booking horizon, and overlapping active reservations.
- Booking cancellation cancels its associated active queue entry.
- Missed Pending/Confirmed bookings are marked Unvisited by a backend worker at startup and every minute, rather than only when a station admin opens the dashboard.
- Backend booking date checks use a configurable station timezone. Default: `Asia/Kolkata`.
- Added an initial automated test for station-local date handling.

## Regression checklist

Run these manually with separate customer and station-admin accounts and a test database.

1. A user can book only today or the next two calendar days.
2. A past date, malformed date/time, past same-day time, closed station, unapproved station, or time outside operating hours is rejected.
3. Two active bookings that overlap for the same pump are rejected.
4. A user cannot create overlapping active bookings across pumps.
5. A user cannot complete their own booking through the customer API.
6. A station admin cannot complete a future booking.
7. A station admin cannot complete a booking just because the same customer has some other completed queue entry.
8. A queue entry cannot go Waiting → Completed directly.
9. A queue entry can complete only after Waiting → Refueling → Completed.
10. Completing a linked queue entry completes that exact booking; completing a walk-in queue entry does not change any booking.
11. Cancelled, Completed, Expired, and Unvisited bookings cannot be reactivated through the station-admin status endpoint.
12. Cancelling a booking also cancels its active linked queue entry.
13. A missed booking becomes Unvisited after the station-local date has passed, even if nobody opens the dashboard.
14. Verify customer, station-admin, and system-admin role restrictions using separate accounts.
15. Test database unavailable, invalid IDs, duplicate requests, refresh, mobile layout, and restarting the server.

## Known work that still requires verification or further implementation

- The app has not been executed against your MongoDB database from this environment. Run the tests and the regression checklist before using it for a demo.
- Arbitrary overlapping booking requests can still race if two clients submit at nearly the same time. The current overlap query alone is not a database-level exclusion lock; implement a transaction/unique reservation ledger before production use.
- This worker runs inside the API process. For multi-instance deployments, use a dedicated scheduled worker/cron job or a distributed lock to avoid redundant processing.
- Date-only booking strings assume the station uses one configured timezone. If stations operate in multiple timezones, store a timezone on each station and derive dates per station.
- Rate limiting, email/SMS notifications, audit logs, monitoring, backups, accessibility review, and deployment-specific security configuration remain deployment tasks.
