import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Shield, Edit, Camera, Calendar, Award, Activity } from 'lucide-react';
import PostLoginHeader from '../components/PostLoginHeader';
import EditProfileModal from '../components/EditProfileModal';
import { useUserStore } from '../store/userStore';

const ProfilePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    username: '',
    email: '',
    address: '',
    avatarUrl: '',
    coverUrl: '',
    joinDate: '--',
    interviewsCompleted: 0,
    successRate: "--"
  });
  const API_BASE = import.meta.env.DEV ? '/api' : `${import.meta.env.VITE_BACKEND_URL}/api`;
  const backendBase = import.meta.env.VITE_BACKEND_URL || '';
  const globalAvatar = useUserStore((s) => s.avatar);
  const updateFromUser = useUserStore((s) => s.updateFromUser);
  const setProfile = useUserStore((s) => s.setProfile);

  // Fetch current user and interview count
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/v1/user/current-user`, {
          withCredentials: true,
          validateStatus: () => true,
        });
        if (!cancelled && res.status >= 200 && res.status < 300) {
          const user = res.data?.data ?? res.data?.user ?? res.data ?? null;
          if (user) {
            updateFromUser?.(user);
            const createdAt = user?.createdAt || user?.created_at;
            const cover = user?.coverImage || user?.cover_url || user?.cover;
            const name = user?.FullName || user?.fullName || user?.name || '';
            const username = user?.userName || user?.username || '';
            const email = user?.email || '';
            // Push identity to global store
            setProfile?.({ fullName: name, userName: username, email });
            const joinDate = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '--';
            const resolvedCover = cover ? (/^(https?:)?\/\//.test(cover) || String(cover).startsWith('data:') ? cover : `${backendBase}${cover}`) : '';
            setUserData((prev) => ({
              ...prev,
              name,
              username,
              email,
              joinDate,
              coverUrl: resolvedCover || prev.coverUrl,
            }));
          }
        }
      } catch {}

      try {
        const r2 = await axios.get(`${API_BASE}/v1/interview/totalInterview`, {
          withCredentials: true,
          validateStatus: () => true,
        });
        if (!cancelled && r2.status >= 200 && r2.status < 300) {
          const total = r2.data?.total ?? r2.data?.count ?? r2.data ?? 0;
          setUserData((prev) => ({ ...prev, interviewsCompleted: Number(total) || 0 }));
        }
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [API_BASE, backendBase, updateFromUser, setProfile]);

  // Generate default avatar with initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle avatar upload -> POST multipart to /v1/user/update-avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate image type and size (max 5MB)
    const isImage = file.type.startsWith('image/');
    const maxSize = 5 * 1024 * 1024;
    if (!isImage) {
      alert('Please select a valid image file.');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }
    if (file.size > maxSize) {
      alert('Image must be less than 5MB.');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }
    const form = new FormData();
    form.append('avatar', file);
    try {
      setAvatarUploading(true);
      const res = await axios.patch(`${API_BASE}/v1/user/update-avatar`, form, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) {
        // Try to refresh user data for accurate avatar URL
        try {
          const rr = await axios.get(`${API_BASE}/v1/user/current-user`, { withCredentials: true, validateStatus: () => true });
          const u = rr.data?.data ?? rr.data?.user ?? rr.data ?? null;
          if (u) {
            updateFromUser?.(u);
          }
        } catch {}
      } else {
        // Backend rejected; reset input to avoid stale file
        if (avatarInputRef.current) avatarInputRef.current.value = '';
      }
    } catch {
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle cover upload -> POST multipart to /v1/user/update-cover
  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate image type and size (max 8MB for cover)
    const isImage = file.type.startsWith('image/');
    const maxSize = 8 * 1024 * 1024;
    if (!isImage) {
      alert('Please select a valid image file for cover.');
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }
    if (file.size > maxSize) {
      alert('Cover image must be less than 8MB.');
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }
    const form = new FormData();
    form.append('cover', file);
    try {
      setCoverUploading(true);
      const res = await axios.patch(`${API_BASE}/v1/user/update-cover`, form, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) {
        // Update cover preview (from response or re-fetch)
        const cover = res.data?.data?.coverImage || res.data?.coverImage || null;
        if (cover) {
          const resolved = /^(https?:)?\/\//.test(cover) || String(cover).startsWith('data:') ? cover : `${backendBase}${cover}`;
          setUserData((prev) => ({ ...prev, coverUrl: resolved }));
        } else {
          try {
            const rr = await axios.get(`${API_BASE}/v1/user/current-user`, { withCredentials: true, validateStatus: () => true });
            const u = rr.data?.data ?? rr.data?.user ?? rr.data ?? null;
            if (u?.coverImage) {
              const resolved = /^(https?:)?\/\//.test(u.coverImage) ? u.coverImage : `${backendBase}${u.coverImage}`;
              setUserData((prev) => ({ ...prev, coverUrl: resolved }));
            }
          } catch {}
        }
      } else {
        if (coverInputRef.current) coverInputRef.current.value = '';
      }
    } catch {
      if (coverInputRef.current) coverInputRef.current.value = '';
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <PostLoginHeader />
      <div className="pt-20">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Hidden file inputs */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />

          {/* Cover Photo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="h-72 rounded-xl bg-cover bg-center relative overflow-hidden group"
            style={{ 
              backgroundImage: userData.coverUrl 
                ? `url(${userData.coverUrl})` 
                : 'linear-gradient(135deg, #065f46 0%, #064e3b 50%, #022c22 100%)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600/80 transition-all duration-300 border border-green-500/50 flex items-center space-x-2 group-hover:bg-green-600/60"
            >
              <Camera className="w-4 h-4" />
              <span>Change Cover</span>
            </motion.button>
            {coverUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
              </div>
            )}
          </motion.div>

          {/* Profile Header with Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-20 ml-4 sm:ml-8 relative z-10">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5, type: 'spring', stiffness: 120 }}
              className="relative group"
            >
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-black bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center overflow-hidden shadow-2xl">
                {globalAvatar ? (
                  <img 
                    src={globalAvatar} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl font-bold text-white">
                      {getInitials(userData.name || '')}
                    </span>
                  </div>
                )}
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin bg-black/20" />
                </div>
              )}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-green-600 p-3 rounded-full hover:bg-green-500 transition-all duration-300 border-2 border-black shadow-lg group-hover:scale-110"
              >
                <Camera className="w-5 h-5 text-white" />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="ml-0 sm:ml-6 mt-4 sm:mt-0 mb-4"
            >
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">{userData.name || '--'}</h1>
              <p className="text-lg text-green-400 font-medium">@{userData.username || '--'}</p>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8"
          >
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-md border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Member Since</p>
                  <p className="text-white font-bold text-lg">{userData.joinDate}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-md border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <Award className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Interviews</p>
                  <p className="text-white font-bold text-lg">{userData.interviewsCompleted}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-md border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                  <p className="text-white font-bold text-lg">{userData.successRate}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="mt-8 bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-md border border-green-500/20 rounded-xl p-8 hover:border-green-500/30 transition-all duration-300"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-green-400">Profile Information</h2>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-500 hover:to-green-600 transition-all duration-300 flex items-center space-x-2 shadow-lg"
              >
                <Edit className="w-5 h-5" />
                <span>Edit Profile</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-4 p-4 bg-black/30 rounded-lg border border-green-500/10 hover:border-green-500/30 transition-all duration-300"
              >
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Mail className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <span className="text-white font-medium">{userData.email || '--'}</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-4 p-4 bg-black/30 rounded-lg border border-green-500/10 hover:border-green-500/30 transition-all duration-300"
              >
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Username</p>
                  <span className="text-white font-medium">@{userData.username || '--'}</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-4 p-4 bg-black/30 rounded-lg border border-green-500/10 hover:border-green-500/30 transition-all duration-300"
              >
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <User className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Full Name</p>
                  <span className="text-white font-medium">{userData.name || '--'}</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-4 p-4 bg-black/30 rounded-lg border border-green-500/10 hover:border-green-500/30 transition-all duration-300"
              >
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <MapPin className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Location</p>
                  <span className="text-white font-medium">{userData.address}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      <EditProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={{
          name: userData.name,
          username: userData.username,
          email: userData.email,
        }}
        onSave={async ({ fullName, userName, email }) => {
          try {
            const res = await axios.patch(`${API_BASE}/v1/user/update-account`, { userName, fullName, email }, {
              withCredentials: true,
              validateStatus: () => true,
            });
            if (res.status === 401) {
              alert('Username or email already exists. Please change it.');
              return;
            }
            if (res.status >= 200 && res.status < 300) {
              // Update global store
              setProfile?.({ fullName, userName, email });
              // Optionally refresh full user payload to keep avatar etc. in sync
              try {
                const rr = await axios.get(`${API_BASE}/v1/user/current-user`, { withCredentials: true, validateStatus: () => true });
                const u = rr.data?.data ?? rr.data?.user ?? rr.data ?? null;
                if (u) updateFromUser?.(u);
              } catch {}
              // Update local UI state
              setUserData((prev) => ({
                ...prev,
                name: fullName || prev.name,
                username: userName || prev.username,
                email: email || prev.email,
              }));
              setIsModalOpen(false);
              return;
            }
          } catch {}
        }}
      />
    </div>
  );
};

export default ProfilePage;
