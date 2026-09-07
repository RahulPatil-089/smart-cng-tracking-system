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
- Date/time/pump slot selection
- Duplicate booking protection for the same pump/date/time
- MongoDB booking records
- Booking IDs and QR-code confirmations
- My Bookings and Booking History

## Run locally
Copy `server/.env.example` to `server/.env` and configure MongoDB and JWT. Copy `client/.env.example` to `client/.env` and add your Apple MapKit JS token.

```bash
npm install
npm run install:all
npm run dev
```

Client: http://localhost:5173
API: http://localhost:5000
Health: http://localhost:5000/api/health

## Booking API
- `GET /api/bookings/slots/:stationId?date=YYYY-MM-DD`
- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id/cancel`
- `PUT /api/bookings/:id/complete`

Runtime testing still requires running the project locally with MongoDB and the required environment variables.
