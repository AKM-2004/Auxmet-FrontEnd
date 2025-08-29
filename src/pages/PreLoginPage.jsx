import React from 'react'
import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import BenefitsSection from '../components/BenefitsSection'
import Footer from '../components/Footer'
import { LazyFuturisticBackground } from '../components/LazyThreeBackground'

export default function PreLoginPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Enhanced Three.js Background */}
      <LazyFuturisticBackground />
      
      {/* Matrix Rain Effect Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent"></div>
        {/* Scanning Lines */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent animate-data-flow" style={{top: '20%'}}></div>
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent animate-data-flow" style={{top: '60%', animationDelay: '2s'}}></div>
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-400/25 to-transparent animate-data-flow" style={{top: '80%', animationDelay: '4s'}}></div>
        </div>
        
        {/* Corner Holographic Elements */}
        <div className="absolute top-4 left-4 w-20 h-20 border-l-2 border-t-2 border-green-400/40 animate-hologram-flicker"></div>
        <div className="absolute top-4 right-4 w-20 h-20 border-r-2 border-t-2 border-green-400/40 animate-hologram-flicker" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 border-green-400/40 animate-hologram-flicker" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 border-green-400/40 animate-hologram-flicker" style={{animationDelay: '3s'}}></div>
        
        {/* Floating Data Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-green-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Benefits Section */}
        <BenefitsSection />
        
        {/* About Section */}
        <section id="about-section" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-12">
              About <span className="text-green-400">AUXMET</span>
            </h2>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-green-500/20 p-8">
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                AUXMET is a cutting-edge AI-powered interview preparation platform designed to help professionals 
                excel in their career journey. Our advanced AI technology simulates real interview scenarios, 
                providing personalized feedback and insights to improve your performance.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                With features like real-time voice analysis, domain-specific questions, and comprehensive 
                performance tracking, AUXMET transforms the way you prepare for interviews. Join thousands 
                of successful candidates who have landed their dream jobs with our platform.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
