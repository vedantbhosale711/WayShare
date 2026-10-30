import { query } from './pool.js';

const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  profile_picture VARCHAR(500),
  role VARCHAR(20) DEFAULT 'passenger' CHECK (role IN ('passenger', 'driver', 'admin')),
  is_driver BOOLEAN DEFAULT FALSE,
  is_mobile_verified BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Profiles
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  licence_number VARCHAR(50),
  licence_document VARCHAR(500),
  rc_document VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  total_rides INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_number VARCHAR(20) UNIQUE NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(30) NOT NULL,
  vehicle_type VARCHAR(30) DEFAULT 'car' CHECK (vehicle_type IN ('car', 'suv', 'van', 'bike', 'auto')),
  total_seats INTEGER NOT NULL DEFAULT 4,
  vehicle_image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rides
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  ride_type VARCHAR(20) DEFAULT 'regular' CHECK (ride_type IN ('regular', 'women_only')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  origin_address TEXT NOT NULL,
  origin_lat DECIMAL(10,8) NOT NULL,
  origin_lng DECIMAL(11,8) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat DECIMAL(10,8) NOT NULL,
  destination_lng DECIMAL(11,8) NOT NULL,
  departure_datetime TIMESTAMPTZ NOT NULL,
  total_seats INTEGER NOT NULL,
  available_seats INTEGER NOT NULL,
  contribution_per_seat INTEGER NOT NULL,
  toll_charges INTEGER DEFAULT 0,
  additional_instructions TEXT,
  booking_type VARCHAR(20) DEFAULT 'manual' CHECK (booking_type IN ('auto', 'manual')),
  booking_deadline TIMESTAMPTZ,
  cancellation_hours INTEGER DEFAULT 2,
  estimated_distance_km DECIMAL(10,2),
  estimated_duration_min INTEGER,
  route_polyline JSONB,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ride Preferences
CREATE TABLE IF NOT EXISTS ride_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID UNIQUE NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  ac BOOLEAN DEFAULT TRUE,
  smoking_allowed BOOLEAN DEFAULT FALSE,
  pets_allowed BOOLEAN DEFAULT FALSE,
  food_allowed BOOLEAN DEFAULT TRUE,
  music_allowed BOOLEAN DEFAULT TRUE,
  luggage_size VARCHAR(20) DEFAULT 'small' CHECK (luggage_size IN ('small', 'large', 'both')),
  front_seat_available BOOLEAN DEFAULT FALSE
);

-- Ride Stops (intermediate stops)
CREATE TABLE IF NOT EXISTS ride_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Routes
CREATE TABLE IF NOT EXISTS saved_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  origin_address TEXT NOT NULL,
  origin_lat DECIMAL(10,8),
  origin_lng DECIMAL(11,8),
  destination_address TEXT NOT NULL,
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
  seats_booked INTEGER NOT NULL DEFAULT 1,
  pickup_address TEXT,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  dropoff_address TEXT,
  dropoff_lat DECIMAL(10,8),
  dropoff_lng DECIMAL(11,8),
  total_amount INTEGER NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  cancellation_reason TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, passenger_id)
);

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES users(id),
  payee_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  currency VARCHAR(5) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50) DEFAULT 'cash',
  transaction_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewee_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favourite Drivers
CREATE TABLE IF NOT EXISTS favourite_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(passenger_id, driver_id)
);

-- Favourite Locations
CREATE TABLE IF NOT EXISTS favourite_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reported_user_id UUID NOT NULL REFERENCES users(id),
  ride_id UUID REFERENCES rides(id),
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_departure ON rides(departure_datetime);
CREATE INDEX IF NOT EXISTS idx_rides_type ON rides(ride_type);
CREATE INDEX IF NOT EXISTS idx_rides_origin ON rides(origin_address);
CREATE INDEX IF NOT EXISTS idx_rides_destination ON rides(destination_address);
CREATE INDEX IF NOT EXISTS idx_bookings_ride ON bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON vehicles(driver_id);
`;

export const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    await query(schema);
    console.log('✅ Migrations completed successfully');
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  }
};

// Run directly if called as script
if (process.argv[1].includes('migrate.js')) {
  import('dotenv').then(d => {
    d.config();
    import('./pool.js').then(() => {
      runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
    });
  });
}
