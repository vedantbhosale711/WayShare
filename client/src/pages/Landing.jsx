import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Car, Shield, MapPin, Users, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { LocationSearch } from '../components/LocationSearch.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const features = [
  { icon: MapPin, title: 'Real Road Routes', desc: 'Actual driving routes via OSRM — no straight lines. See exact distance and duration.' },
  { icon: Shield, title: 'Women-Only Rides', desc: 'Dedicated women-only rides for a safer, more comfortable travel experience.' },
  { icon: Users, title: 'Verified Drivers', desc: 'Drivers submit licence and RC documents. Mobile OTP verified for added trust.' },
  { icon: Star, title: 'Rated & Reviewed', desc: 'Passenger reviews and ratings help you choose the right driver.' },
];

const stats = [
  { label: 'Rides Published', value: '10,000+' },
  { label: 'Cities Covered', value: '50+' },
  { label: 'Happy Users', value: '25,000+' },
  { label: 'Avg Rating', value: '4.7 ★' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [date, setDate] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin.shortName || origin.address);
    if (destination) params.set('destination', destination.shortName || destination.address);
    if (date) params.set('date', date);
    navigate(`/rides/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-6">
            <Car size={14} /> India's Trusted Carpool Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Share the Ride,<br />Save the Journey
          </h1>
          <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
            Connect with drivers heading your way. Split travel costs, reduce traffic, and travel smarter across India.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xl text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="label text-gray-700">From</label>
                <LocationSearch placeholder="Origin city or area" value={origin} onSelect={setOrigin} />
              </div>
              <div>
                <label className="label text-gray-700">To</label>
                <LocationSearch placeholder="Destination city or area" value={destination} onSelect={setDestination} />
              </div>
              <div>
                <label className="label text-gray-700">Date</label>
                <input
                  type="date" min={today} value={date} onChange={e => setDate(e.target.value)}
                  className="input text-gray-900 bg-white [color-scheme:light]"
                />
              </div>
            </div>
            <button type="submit" className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2">
              <MapPin size={18} /> Find Rides
            </button>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary-900 text-white py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-primary-300">{s.value}</p>
              <p className="text-sm text-primary-200 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Why WayShare?</h2>
          <p className="text-gray-500 text-center mb-10">Everything you need for a safe, comfortable shared journey</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="card text-center hover:shadow-md transition-shadow">
                <div className="bg-primary-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <f.icon size={22} className="text-primary-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Women-Only CTA */}
      <section className="bg-pink-50 border-y border-pink-100 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-4xl mb-4">👩‍🦰</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Women-Only Rides</h2>
          <p className="text-gray-600 mb-6">A dedicated section for female passengers and drivers who want a safer, more comfortable travel experience.</p>
          <Link to="/rides/women-only" className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors">
            Browse Women-Only Rides <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">How It Works</h2>
          <p className="text-gray-500 text-center mb-10">Three simple steps to your next shared journey</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Search', desc: 'Enter your origin, destination, and travel date to discover available rides.' },
              { step: '2', title: 'Book', desc: 'View ride details, check driver reviews, and request or instantly book your seat.' },
              { step: '3', title: 'Travel', desc: 'Confirm with your driver, share the ride, and contribute towards travel costs.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver CTA */}
      {!user?.is_driver && (
        <section className="bg-primary-600 text-white py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">Drive with WayShare</h2>
            <p className="text-primary-100 mb-6">Publish your rides, find passengers on your regular route, and offset your travel costs.</p>
            <Link to={user ? '/driver/register' : '/register'} className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
              {user ? 'Register as Driver' : 'Get Started'} <ChevronRight size={16} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
