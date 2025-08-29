import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PostLoginHeader from "../components/PostLoginHeader";
import { ArrowRight } from "lucide-react";
import BenefitsSection from "../components/BenefitsSection";
import Footer from "../components/Footer";
import { useUserStore } from "../store/userStore";
// import VoiceUI from "../components/VoiceUI";

const PostLoginPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const updateFromUser = useUserStore((s) => s.updateFromUser);
  const setUser = useUserStore((s) => s.setUser);
  const setAvatar = useUserStore((s) => s.setAvatar);
  const API_BASE = import.meta.env.DEV
    ? "/api"
    : `${import.meta.env.VITE_BACKEND_URL}/api`;

  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      try {
        const res = await axios.get(`${API_BASE}/v1/user/current-user`, {
          withCredentials: true,
          validateStatus: () => true,
        });
        if (!cancelled && res.status >= 200 && res.status < 300) {
          const payload = res.data?.data ?? res.data?.user ?? res.data ?? null;
          setCurrentUser(payload);
          updateFromUser?.(payload);
        }
      } catch (e) {
        // silently ignore; header will show default avatar
        if (!cancelled) {
          setCurrentUser(null);
          setUser?.(null);
          setAvatar?.(null);
        }
      }
    };
    loadUser();
    return () => {
      cancelled = true;
    };
  }, [API_BASE]);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <PostLoginHeader user={currentUser} />
      <main className="pt-16">
        {/* Hero Section */}
        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="absolute inset-0 bg-grid-green-500/10 bg-grid-18 [mask-image:linear-gradient(to_bottom,white_0%,transparent_100%)]"></div>
          <div className="container mx-auto px-4 z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Side: Placeholder for future content */}
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="h-[400px] md:h-[500px] flex items-center justify-center"
              >
                {/* Voice UI Component */}
                <div className="relative w-64 h-64">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/20 to-green-600/20 blur-xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-8 rounded-full bg-black border-2 border-green-400/50 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-green-400 text-6xl font-bold">AI</div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Right Side: Marketing Text */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                className="text-center md:text-left"
              >
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50 mb-6">
                  Unlock Your Interview Potential with{" "}
                  <span className="text-green-400">AI</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl mx-auto md:mx-0">
                  Practice, get instant feedback, and master your responses.
                  AUXMET is your personal interview coach, available 24/7.
                </p>
                <Link to="/interview">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-green-500 text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition-all duration-300 flex items-center justify-center mx-auto md:mx-0 space-x-2"
                  >
                    <span>Start a Session</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
        <BenefitsSection />
        <Footer />
      </main>
    </div>
  );
};

export default PostLoginPage;
