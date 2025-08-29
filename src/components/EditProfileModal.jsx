import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const EditProfileModal = ({ isOpen, onClose, user, onSave }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-gray-900 border border-green-500/30 rounded-lg shadow-xl w-full max-w-lg p-8 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold text-green-400 mb-6">Edit Profile</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const fullName = fd.get('fullName')?.toString().trim() || '';
              const userName = fd.get('userName')?.toString().trim() || '';
              const email = fd.get('email')?.toString().trim() || '';
              onSave && onSave({ fullName, userName, email });
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input name="fullName" type="text" defaultValue={user.name} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input name="userName" type="text" defaultValue={user.username} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input name="email" type="email" defaultValue={user.email} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
              <input type="text" defaultValue={user.address} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div className="flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="px-6 py-2 rounded-full font-semibold text-gray-300 hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition-all duration-300 border-2 border-red-800/50"
              >
                Save Changes
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
