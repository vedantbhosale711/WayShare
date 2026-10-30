# WayShare 🚗

**India's full-stack carpool management platform.**

Connect drivers travelling to a destination with passengers who want to share the journey and split travel expenses.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router DOM, Axios, Lucide React, React Leaflet |
| Backend | Node.js, Express.js, PostgreSQL (Neon), JWT, bcrypt |
| Auth | Email/password + Firebase Phone OTP (driver registration) |
| Maps | OpenStreetMap, Leaflet, Nominatim (geocoding), OSRM (routing) |
| Email | Nodemailer (SMTP) |

---

## Project Structure

```
way-share/
├── client/          React + Vite frontend
│   ├── src/
│   │   ├── api/         Axios API client + endpoint helpers
│   │   ├── components/  Navbar, Footer, RouteMap, LocationSearch, RideCard, ui helpers
│   │   ├── contexts/    AuthContext (JWT + user state)
│   │   └── pages/       All 24 pages
│   └── .env.example
├── server/          Node.js + Express backend
│   ├── src/
│   │   ├── controllers/ Auth, Driver, Vehicle, Ride, Booking, Notification, Payment, Review, User, Admin
│   │   ├── db/          pool.js, migrate.js, seed.js
│   │   ├── middleware/  auth.js, errorHandler.js, upload.js
│   │   ├── routes/      All REST routes
│   │   └── utils/       email.js
│   └── .env.example
├── README.md
└── .gitignore
```

---

## Setup Instructions

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

**Server** — copy `server/.env.example` → `server/.env` and fill in:

```env
PORT=5000
DATABASE_URL=postgresql://user:pass@host/wayshare?sslmode=require
JWT_SECRET=your_random_secret_here
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:5173
```

**Client** — copy `client/.env.example` → `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Set Up PostgreSQL (Neon)

1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string into `server/.env` as `DATABASE_URL`

### 4. Run Database Migrations

```bash
cd server
npm run migrate
```

### 5. Seed Demo Data

```bash
cd server
npm run seed
```

This creates demo users, vehicles, and rides. All demo passwords are **Demo@123**.

### 6. Start the Application

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server: http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App: http://localhost:5173
```

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@wayshare.in | Admin@123 |
| Driver | arjun.sharma@demo.wayshare.in | Demo@123 |
| Driver (female) | priya.mehta@demo.wayshare.in | Demo@123 |
| Passenger | kavya.reddy@demo.wayshare.in | Demo@123 |
| Passenger | aditya.kumar@demo.wayshare.in | Demo@123 |

---

## Features

### Authentication
- Email + password registration and login
- JWT-based authentication
- Password change
- Profile editing with avatar upload

### Driver Registration
- Multi-step form: documents + vehicle + review
- Licence and RC document upload
- Vehicle details + image
- Mobile OTP via Firebase (configurable)

### Ride Management (Driver)
- Create rides with 4-step form: Route → Details → Preferences → Review
- Up to 3 intermediate stops
- Real road routing via OSRM
- Route map with Leaflet + OpenStreetMap
- Auto or manual booking approval
- Save as draft or publish
- Edit, cancel, duplicate rides
- Saved routes

### Ride Discovery (Passenger)
- Search by origin, destination, date
- Women-Only Rides section (female passengers only)
- Filters: price, seats, AC, departure time
- Interactive route map on each ride

### Booking System
- Seat selection + pickup/dropoff
- Auto-confirm or manual driver approval
- Full status lifecycle: Pending → Confirmed → Completed
- Overbooking prevention via DB transactions
- Women-only eligibility enforced on backend

### Safety
- Emergency contacts (one per passenger)
- Email notification sent to emergency contact on booking confirmation
- Driver mobile shown only after booking confirmation

### Payments
- Payment records per booking
- Mark as paid (cash)
- Full payment history

### Reviews
- Post-trip star rating + comment
- Driver average rating updated in real time

### Notifications
- In-app notifications for all booking events
- Unread count in navbar

### Admin Dashboard
- Platform stats overview
- User management (activate/deactivate)
- Ride overview
- Report management
- Support ticket management

---

## API Endpoints

| Resource | Base Path |
|---|---|
| Auth | `/api/auth` |
| Driver | `/api/driver` |
| Vehicles | `/api/vehicles` |
| Rides | `/api/rides` |
| Bookings | `/api/bookings` |
| Notifications | `/api/notifications` |
| Payments | `/api/payments` |
| Reviews | `/api/reviews` |
| Users | `/api/users` |
| Admin | `/api/admin` |

---

## Notes

- All amounts in **INR (₹)**
- No real payment gateway — payment records only
- Firebase Phone OTP requires a Firebase project for production use
- Email notifications require SMTP credentials
- Uploaded files stored locally in `server/uploads/` (use cloud storage in production)
- Demo data is labelled `is_demo: true` and can be re-seeded safely
