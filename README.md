# Smart CNG Tracking & Slot Management System

A full-stack college project for locating CNG stations, checking availability, managing queues, and reserving refueling slots.

## Stack
- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- OpenStreetMap + Leaflet (planned in later stages)

## Stage 1
The initial foundation includes:
- React/Vite client
- Express API server
- MongoDB connection
- User model with three roles
- JWT registration/login
- Protected profile API
- Environment template

## Run locally

### 1. Configure MongoDB
Create a local MongoDB database or use a MongoDB Atlas connection string.

Copy `server/.env.example` to `server/.env` and set:
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`

### 2. Install dependencies
```bash
npm install
npm run install:all
```

### 3. Start both apps
```bash
npm run dev
```

Client: http://localhost:5173
API: http://localhost:5000
Health check: http://localhost:5000/api/health

## API foundation
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/profile`
- `PUT /api/users/profile`

The application will be expanded through the remaining stages: station search, maps, booking, queue management, station admin, system admin, responsive UI, and testing.
