import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Zap, Target, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function HeroSection() {
  const navigate = useNavigate()
  const floatingIcons = [
    { Icon: Brain, delay: 0, x: -100, y: -50 },
    { Icon: Zap, delay: 0.5, x: 100, y: -30 },
    { Icon: Target, delay: 1, x: -80, y: 50 },
  ]

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center px-4">
      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 0.6, 
            scale: 1,
            x: [x, x + 20, x],
            y: [y, y - 20, y]
          }}
          transition={{
            opacity: { delay, duration: 1 },
            scale: { delay, duration: 0.5 },
            x: { delay: delay + 1, duration: 4, repeat: Infinity, ease: "easeInOut" },
            y: { delay: delay + 1, duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute hidden lg:block"
          style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
        >
          <Icon size={40} className="text-green-400" />
        </motion.div>
      ))}

      <div className="text-center z-10 max-w-4xl mx-auto">
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-6xl md:text-8xl font-black mb-4">
            <span className="text-white">AUX</span>
            <span className="text-white">MET</span>
          </h1>
        </motion.div>

        {/* AI Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-green-400 mb-4">
            AI Interview Platform
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Master your interview skills with our advanced AI-powered platform. 
            Practice, learn, and succeed with personalized feedback.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <motion.button
            whileHover={{ 
              scale: 1.05,
              background: "linear-gradient(135deg,rgb(169, 226, 62),rgb(11, 245, 58))"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-green-500 to-accent-light text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300"
          >
            Start Interview Practice
          </motion.button>
          
          <motion.button
            whileHover={{ 
              scale: 1.05,
              borderColor: "#22ff44",
              color: "#22ff44"
            }}
            whileTap={{ scale: 0.95 }}
            className="border-2 border-green-400 text-green-400 px-8 py-4 rounded-full font-bold text-lg hover:bg-green-400/10 transition-all duration-300"
          >
            Learn More
          </motion.button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="flex flex-col items-center"
        >
          <p className="text-gray-400 mb-2">Discover More</p>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="text-green-400" size={24} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
