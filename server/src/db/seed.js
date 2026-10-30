import bcrypt from 'bcryptjs';
import { query } from './pool.js';

const demoUsers = [
  // Admin
  {
    full_name: 'Admin User',
    email: 'admin@wayshare.in',
    mobile: '9000000000',
    password: 'Admin@123',
    gender: 'male',
    role: 'admin',
    is_driver: false,
    is_mobile_verified: true,
  },
  // Drivers
  {
    full_name: 'Arjun Sharma',
    email: 'arjun.sharma@demo.wayshare.in',
    mobile: '9811234567',
    password: 'Demo@123',
    gender: 'male',
    role: 'driver',
    is_driver: true,
    is_mobile_verified: true,
  },
  {
    full_name: 'Priya Mehta',
    email: 'priya.mehta@demo.wayshare.in',
    mobile: '9822345678',
    password: 'Demo@123',
    gender: 'female',
    role: 'driver',
    is_driver: true,
    is_mobile_verified: true,
  },
  {
    full_name: 'Rahul Verma',
    email: 'rahul.verma@demo.wayshare.in',
    mobile: '9833456789',
    password: 'Demo@123',
    gender: 'male',
    role: 'driver',
    is_driver: true,
    is_mobile_verified: true,
  },
  {
    full_name: 'Sneha Iyer',
    email: 'sneha.iyer@demo.wayshare.in',
    mobile: '9844567890',
    password: 'Demo@123',
    gender: 'female',
    role: 'driver',
    is_driver: true,
    is_mobile_verified: true,
  },
  // Passengers
  {
    full_name: 'Kavya Reddy',
    email: 'kavya.reddy@demo.wayshare.in',
    mobile: '9855678901',
    password: 'Demo@123',
    gender: 'female',
    role: 'passenger',
    is_driver: false,
    is_mobile_verified: true,
  },
  {
    full_name: 'Aditya Kumar',
    email: 'aditya.kumar@demo.wayshare.in',
    mobile: '9866789012',
    password: 'Demo@123',
    gender: 'male',
    role: 'passenger',
    is_driver: false,
    is_mobile_verified: true,
  },
  {
    full_name: 'Meera Nair',
    email: 'meera.nair@demo.wayshare.in',
    mobile: '9877890123',
    password: 'Demo@123',
    gender: 'female',
    role: 'passenger',
    is_driver: false,
    is_mobile_verified: true,
  },
];

const vehicles = [
  { reg: 'MH01AB1234', make: 'Maruti Suzuki', model: 'Swift', year: 2022, color: 'White', type: 'car', seats: 4 },
  { reg: 'DL05CD5678', make: 'Hyundai', model: 'Creta', year: 2023, color: 'Silver', type: 'suv', seats: 5 },
  { reg: 'KA03EF9012', make: 'Honda', model: 'City', year: 2021, color: 'Blue', type: 'car', seats: 4 },
  { reg: 'TN07GH3456', make: 'Toyota', model: 'Innova', year: 2022, color: 'Grey', type: 'van', seats: 7 },
];

const rideTemplates = [
  {
    origin_address: 'Connaught Place, New Delhi',
    origin_lat: 28.6315,
    origin_lng: 77.2167,
    destination_address: 'Sector 18, Noida',
    destination_lat: 28.5706,
    destination_lng: 77.3219,
    contribution: 200,
    seats: 3,
    type: 'regular',
    distance: 18.5,
    duration: 45,
  },
  {
    origin_address: 'Bandra West, Mumbai',
    origin_lat: 19.0596,
    origin_lng: 72.8295,
    destination_address: 'Andheri East, Mumbai',
    destination_lat: 19.1136,
    destination_lng: 72.8697,
    contribution: 150,
    seats: 2,
    type: 'women_only',
    distance: 9.2,
    duration: 30,
  },
  {
    origin_address: 'Koramangala, Bengaluru',
    origin_lat: 12.9279,
    origin_lng: 77.6271,
    destination_address: 'Whitefield, Bengaluru',
    destination_lat: 12.9698,
    destination_lng: 77.7499,
    contribution: 300,
    seats: 3,
    type: 'regular',
    distance: 22.1,
    duration: 60,
  },
  {
    origin_address: 'T Nagar, Chennai',
    origin_lat: 13.0418,
    origin_lng: 80.2341,
    destination_address: 'OMR, Chennai',
    destination_lat: 12.9010,
    destination_lng: 80.2279,
    contribution: 250,
    seats: 4,
    type: 'regular',
    distance: 17.3,
    duration: 40,
  },
  {
    origin_address: 'Aundh, Pune',
    origin_lat: 18.5590,
    origin_lng: 73.8080,
    destination_address: 'Hinjewadi, Pune',
    destination_lat: 18.5912,
    destination_lng: 73.7389,
    contribution: 180,
    seats: 3,
    type: 'women_only',
    distance: 10.5,
    duration: 25,
  },
];

export const runSeed = async () => {
  try {
    console.log('🌱 Starting seed...');

    // Clear demo data
    await query("DELETE FROM bookings WHERE is_demo = TRUE");
    await query("DELETE FROM rides WHERE is_demo = TRUE");
    await query("DELETE FROM vehicles WHERE is_demo = TRUE");
    await query("DELETE FROM users WHERE is_demo = TRUE");

    const userIds = [];
    for (const u of demoUsers) {
      const hash = await bcrypt.hash(u.password, 10);
      const res = await query(
        `INSERT INTO users (full_name, email, mobile, password_hash, gender, role, is_driver, is_mobile_verified, is_demo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
         ON CONFLICT (email) DO UPDATE SET full_name=EXCLUDED.full_name, is_demo=TRUE
         RETURNING id`,
        [u.full_name, u.email, u.mobile, hash, u.gender, u.role, u.is_driver, u.is_mobile_verified]
      );
      userIds.push({ id: res.rows[0].id, ...u });
      console.log(`  ✅ User: ${u.email}`);
    }

    const drivers = userIds.filter(u => u.is_driver);
    const vehicleIds = [];

    for (let i = 0; i < drivers.length && i < vehicles.length; i++) {
      const v = vehicles[i];
      const res = await query(
        `INSERT INTO vehicles (driver_id, registration_number, make, model, year, color, vehicle_type, total_seats, is_demo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
         ON CONFLICT (registration_number) DO UPDATE SET is_demo=TRUE
         RETURNING id`,
        [drivers[i].id, v.reg, v.make, v.model, v.year, v.color, v.type, v.seats]
      );
      vehicleIds.push({ vehicleId: res.rows[0].id, driverId: drivers[i].id });

      await query(
        `INSERT INTO driver_profiles (user_id, licence_number) VALUES ($1,$2) ON CONFLICT (user_id) DO NOTHING`,
        [drivers[i].id, `DL${Math.floor(Math.random() * 1000000)}`]
      );
      console.log(`  ✅ Vehicle: ${v.reg} for ${drivers[i].email}`);
    }

    // Create rides — future departures
    const now = new Date();
    for (let i = 0; i < rideTemplates.length && i < vehicleIds.length; i++) {
      const t = rideTemplates[i];
      const departure = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const { driverId, vehicleId } = vehicleIds[i];
      const ride = await query(
        `INSERT INTO rides (driver_id, vehicle_id, ride_type, status, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng, departure_datetime, total_seats, available_seats, contribution_per_seat, toll_charges, booking_type, estimated_distance_km, estimated_duration_min, is_demo)
         VALUES ($1,$2,$3,'published',$4,$5,$6,$7,$8,$9,$10,$11,$11,$12,50,'auto',$13,$14,TRUE)
         RETURNING id`,
        [driverId, vehicleId, t.type, t.origin_address, t.origin_lat, t.origin_lng, t.destination_address, t.destination_lat, t.destination_lng, departure, t.seats, t.contribution, t.distance, t.duration]
      );
      const rideId = ride.rows[0].id;

      await query(
        `INSERT INTO ride_preferences (ride_id, ac, smoking_allowed, pets_allowed, food_allowed, music_allowed, luggage_size, front_seat_available)
         VALUES ($1, TRUE, FALSE, FALSE, TRUE, TRUE, 'small', FALSE)
         ON CONFLICT (ride_id) DO NOTHING`,
        [rideId]
      );
      console.log(`  ✅ Ride: ${t.origin_address} → ${t.destination_address}`);
    }

    console.log('✅ Seed completed successfully!');
    console.log('\nDemo accounts (password: Demo@123 for all):');
    demoUsers.filter(u => u.role !== 'admin').forEach(u => {
      console.log(`  [${u.role.toUpperCase()}] ${u.email}`);
    });
    console.log('\nAdmin account:');
    console.log('  admin@wayshare.in / Admin@123');
  } catch (err) {
    console.error('❌ Seed error:', err);
    throw err;
  }
};

if (process.argv[1].includes('seed.js')) {
  import('dotenv').then(d => {
    d.config();
    runSeed().then(() => process.exit(0)).catch(() => process.exit(1));
  });
}
