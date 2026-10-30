import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useState, useEffect } from 'react';
import { notificationApi } from '../api/index.js';
import {
  Car, Menu, X, Bell, User, LogOut, ChevronDown,
  Search, Plus, Clipboard, Truck, Home, Shield,
  Heart, MapPin
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      notificationApi.unreadCount().then(r => setUnreadCount(r.data.count)).catch(() => {});
    }
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const navLink = (to, label, Icon) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
      }`}
    >
      {Icon && <Icon size={16} />}
      {label}
    </Link>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
            <div className="bg-primary-600 text-white p-1.5 rounded-lg">
              <Car size={20} />
            </div>
            WayShare
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLink('/', 'Home', Home)}
            {navLink('/rides/search', 'Find Rides', Search)}
            {navLink('/rides/women-only', 'Women-Only', Shield)}

            {user && user.is_driver && navLink('/driver/dashboard', 'Driver', Truck)}
            {user && !user.is_driver && navLink('/dashboard', 'Dashboard', Home)}
            {user && navLink('/bookings', 'My Bookings', Clipboard)}
            {user && user.role === 'admin' && navLink('/admin', 'Admin', Shield)}
          </div>

          {/* Right section */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary-700">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            ) : (
              <>
                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                      {user.profile_picture ? (
                        <img src={`http://localhost:5000${user.profile_picture}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} className="text-primary-700" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-24 truncate">{user.full_name.split(' ')[0]}</span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User size={14} /> Profile
                      </Link>
                      <Link to="/notifications" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Bell size={14} /> Notifications {unreadCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5">{unreadCount}</span>}
                      </Link>
                      {!user.is_driver && (
                        <Link to="/driver/register" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Car size={14} /> Become a Driver
                        </Link>
                      )}
                      {user.is_driver && (
                        <Link to="/vehicles" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Truck size={14} /> My Vehicles
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLink('/', 'Home', Home)}
          {navLink('/rides/search', 'Find Rides', Search)}
          {navLink('/rides/women-only', 'Women-Only Rides', Shield)}
          {user && navLink('/dashboard', 'Dashboard', Home)}
          {user && user.is_driver && navLink('/driver/dashboard', 'Driver Dashboard', Truck)}
          {user && navLink('/notifications', `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`, Bell)}
          {user && navLink('/profile', 'Profile', User)}
          {user && user.role === 'admin' && navLink('/admin', 'Admin', Shield)}
          {!user ? (
            <div className="pt-2 flex gap-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 btn-secondary text-center text-sm">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 btn-primary text-center text-sm">Register</Link>
            </div>
          ) : (
            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600">
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
