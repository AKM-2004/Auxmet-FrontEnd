import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

const PostLoginHeader = ({ user }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.DEV ? '/api' : `${import.meta.env.VITE_BACKEND_URL}/api`;
  // Pull global user/avatar. Prop overrides allow page-specific previews.
  const globalUser = useUserStore((s) => s.user);
  const globalAvatar = useUserStore((s) => s.avatar);
  const effectiveUser = user || globalUser;

  const avatarUrl = useMemo(() => {
    // Backend schema: user.avatar is a direct image URL (e.g., Google photo)
    // Also support alternate shapes just in case.
    const ud = effectiveUser?.userData;
    const udSnake = effectiveUser?.user_data;
    return (
      globalAvatar ||
      (typeof effectiveUser?.avatar === 'string' ? effectiveUser.avatar : effectiveUser?.avatar?.url) ||
      (ud?.avatar && (typeof ud.avatar === 'string' ? ud.avatar : ud.avatar?.url)) ||
      (udSnake?.avatar && (typeof udSnake.avatar === 'string' ? udSnake.avatar : udSnake.avatar?.url)) ||
      effectiveUser?.avatarUrl ||
      effectiveUser?.profileImage ||
      effectiveUser?.image ||
      effectiveUser?.photoURL ||
      null
    );
  }, [effectiveUser, globalAvatar]);

  // Prefix relative URLs with backend base
  const resolvedAvatarUrl = useMemo(() => {
    if (!avatarUrl) return null;
    if (/^(https?:)?\/\//.test(avatarUrl) || avatarUrl.startsWith('data:')) return avatarUrl;
    const base = import.meta.env.VITE_BACKEND_URL || '';
    return `${base}${avatarUrl}`;
  }, [avatarUrl]);

  const initials = useMemo(() => {
    const name =
      effectiveUser?.userData?.fullName ||
      effectiveUser?.userData?.FullName ||
      effectiveUser?.user_data?.FullName ||
      effectiveUser?.fullName ||
      effectiveUser?.FullName ||
      effectiveUser?.name ||
      effectiveUser?.userName ||
      '';
    return name ? name.trim().charAt(0).toUpperCase() : '';
  }, [effectiveUser]);

  // Always provide an image in the ring. If no explicit avatar is present,
  // generate a green-on-black initials avatar via DiceBear.
  const computedAvatarSrc = useMemo(() => {
    if (resolvedAvatarUrl) return resolvedAvatarUrl;
    const seedName = (
      user?.userData?.fullName ||
      user?.userData?.FullName ||
      user?.user_data?.FullName ||
      user?.fullName ||
      user?.FullName ||
      user?.name ||
      user?.userName ||
      'User'
    ).trim();
    const seed = encodeURIComponent(seedName || 'User');
    // DiceBear initials style with AUXMET theme colors
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=000000&textColor=00ff88&fontSize=50`;
  }, [resolvedAvatarUrl, effectiveUser]);

  const handleLogout = async () => {
    try {
      const res = await axios.post(`${API_BASE}/v1/user/logout`, {}, {
        withCredentials: true,
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) {
        navigate('/', { replace: true });
      } else {
        // Still navigate home; optionally notify
        navigate('/', { replace: true });
      }
    } catch (e) {
      navigate('/', { replace: true });
    }
  };

  const navLinks = [
    { name: 'Home', path: '/dashboard' },
    { name: 'Interview', path: '/interview' },
    { name: 'History', path: '/history' },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-green-500/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center">
            <motion.div whileHover={{ scale: 1.05 }} className="text-2xl font-bold text-white">
              <span className="text-white">AUX</span>
              <span className="text-white">MET</span>
            </motion.div>
          </Link>

          <div className="flex items-center space-x-8">
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path}>
                  <motion.div
                    whileHover={{ scale: 1.1, color: '#00ff88' }}
                    whileTap={{ scale: 0.95 }}
                    className="text-gray-300 transition-colors duration-200 font-medium"
                  >
                    {link.name}
                  </motion.div>
                </Link>
              ))}
            </nav>

            {/* Profile Dropdown */}
            <div className="relative">
              <motion.div
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-10 h-10 rounded-full bg-green-800 border-2 border-green-500 flex items-center justify-center overflow-hidden">
                  <img
                    src={computedAvatarSrc}
                    alt={initials ? `Avatar of ${effectiveUser?.fullName || effectiveUser?.name || effectiveUser?.userName}` : 'User Avatar'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback to initials avatar if provided URL fails
                      const seedName = (effectiveUser?.fullName || effectiveUser?.name || effectiveUser?.userName || 'User').trim();
                      const seed = encodeURIComponent(seedName || 'User');
                      e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=000000&textColor=00ff88&fontSize=50`;
                    }}
                  />
                </div>
                <ChevronDown className={`text-gray-300 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </motion.div>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-md shadow-lg border border-green-500/30"
                  >
                    <div className="py-1">
                      <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-green-800/50 hover:text-green-300">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-green-800/50 hover:text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default PostLoginHeader;
