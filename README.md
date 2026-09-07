# Smart CNG Tracking & Slot Management System

Full-stack college project for locating CNG stations, checking availability, managing queues, and reserving refueling slots.

## Stack
- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Apple MapKit JS
- QR-code booking confirmations

## Current implementation
- JWT registration/login and protected profiles
- Three-role authentication foundation
- CNG station search and status filtering
- Apple Maps station markers and user-location control
- Station detail pages and directions
- Live station queue with periodic refresh
- Date/time/pump slot selection
- Date-specific overlap protection for pump bookings
- User overlap protection for bookings
- Booking cancellation deadline
- MongoDB booking records
- Booking IDs and QR-code confirmations
- My Bookings and Booking History
- Station admin dashboard, pump controls, booking controls, and queue controls
- System admin statistics, user management, station approval, and booking oversight
- Environment-driven demo database seeding

## Run locally
1. Copy `server/.env.example` to `server/.env` and configure MongoDB, JWT, and the seed credentials.
2. Copy `client/.env.example` to `client/.env` and add your Apple MapKit JS token.
3. Install dependencies:

```bash
npm install
npm run install:all
```

4. Seed the demo station and admin accounts:

```bash
npm run seed --prefix server
```

5. Start the application:

```bash
npm run dev
```

Client: http://localhost:5173  
API: http://localhost:5000  
Health: http://localhost:5000/api/health

The seed script never stores demo passwords in source code. Set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_STATION_ADMIN_EMAIL`, and `SEED_STATION_ADMIN_PASSWORD` in `server/.env` before running it.

## Booking API
- `GET /api/bookings/slots/:stationId?date=YYYY-MM-DD`
- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id/cancel`
- `PUT /api/bookings/:id/complete`

## Admin API
- `GET /api/admin/dashboard`
- `PUT /api/admin/slots/:id`
- `PUT /api/admin/bookings/:id/status`
- `GET /api/system-admin/statistics`
- `GET /api/system-admin/users`
- `PUT /api/system-admin/users/:id/status`
- `GET /api/system-admin/stations`
- `PUT /api/system-admin/stations/:id/approval`
- `GET /api/system-admin/bookings`

## Important
`Station.availableSlots` represents current operational availability. Future booking capacity is calculated from the individual pump slots and bookings for the selected date/time; creating or cancelling a future booking does not change the station's current availability count.

Runtime testing still requires running the project locally with MongoDB and the required environment variables.
