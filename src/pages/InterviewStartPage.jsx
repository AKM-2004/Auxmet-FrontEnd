import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Briefcase,
  Play,
  RefreshCw,
  Edit3,
  ArrowRight,
  Zap,
  Brain,
  Target,
  Sparkles,
  Clock,
  Shield,
  Cpu
} from 'lucide-react';
import PostLoginHeader from '../components/PostLoginHeader';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

const InterviewStartPage = () => {
  const [interviewName, setInterviewName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  // Global user info
  const fullName = useUserStore((s) => s.fullName) || '--';
  const email = useUserStore((s) => s.email) || '--';
  const role = '--';

  // On open: fetch user and populate store
  useEffect(() => {
    let cancelled = false;
    const API_BASE = import.meta.env.DEV ? '/api' : `${import.meta.env.VITE_BACKEND_URL}/api`;
    const updateFromUser = useUserStore.getState().updateFromUser;
    const setProfile = useUserStore.getState().setProfile;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/v1/user/current-user`, {
          withCredentials: true,
          validateStatus: () => true,
        });
        if (!cancelled && res.status >= 200 && res.status < 300) {
          const user = res.data?.data ?? res.data?.user ?? res.data ?? null;
          if (user) {
            updateFromUser?.(user);
            const name = user?.FullName || user?.fullName || user?.name || null;
            const username = user?.userName || user?.username || null;
            const email = user?.email || null;
            setProfile?.({ fullName: name || undefined, userName: username || undefined, email: email || undefined });
          }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // On open: check if resume already exists and update UI accordingly
  useEffect(() => {
    let cancelled = false;
    const API_BASE = import.meta.env.DEV ? '/api' : `${import.meta.env.VITE_BACKEND_URL}/api`;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/v1/interview/isResume`, {
          withCredentials: true,
          validateStatus: () => true,
        });
        if (!cancelled && res.status >= 200 && res.status < 300) {
          const exists = res.data?.data ?? res.data?.exists ?? res.data ?? false;
          if (exists === true) {
            // Show success card without triggering analysis
            setUploadedFile({
              name: 'Existing resume on file',
              size: 0,
              type: 'application/pdf',
              uploadDate: null,
            });
            setIsUploading(false);
            setIsAnalyzing(false);
            setAnalysisComplete(false);
          }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFileUpload = async (file) => {
    setFileError('');
    setIsUploading(true);

    // File validation
    const allowedTypes = ['application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const isPdf = allowedTypes.includes(file.type) || /\.pdf$/i.test(file.name || '');
    if (!isPdf) {
      setFileError('Please upload a PDF file');
      setIsUploading(false);
      return;
    }

    if (file.size > maxSize) {
      setFileError('File size must be less than 5MB');
      setIsUploading(false);
      return;
    }

    // Real upload to backend with spinner until response
    const BOT_BACKEND = import.meta.env.VITE_BOTBACKENDURL || process.env.BOTBACKENDURL;
    if (!BOT_BACKEND) {
      setFileError('Upload server is not configured');
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('PdfFile', file);

    try {
      const res = await axios.post(`${BOT_BACKEND}/api/v1/interview/upload-file`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 300) {
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toISOString()
        });
        setFileError('');
        // Optional: trigger analysis based on backend response if needed
        setIsAnalyzing(false);
        setAnalysisComplete(false);
      } else {
        const msg = res.data?.message || res.data?.error || 'Failed to upload resume';
        setFileError(msg);
      }
    } catch (e) {
      setFileError('Network error while uploading');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateFile = () => {
    setUploadedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFormValid = interviewName.trim() && uploadedFile && !fileError;

  const startInterview = async () => {
    if (isFormValid) {
      setIsStartingInterview(true);
      try {
        // Call the interview session API
        const BOT_BACKEND = import.meta.env.VITE_BOTBACKENDURL || process.env.BOTBACKENDURL;
        if (!BOT_BACKEND) {
          alert('Backend server is not configured');
          setIsStartingInterview(false);
          return;
        }

        const response = await axios.post(`${BOT_BACKEND}/api/v1/interview/interview-session`, { interviewName }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        });

        if (response.status >= 200 && response.status < 300) {
          // Successfully started interview session
          console.log('Interview session started successfully');
          // Navigate to interview session
          navigate('/interview-session');
        } else {
          const msg = response.data?.message || response.data?.error || 'Failed to start interview session';
          alert(msg);
          setIsStartingInterview(false);
        }
      } catch (error) {
        console.error('Error starting interview session:', error);
        alert('Network error while starting interview session');
        setIsStartingInterview(false);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Floating particles animation
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const newParticles = [...Array(15)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Enhanced Futuristic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-black to-green-400/5"></div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full" 
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(34, 255, 68, 0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(34, 255, 68, 0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '60px 60px',
                 animation: 'gridMove 20s linear infinite'
               }}>
          </div>
        </div>
        
        {/* Floating Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-green-400 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-green-400/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <PostLoginHeader />
      
      <main className="relative z-10 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 relative"
          >
            {/* Floating Icons */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex space-x-4 opacity-40"
              >
                <Brain className="w-6 h-6 text-green-400" />
                <Zap className="w-6 h-6 text-green-400" />
                <Target className="w-6 h-6 text-green-400" />
              </motion.div>
            </div>
            
            <motion.h1 
              className="text-5xl font-bold mb-4 relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-green-400 to-green-500">
                AI Interview
              </span>
              <br />
              <span className="text-3xl text-gray-300 font-normal">
                Preparation Portal
              </span>
              
              {/* Glowing Effect */}
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-green-600/20 via-transparent to-green-600/20 rounded-lg blur-xl"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.h1>
            
            <motion.p 
              className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Experience the future of interview preparation with our advanced AI system. 
              Get personalized questions, real-time feedback, and detailed performance analytics.
            </motion.p>
            
            {/* Feature Pills */}
            <motion.div 
              className="flex flex-wrap justify-center gap-3 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {[
                { icon: Cpu, text: 'AI-Powered' },
                { icon: Shield, text: 'Secure' },
                { icon: Clock, text: '25min Sessions' },
                { icon: Sparkles, text: 'Personalized' }
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  className="flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 text-sm"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(34, 255, 68, 0.15)' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <item.icon className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* User Information Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gray-900/70 backdrop-blur-sm rounded-xl border border-green-500/20 p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-green-400 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              User Information
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: User, label: 'Name', value: fullName },
                { icon: Mail, label: 'Email', value: email },
                { icon: Briefcase, label: 'Role', value: role }
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/30"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <item.icon className="text-green-400 w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                    <p className="font-medium text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Interview Setup Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-gray-900/70 backdrop-blur-sm rounded-xl border border-green-500/20 p-8"
          >
            {/* Interview Name Input */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-green-400 mb-3">
                Interview Session Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={interviewName}
                  onChange={(e) => setInterviewName(e.target.value)}
                  placeholder="e.g., Frontend Developer Interview - Round 1"
                  className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all duration-300"
                />
                {interviewName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                )}
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-green-400 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Resume/CV
              </label>
              
              {!uploadedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
                    dragActive 
                      ? 'border-green-400 bg-green-500/10' 
                      : 'border-gray-600/50 hover:border-green-500/60 hover:bg-green-500/5'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="application/pdf,.pdf"
                    className="hidden"
                  />
                  
                  <AnimatePresence>
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-400/30 border-t-green-400 flex items-center justify-center mb-4 animate-spin">
                          <RefreshCw className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-green-400 font-medium">
                          Uploading your resume...
                        </p>
                        <p className="text-gray-400 text-sm mt-1">Please wait while we process your file</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Drop your resume here
                        </h3>
                        <p className="text-gray-300 mb-4">
                          or Click to Upload
                        </p>
                        <div className="flex items-center space-x-3 text-sm text-gray-400">
                          <span className="px-2 py-1 bg-gray-700/50 rounded">PDF</span>
                          <span className="text-green-400">• Max 5MB</span>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-500/10 to-green-400/5 border border-green-500/40 rounded-xl p-6 text-center relative overflow-hidden">
                  {/* Success Animation Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-transparent to-green-600/10 animate-pulse"></div>
                  
                  <div className="relative z-10">
                    <motion.div 
                      className="w-16 h-16 mx-auto rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mb-4"
                      animate={{
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(34, 255, 68, 0.4)',
                          '0 0 20px 5px rgba(34, 255, 68, 0.2)',
                          '0 0 0 0 rgba(34, 255, 68, 0.4)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </motion.div>
                    
                    <h4 className="font-semibold text-green-400 text-lg mb-2">
                      Resume Uploaded Successfully
                    </h4>
                    
                    <p className="text-gray-400 mb-4">
                      {uploadedFile.name} • {formatFileSize(uploadedFile.size)}
                    </p>
                    
                    {/* AI Analysis Status */}
                    <AnimatePresence>
                      {isAnalyzing && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Brain className="w-5 h-5 text-blue-400" />
                            </motion.div>
                            <span className="text-blue-400 text-sm font-medium">AI is analyzing your resume...</span>
                          </div>
                        </motion.div>
                      )}
                      
                      {analysisComplete && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <Sparkles className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">Analysis Complete - Personalized questions ready!</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <button
                      onClick={updateFile}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-600/50 hover:border-green-400/30 transition-all duration-300"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Update Resume</span>
                    </button>
                  </div>
                </div>
              )}

              {fileError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center space-x-2 text-red-400"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{fileError}</span>
                </motion.div>
              )}
            </div>

            {/* Start Interview Button */}
            <div className="pt-4">
              <motion.button
                onClick={startInterview}
                disabled={!isFormValid || isStartingInterview}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden ${
                  isFormValid && !isStartingInterview
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-lg hover:shadow-2xl border border-green-500/50'
                    : 'bg-gray-800/60 text-gray-500 cursor-not-allowed border border-gray-700/50'
                }`}
                whileHover={isFormValid && !isStartingInterview ? { scale: 1.02, y: -2 } : {}}
                whileTap={isFormValid && !isStartingInterview ? { scale: 0.98 } : {}}
              >
                {/* Animated Background for Active State */}
                {isFormValid && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                )}
                
                <div className="relative z-10 flex items-center space-x-3">
                  {isStartingInterview ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </motion.div>
                      <span>Starting Interview Session...</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={isFormValid ? {
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Play className="w-5 h-5" />
                      </motion.div>
                      <span>Launch AI Interview Session</span>
                      <motion.div
                        animate={isFormValid ? { x: [0, 5, 0] } : {}}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.button>

              {!isFormValid && (
                <div className="text-center mt-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400">
                      Complete the form above to start your interview
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default InterviewStartPage;
