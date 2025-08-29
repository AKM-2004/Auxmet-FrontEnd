import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Target, Zap, Shield, Users, Trophy, Clock, BarChart } from 'lucide-react'

export default function BenefitsSection() {
  const benefits = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI analyzes your responses and provides detailed feedback on communication skills, technical knowledge, and interview performance."
    },
    {
      icon: Target,
      title: "Personalized Practice",
      description: "Tailored interview questions based on your industry, role, and experience level for maximum relevance and impact."
    },
    {
      icon: Zap,
      title: "Real-time Feedback",
      description: "Instant analysis of your answers with suggestions for improvement, helping you learn and adapt quickly."
    },
    {
      icon: Shield,
      title: "Confidence Building",
      description: "Practice in a safe, judgment-free environment that builds your confidence for real interview situations."
    },
    {
      icon: Users,
      title: "Industry Experts",
      description: "Questions and scenarios designed by industry professionals and hiring managers from top companies."
    },
    {
      icon: Trophy,
      title: "Performance Tracking",
      description: "Track your progress over time with detailed analytics and performance metrics to see your improvement."
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Practice anytime, anywhere with our always-available AI interview coach that fits your schedule."
    },
    {
      icon: BarChart,
      title: "Success Analytics",
      description: "Comprehensive reports showing your strengths, areas for improvement, and readiness for real interviews."
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-white">Why Choose </span>
            <span className="text-accent-light">AUXMET?</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the future of interview preparation with our cutting-edge AI technology 
            designed to help you succeed in your career journey.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(34, 255, 68, 0.2)"
              }}
              className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:border-green-400/50 transition-all duration-300 group"
            >
              <div className="mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-accent-light rounded-lg flex items-center justify-center mb-4 group-hover:animate-pulse">
                  <benefit.icon className="text-black" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                  {benefit.title}
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ 
              scale: 1.05
            }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-green-500 to-accent-light text-black px-10 py-4 rounded-full font-bold text-lg transition-all duration-300"
          >
            Get Started Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
