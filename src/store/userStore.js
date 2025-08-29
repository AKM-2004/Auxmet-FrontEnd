import { create } from 'zustand';

// Global user store for avatar and basic user data
export const useUserStore = create((set, get) => ({
  user: null,
  avatar: null, // fully-resolved URL (absolute or data:)
  // Commonly needed identity fields
  email: null,
  fullName: null,
  userName: null,

  setUser: (user) => set({ user }),
  setAvatar: (avatarUrl) => set({ avatar: avatarUrl || null }),

  // Update common identity fields and keep `user` in sync
  setProfile: ({ email, fullName, userName } = {}) => {
    const prev = get().user || {};
    // Try to keep multiple shapes in sync for convenience
    const merged = {
      ...prev,
      email: email ?? prev.email,
      FullName: fullName ?? prev.FullName,
      fullName: fullName ?? prev.fullName,
      name: fullName ?? prev.name,
      userName: userName ?? prev.userName,
      username: userName ?? prev.username,
    };
    set({
      user: merged,
      email: email ?? get().email ?? null,
      fullName: fullName ?? get().fullName ?? null,
      userName: userName ?? get().userName ?? null,
    });
  },

  // Optionally compute and set avatar from a user payload
  updateFromUser: (user) => {
    set({ user });
    // Populate common identity fields from various backend shapes
    const name = user?.FullName || user?.fullName || user?.name || null;
    const username = user?.userName || user?.username || null;
    const email = user?.email || null;
    set({
      fullName: name || null,
      userName: username || null,
      email: email || null,
    });
    // Try to pull a reasonable avatar from various backend shapes
    const ud = user?.userData;
    const udSnake = user?.user_data;
    const raw = (
      (typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url) ||
      (ud?.avatar && (typeof ud.avatar === 'string' ? ud.avatar : ud.avatar?.url)) ||
      (udSnake?.avatar && (typeof udSnake.avatar === 'string' ? udSnake.avatar : udSnake.avatar?.url)) ||
      user?.avatarUrl ||
      user?.profileImage ||
      user?.image ||
      user?.photoURL ||
      null
    );

    if (!raw) {
      set({ avatar: null });
      return;
    }
    // Resolve relative paths with backend base
    const isAbsolute = /^(https?:)?\/\//.test(raw) || String(raw).startsWith('data:');
    const base = import.meta.env?.VITE_BACKEND_URL || '';
    const resolved = isAbsolute ? raw : `${base}${raw}`;
    set({ avatar: resolved });
  },
}));

