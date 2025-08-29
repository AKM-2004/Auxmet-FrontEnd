import React from 'react';
import { motion } from 'framer-motion';

const NewVoiceUI = ({ isListening = false, voiceActivity = false }) => {
  return (
    <div style={{ 
      position: 'relative', 
      width: '250px', 
      height: '250px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Simple glow effect */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: voiceActivity 
            ? 'radial-gradient(circle, rgba(255, 68, 68, 0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0, 255, 136, 0.2) 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Main circle */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '32px',
          borderRadius: '50%',
          background: 'black',
          border: `2px solid ${voiceActivity ? '#ff4444' : '#00ff88'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: voiceActivity 
            ? '0 0 30px rgba(255, 68, 68, 0.5)'
            : '0 0 30px rgba(0, 255, 136, 0.5)',
        }}
        whileHover={{ scale: 1.05 }}
        animate={{
          scale: voiceActivity ? [1, 1.1, 1] : isListening ? [1, 1.05, 1] : 1,
        }}
        transition={{
          scale: {
            duration: voiceActivity ? 0.5 : 2,
            repeat: voiceActivity || isListening ? Infinity : 0,
            ease: 'easeInOut',
          }
        }}
      >
        <div style={{
          fontSize: '3.5rem',
          fontWeight: 'bold',
          color: voiceActivity ? '#ff4444' : '#00ff88',
          textShadow: voiceActivity 
            ? '0 0 20px rgba(255, 68, 68, 0.8)'
            : '0 0 20px rgba(0, 255, 136, 0.8)',
        }}>
          AI
        </div>
      </motion.div>
      
      {/* Pulse waves when voice is active */}
      {voiceActivity && [...Array(2)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          style={{
            position: 'absolute',
            inset: '32px',
            borderRadius: '50%',
            border: '2px solid #ff4444',
          }}
          animate={{
            scale: [1, 1.5],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

export default NewVoiceUI;