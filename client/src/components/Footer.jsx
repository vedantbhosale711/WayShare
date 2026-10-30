import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-white text-lg mb-3">
              <div className="bg-primary-600 text-white p-1.5 rounded-lg"><Car size={18} /></div>
              WayShare
            </div>
            <p className="text-sm">India's trusted carpool platform. Share rides, share costs, reduce traffic.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">For Passengers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/rides/search" className="hover:text-white transition-colors">Find Rides</Link></li>
              <li><Link to="/rides/women-only" className="hover:text-white transition-colors">Women-Only Rides</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">My Bookings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">For Drivers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/driver/register" className="hover:text-white transition-colors">Become a Driver</Link></li>
              <li><Link to="/driver/dashboard" className="hover:text-white transition-colors">Driver Dashboard</Link></li>
              <li><Link to="/rides/create" className="hover:text-white transition-colors">Publish a Ride</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/support" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Report an Issue</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-center">
          © {new Date().getFullYear()} WayShare. Made with ♥ in India. Demo project.
        </div>
      </div>
    </footer>
  );
}
