import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Clock, 
  Calendar, 
  ChevronRight,
  Search,
  Filter,
  Download,
  TrendingUp,
  Award,
  Target,
  Activity,
  BarChart3,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PostLoginHeader from '../components/PostLoginHeader';
import { useUserStore } from '../store/userStore';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // On open: fetch user and populate store, then fetch history
  useEffect(() => {
    let cancelled = false;
    const API_BASE = import.meta.env.DEV ? '/api' : `${import.meta.env.VITE_BACKEND_URL}/api`;
    const updateFromUser = useUserStore.getState().updateFromUser;
    const setProfile = useUserStore.getState().setProfile;

    (async () => {
      try {
        // Fetch current user
        const userRes = await axios.get(`${API_BASE}/v1/user/current-user`, {
          withCredentials: true,
          validateStatus: () => true,
        });
        if (!cancelled && userRes.status >= 200 && userRes.status < 300) {
          const user = userRes.data?.data ?? userRes.data?.user ?? userRes.data ?? null;
          if (user) {
            updateFromUser?.(user);
            const name = user?.FullName || user?.fullName || user?.name || null;
            const username = user?.userName || user?.username || null;
            const email = user?.email || null;
            setProfile?.({ fullName: name || undefined, userName: username || undefined, email: email || undefined });
          }
        }

        // Fetch history
        const histRes = await axios.get(`${API_BASE}/v1/interview/history`, {
          withCredentials: true,
          validateStatus: () => true,
        });
        if (!cancelled) {
          if (histRes.status >= 200 && histRes.status < 300) {
            const list = histRes.data?.data ?? histRes.data?.history ?? histRes.data ?? [];
            // Normalize items
            const normalized = Array.isArray(list) ? list.map((item) => ({
              id: item?._id || item?.id,
              interviewName: item?.interviewName || 'Untitled Interview',
              createdAt: item?.createdAt || item?.createdAT || item?.date || new Date().toISOString(),
              Status: item?.Status || item?.status || 'Active',
              recordAudio: item?.recordAudio ?? false,
              recordVideo: item?.recordVideo ?? false,
              resume: item?.resume || null,
              result: item?.result || null,
            })) : [];
            setInterviews(normalized);
            setError('');
          } else {
            setError(histRes.data?.message || 'Failed to load history');
            setInterviews([]);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError('Network error while loading history');
          setInterviews([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Sort interviews by date (newest first)
  const sortedInterviews = [...interviews]
    .filter((it) => filterStatus === 'all' || (it.Status || '').toLowerCase() === filterStatus)
    .filter((it) => !searchTerm || (it.interviewName || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      // hour: '2-digit',
      // minute: '2-digit',
      // second: '2-digit',
      // hour12: true
    });
  };

  const handleInterviewClick = (interviewId) => {
    navigate(`/result/${interviewId}`);
  };

  const startInterview = () => {
    navigate('/interview');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-black to-green-400/5"></div>
      
      <PostLoginHeader />
      
      <main className="relative z-10 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-500 mb-2">
              Interview History
            </h1>
            <p className="text-gray-400">
              Your completed interview sessions
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          )}

          {/* Interview List */}
          {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-4"
          >
            {sortedInterviews.map((interview, index) => (
              <motion.div
                key={interview.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                onClick={() => handleInterviewClick(interview.id)}
                className="bg-gradient-to-r from-gray-900/90 to-gray-800/50 backdrop-blur-sm rounded-lg border border-green-500/20 p-4 group hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  {/* Left Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors duration-300 mb-1">
                      {interview.interviewName}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Calendar className="w-4 h-4 text-green-500/50" />
                      <span>{formatDateTime(interview.createdAt)}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs border border-green-500/30 bg-green-500/10 text-green-400">{interview.Status}</span>
                      {interview.recordAudio && <span className="px-2 py-0.5 rounded-full text-xs border border-gray-600/40 bg-gray-700/30 text-gray-300">Audio</span>}
                      {interview.recordVideo && <span className="px-2 py-0.5 rounded-full text-xs border border-gray-600/40 bg-gray-700/30 text-gray-300">Video</span>}
                    </div>
                  </div>

                  {/* Right Arrow Button */}
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 group-hover:bg-green-500/20 group-hover:border-green-400/50 transition-all duration-300"
                  >
                    <ChevronRight className="w-5 h-5 text-green-400" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          )}

          {/* Empty State */}
          {!loading && sortedInterviews.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800/50 border border-gray-700/50 flex items-center justify-center">
                <Target className="w-12 h-12 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">NOT Participated in the interview till NOW</h3>
              <p className="text-gray-500 mb-6">Start your first interview to see your history here</p>
              <button
                onClick={startInterview}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white border border-green-500/40 transition-all duration-300"
              >
                <ChevronRight className="w-4 h-4" />
                <span>Start Interview</span>
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
