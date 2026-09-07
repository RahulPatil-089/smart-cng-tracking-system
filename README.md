# Smart CNG Tracking & Slot Management System

Full-stack college project for locating CNG stations, checking live availability, managing queues, and reserving CNG refueling slots.

## Stack
- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication and role-based authorization
- Apple MapKit JS
- QR-code booking confirmations
- Tailwind CSS + Lucide icons

## Roles
- **User / Vehicle Owner:** find stations, view live queues, reserve pumps, manage bookings and profile.
- **Station Admin:** manage assigned station profile, pump status, bookings, live queue, analytics and booking verification.
- **System Admin:** manage users, station approvals, station status, station-admin assignments and all bookings.

## Implemented features
- JWT registration/login, protected routes and automatic role-based landing pages
- Secure public registration (new accounts are always regular users)
- Station search, status filtering, distance calculation and responsive cards
- Apple Maps with station markers, station callouts, details/booking actions and user-location control
- Station details with hours, CNG price, pump availability, queue length and estimated wait
- Apple Maps directions from station details
- Live queue join/leave, duplicate queue prevention, position and wait-time recalculation, and admin queue controls
- Date-specific pump availability and booking overlap protection
- Booking validation for station hours and past times
- User overlap protection so one user cannot hold overlapping reservations
- Unique booking IDs and QR-code confirmations
- Booking statuses: Pending, Confirmed, Completed, Cancelled, Expired
- Cancellation deadline enforcement (15 minutes before start)
- My Bookings and Booking History
- Station admin profile editing, pump controls, booking controls and live queue workflow
- Station admin 7-day booking analytics and peak-hour summary
- Station admin booking-ID verification against the assigned station
- System admin statistics, user enable/disable, station approval, station status control and station-admin assignment
- Environment-driven demo database seed data
- Responsive desktop/tablet/mobile UI

## Project structure
```text
client/
  src/components
  src/pages
  src/layouts
  src/context
  src/services
server/
  models
  routes
  middleware
  seed.js
  server.js
```

## Run locally
1. Make sure MongoDB is running locally or use a MongoDB connection string.
2. Copy `server/.env.example` to `server/.env` and configure MongoDB, JWT and seed credentials.
3. Copy `client/.env.example` to `client/.env` and add an Apple MapKit JS token. Do not put private Apple credentials in the frontend.
4. Install dependencies:

```bash
npm install
npm run install:all
```

5. Seed the demo station and admin accounts:

```bash
npm run seed --prefix server
```

6. Start both frontend and backend:

```bash
npm run dev
```

Client: `http://localhost:5173`  
API: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

The seed script never stores demo passwords in source code. Set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_STATION_ADMIN_EMAIL`, and `SEED_STATION_ADMIN_PASSWORD` in `server/.env` before seeding.

## Important API groups
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Stations
- `GET /api/stations`
- `GET /api/stations/:id`
- `POST /api/stations` (system admin)
- `PUT /api/stations/:id` (assigned station admin/system admin)
- `DELETE /api/stations/:id` (system admin)

### Bookings
- `GET /api/bookings/slots/:stationId?date=YYYY-MM-DD`
- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id/cancel`
- `PUT /api/bookings/:id/complete`

### Queue
- `GET /api/stations/:id/queue`
- `POST /api/stations/:id/queue`
- `DELETE /api/queue/:id`
- `PUT /api/queue/:id/status` (station/system admin with station authorization)

### Station admin
- `GET /api/admin/dashboard`
- `GET /api/admin/analytics?days=7`
- `GET /api/admin/bookings/verify/:bookingId`
- `PUT /api/admin/slots/:id`
- `PUT /api/admin/bookings/:id/status`

### System admin
- `GET /api/system-admin/statistics`
- `GET /api/system-admin/users`
- `PUT /api/system-admin/users/:id/status`
- `GET /api/system-admin/stations`
- `PUT /api/system-admin/stations/:id/approval`
- `PUT /api/system-admin/stations/:id`
- `GET /api/system-admin/bookings`
- `PUT /api/system-admin/users/:id/station`

## Data model note
`Station.availableSlots` represents **current operational availability**. Future booking capacity is calculated from individual pump slots and bookings for the selected date/time. Creating or cancelling a future booking therefore does not incorrectly change the station's current availability count.

## Testing
The repository is now in the build-complete phase. Runtime testing must be performed locally because it requires your MongoDB instance and environment variables. Follow the run steps above, then test authentication, station search/map, booking conflicts, cancellation, live queue, station-admin controls, QR verification, system-admin controls and responsive layouts.
