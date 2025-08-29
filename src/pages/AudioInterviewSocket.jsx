import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
// import vad from 'voice-activity-detection'; // Temporarily comment out VAD

const AudioInterviewSocket = () => {
  // State management
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected
  const [conversationState, setConversationState] = useState('idle'); // idle, playing_ai, listening_user, processing
  const [isRecording, setIsRecording] = useState(false);
  const [currentAudioText, setCurrentAudioText] = useState('');
  const [queueLength, setQueueLength] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [vadActivity, setVadActivity] = useState(false);

  // Refs for persistent values
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const mediaStreamRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const analyserRef = useRef(null);
  const recordingBufferRef = useRef([]);
  const recordingStartTimeRef = useRef(null);
  const lastChunkTimeRef = useRef(null);
  const silenceStartRef = useRef(null);
  const conversationStateRef = useRef('idle');
  const isRecordingRef = useRef(false);
  const voiceActiveRef = useRef(false);
  const chunkCountRef = useRef(0);

  // Configuration
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7576';
  const SOCKET_PATH = '/websocket/conversation';
  const VAD_THRESHOLD = 0.02; // Higher threshold to avoid picking up background noise
  const SILENCE_DURATION = 1500; // 1.5 seconds of silence to stop recording
  const CHUNK_DURATION = 2000; // 2 second chunks
  const CHUNK_OVERLAP = 100; // 100ms overlap between chunks
  const SAMPLE_RATE = 16000; // Standard sample rate for speech

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Socket Connection Handler
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    setConnectionState('connecting');
    console.log('Connecting to socket server...');

    socketRef.current = io("http://localhost:7576", {
      path: "/websocket/conversation" ,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully');
      setConnectionState('connected');
      setConversationState('idle');
      conversationStateRef.current = 'idle';
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionState('disconnected');
      setConversationState('idle');
      conversationStateRef.current = 'idle';
      stopRecording();
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      setConnectionState('disconnected');
    });

    // Handle incoming audio from backend
    socketRef.current.on('output_audio', handleOutputAudio);

    // Handle errors
    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }, []);

  // Handle output_audio event from backend
  const handleOutputAudio = useCallback((data) => {
    console.log('Received output_audio:', {
      sr: data.sr,
      text: data.text,
      length: data.length,
      audioArraySize: data.audio_array?.byteLength || data.audio_array?.length
    });

    // Add to queue
    audioQueueRef.current.push({
      sr: data.sr,
      audioArray: data.audio_array,
      text: data.text,
      duration: data.length
    });

    setQueueLength(audioQueueRef.current.length);
    setCurrentAudioText(data.text);

    // Start playing if not already playing
    if (!isPlayingRef.current) {
      setConversationState('playing_ai');
      conversationStateRef.current = 'playing_ai';
      playAudioQueue();
    }
  }, []);

  // Play audio queue sequentially
  const playAudioQueue = async () => {
    isPlayingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      setQueueLength(audioQueueRef.current.length);

      try {
        await playAudioChunk(audioData);
        
        // Small delay between chunks for smooth transition
        if (audioQueueRef.current.length > 0) {
          await sleep(50);
        }
      } catch (error) {
        console.error('Error playing audio chunk:', error);
      }
    }

    isPlayingRef.current = false;
    console.log('Finished playing all audio chunks, starting to listen...');
    
    // After all AI audio is played, start listening
    setConversationState('listening_user');
    conversationStateRef.current = 'listening_user';
    startRecording();
  };

  // Play individual audio chunk
  const playAudioChunk = (audioData) => {
    return new Promise((resolve, reject) => {
      try {
        const { sr, audioArray, duration } = audioData;
        
        // Convert audio array to Float32Array if needed
        let float32Array;
        if (audioArray instanceof ArrayBuffer) {
          float32Array = new Float32Array(audioArray);
        } else if (audioArray instanceof Uint8Array) {
          const buffer = audioArray.buffer.slice(audioArray.byteOffset, audioArray.byteOffset + audioArray.byteLength);
          float32Array = new Float32Array(buffer);
        } else {
          float32Array = new Float32Array(audioArray);
        }

        // Create audio buffer
        const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, sr);
        audioBuffer.copyToChannel(float32Array, 0);

        // Create and configure source
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        source.onended = () => {
          console.log('Audio chunk finished playing');
          resolve();
        };

        source.start(0);

        // Use actual duration minus small buffer for smooth transitions
        const playDuration = Math.max(0, (duration - 0.5) * 1000);
        setTimeout(resolve, playDuration);

      } catch (error) {
        console.error('Error in playAudioChunk:', error);
        reject(error);
      }
    });
  };

  // Start recording with enhanced VAD
  const startRecording = async () => {
    if (isRecordingRef.current) {
      console.log('Already recording');
      return;
    }

    try {
      console.log('Starting recording with enhanced VAD...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: SAMPLE_RATE
        } 
      });

      mediaStreamRef.current = stream;
      
      // Setup audio processing
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create processor with proper buffer size for 2-second chunks
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      audioProcessorRef.current = processor;
      recordingBufferRef.current = [];
      recordingStartTimeRef.current = Date.now();
      lastChunkTimeRef.current = Date.now();
      silenceStartRef.current = null;
      chunkCountRef.current = 0;
      voiceActiveRef.current = false;

      // Setup analyser for VAD
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      source.connect(analyser);
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Set recording state
      isRecordingRef.current = true;
      setIsRecording(true);
      
      // Enhanced VAD with time domain analysis
      const timeDomainData = new Float32Array(analyser.fftSize);
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      
      const checkVoiceActivity = () => {
        if (!isRecordingRef.current) {
          console.log('VAD: Recording stopped, ending VAD check');
          return;
        }
        
        // Get time domain data for RMS calculation
        analyser.getFloatTimeDomainData(timeDomainData);
        
        // Calculate RMS (Root Mean Square) for better voice detection
        let sumSquares = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          sumSquares += timeDomainData[i] * timeDomainData[i];
        }
        const rms = Math.sqrt(sumSquares / timeDomainData.length);
        
        // Also check frequency data for more accurate detection
        analyser.getByteFrequencyData(frequencyData);
        let freqSum = 0;
        // Focus on speech frequency range (85-255 Hz and 500-2000 Hz)
        for (let i = 2; i < 50; i++) {
          freqSum += frequencyData[i];
        }
        const avgFreq = freqSum / 48;
        
        // Combined voice detection with higher thresholds
        const isVoiceDetected = rms > VAD_THRESHOLD && avgFreq > 40;
        
        if (isVoiceDetected) {
          if (!voiceActiveRef.current) {
            console.log(`VAD: Voice detected (RMS: ${rms.toFixed(4)}, Freq: ${avgFreq.toFixed(1)})`);
            voiceActiveRef.current = true;
            setVadActivity(true);
            silenceStartRef.current = null;
          }
        } else {
          if (voiceActiveRef.current) {
            console.log('VAD: Voice stopped, starting silence timer');
            voiceActiveRef.current = false;
            setVadActivity(false);
            silenceStartRef.current = Date.now();
          }
          
          // Check for extended silence (only if silence timer is active)
          if (silenceStartRef.current) {
            const silenceDuration = Date.now() - silenceStartRef.current;
            if (silenceDuration >= SILENCE_DURATION) {
              console.log(`VAD: Extended silence detected (${silenceDuration}ms) - stopping recording`);
              handleRecordingStop();
              return;
            }
          }
        }
        
        // Continue VAD checking
        requestAnimationFrame(checkVoiceActivity);
      };
      
      // Start VAD checking after a small delay to let audio stabilize
      setTimeout(() => {
        console.log('VAD: Starting voice activity detection');
        checkVoiceActivity();
      }, 100);

      // Audio processing for recording with proper buffering
      let accumulatedSamples = 0;
      
      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        // Store audio data
        recordingBufferRef.current.push(new Float32Array(inputData));
        accumulatedSamples += inputData.length;

        // Calculate time since last chunk
        const timeSinceLastChunk = Date.now() - lastChunkTimeRef.current;
        
        // Send chunk every 2 seconds or when we have enough samples
        const samplesFor2Seconds = audioContext.sampleRate * 2;
        if (timeSinceLastChunk >= CHUNK_DURATION || accumulatedSamples >= samplesFor2Seconds) {
          console.log(`Audio: Sending chunk #${chunkCountRef.current + 1} (${timeSinceLastChunk}ms, ${accumulatedSamples} samples)`);
          sendAudioChunk(false);
          lastChunkTimeRef.current = Date.now();
          chunkCountRef.current++;
          
          // Reset accumulated samples but keep overlap
          const overlapSamples = Math.floor(audioContext.sampleRate * (CHUNK_OVERLAP / 1000));
          accumulatedSamples = overlapSamples;
        }

        // Update recording duration
        const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(duration);
      };

    } catch (error) {
      console.error('Error starting recording:', error);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  // Handle recording stop
  const handleRecordingStop = () => {
    if (!isRecordingRef.current) {
      console.log('Recording already stopped');
      return;
    }

    console.log(`Stopping recording after ${chunkCountRef.current} chunks...`);
    
    // Mark recording as stopped first to prevent further processing
    isRecordingRef.current = false;
    setIsRecording(false);
    setVadActivity(false);
    
    // Send final chunk with all remaining data
    if (recordingBufferRef.current.length > 0) {
      console.log('Sending final audio chunk with isFinal=true');
      sendAudioChunk(true);
    }
    
    // Clean up recording state
    recordingBufferRef.current = [];
    silenceStartRef.current = null;
    voiceActiveRef.current = false;
    chunkCountRef.current = 0;
    setRecordingDuration(0);
    
    // Update conversation state
    setConversationState('processing');
    conversationStateRef.current = 'processing';
    
    // Clean up audio resources
    stopRecording();
  };

  // Send audio chunk to backend with proper formatting
  const sendAudioChunk = (isFinal) => {
    if (!recordingBufferRef.current || recordingBufferRef.current.length === 0) {
      console.log('No audio data to send');
      return;
    }

    try {
      // Combine all audio buffers
      const totalLength = recordingBufferRef.current.reduce((acc, buf) => acc + buf.length, 0);
      if (totalLength === 0) {
        console.log('Empty audio buffer, skipping');
        return;
      }
      
      const combinedBuffer = new Float32Array(totalLength);
      let offset = 0;

      for (const buffer of recordingBufferRef.current) {
        combinedBuffer.set(buffer, offset);
        offset += buffer.length;
      }

      // Downsample if necessary (from audioContext sample rate to 16kHz)
      const audioContext = audioContextRef.current;
      let processedBuffer = combinedBuffer;
      
      if (audioContext.sampleRate !== SAMPLE_RATE) {
        const downsampleRatio = audioContext.sampleRate / SAMPLE_RATE;
        const newLength = Math.floor(combinedBuffer.length / downsampleRatio);
        processedBuffer = new Float32Array(newLength);
        
        for (let i = 0; i < newLength; i++) {
          const sourceIndex = Math.floor(i * downsampleRatio);
          processedBuffer[i] = combinedBuffer[sourceIndex];
        }
        console.log(`Downsampled from ${audioContext.sampleRate}Hz to ${SAMPLE_RATE}Hz`);
      }

      // Convert Float32 to PCM16 for backend
      const pcm16Buffer = float32ToPCM16(processedBuffer);

      console.log(`Sending audio chunk #${chunkCountRef.current} - isFinal: ${isFinal}, size: ${pcm16Buffer.length} samples (${(pcm16Buffer.length / SAMPLE_RATE).toFixed(2)}s)`);

      // Check socket connection before emitting
      if (!socketRef.current) {
        console.error('Socket not initialized');
        return;
      }
      
      if (!socketRef.current.connected) {
        console.error('Socket not connected, cannot send audio');
        return;
      }

      // Emit to backend with proper format
      const audioData = {
        audio_buffer: Array.from(pcm16Buffer),
        isFinal: isFinal,
        sample_rate: SAMPLE_RATE,
        chunk_index: chunkCountRef.current
      };
      
      console.log('Emitting input_audio event with data:', {
        bufferLength: audioData.audio_buffer.length,
        isFinal: audioData.isFinal,
        sample_rate: audioData.sample_rate,
        chunk_index: audioData.chunk_index
      });
      
      socketRef.current.emit('input_audio', audioData);
      console.log('✓ input_audio event emitted successfully');

      // Handle buffer cleanup with overlap
      if (!isFinal) {
        // Keep last 100ms for overlap
        const overlapSamples = Math.floor(audioContext.sampleRate * (CHUNK_OVERLAP / 1000));
        const totalBuffers = recordingBufferRef.current.length;
        
        if (totalBuffers > 0) {
          // Calculate how many samples to keep from the end
          let samplesKept = 0;
          const buffersToKeep = [];
          
          for (let i = totalBuffers - 1; i >= 0 && samplesKept < overlapSamples; i--) {
            const buffer = recordingBufferRef.current[i];
            buffersToKeep.unshift(buffer);
            samplesKept += buffer.length;
          }
          
          // If we have too many samples, trim the first buffer
          if (samplesKept > overlapSamples && buffersToKeep.length > 0) {
            const excessSamples = samplesKept - overlapSamples;
            const firstBuffer = buffersToKeep[0];
            if (firstBuffer.length > excessSamples) {
              buffersToKeep[0] = firstBuffer.slice(firstBuffer.length - (firstBuffer.length - excessSamples));
            }
          }
          
          recordingBufferRef.current = buffersToKeep;
          console.log(`Kept ${samplesKept} samples for overlap`);
        }
      } else {
        // Clear all buffers for final chunk
        recordingBufferRef.current = [];
      }
    } catch (error) {
      console.error('Error sending audio chunk:', error);
    }
  };

  // Convert Float32 to PCM16
  const float32ToPCM16 = (float32Array) => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  };

  // Stop recording and cleanup
  const stopRecording = () => {
    console.log('Cleaning up recording resources...');

    // Disconnect audio nodes
    if (audioProcessorRef.current) {
      try {
        audioProcessorRef.current.disconnect();
      } catch (e) {
        console.log('Processor already disconnected');
      }
      audioProcessorRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {
        console.log('Analyser already disconnected');
      }
      analyserRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      mediaStreamRef.current = null;
    }

    // Reset states
    isRecordingRef.current = false;
    voiceActiveRef.current = false;
    setIsRecording(false);
    setVadActivity(false);
    
    console.log('Recording cleanup completed');
  };

  // Disconnect socket
  const disconnectSocket = () => {
    stopRecording();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionState('disconnected');
    setConversationState('idle');
    conversationStateRef.current = 'idle';
  };

  // Utility sleep function
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // UI Component
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>AUXMET AI Interview</h1>
        <div style={styles.status}>
          <span style={{
            ...styles.statusDot,
            backgroundColor: connectionState === 'connected' ? '#00ff88' : 
                           connectionState === 'connecting' ? '#ffff00' : '#ff4444'
          }}></span>
          <span style={styles.statusText}>{connectionState.toUpperCase()}</span>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Connection Button */}
        {connectionState === 'disconnected' && (
          <button style={styles.connectButton} onClick={connectSocket}>
            Connect to Interview Session
          </button>
        )}

        {/* Conversation State Display */}
        {connectionState === 'connected' && (
          <div style={styles.conversationInfo}>
            <h2 style={styles.stateTitle}>
              {conversationState === 'idle' && '🔄 Initializing...'}
              {conversationState === 'playing_ai' && '🔊 AI Speaking'}
              {conversationState === 'listening_user' && '🎤 Your Turn'}
              {conversationState === 'processing' && '⏳ Processing Response'}
            </h2>

            {/* Current Audio Text */}
            {currentAudioText && conversationState === 'playing_ai' && (
              <div style={styles.audioText}>
                <p>{currentAudioText}</p>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div style={styles.recordingInfo}>
                <div style={styles.recordingIndicator}>
                  <span style={styles.recordingDot}></span>
                  Recording... {recordingDuration}s
                </div>
                {vadActivity && (
                  <div style={styles.vadIndicator}>Voice Detected</div>
                )}
              </div>
            )}

            {/* Queue Info */}
            {queueLength > 0 && (
              <div style={styles.queueInfo}>
                Audio Queue: {queueLength} chunks remaining
              </div>
            )}

            {/* Disconnect Button */}
            <button style={styles.disconnectButton} onClick={disconnectSocket}>
              End Interview
            </button>
          </div>
        )}
      </div>

      {/* Visual Feedback */}
      <div style={styles.visualFeedback}>
        {conversationState === 'playing_ai' && (
          <div style={styles.waveAnimation}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                ...styles.waveLine,
                animationDelay: `${i * 0.1}s`
              }}></div>
            ))}
          </div>
        )}
        {isRecording && vadActivity && (
          <div style={styles.waveAnimation}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                ...styles.waveLineRecording,
                animationDelay: `${i * 0.1}s`
              }}></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000000',
    color: '#00ff88',
    padding: '20px',
    fontFamily: 'monospace',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #00ff88',
    paddingBottom: '10px',
  },
  title: {
    fontSize: '2.5rem',
    margin: 0,
    textShadow: '0 0 10px #00ff88',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    boxShadow: '0 0 10px currentColor',
  },
  statusText: {
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  mainContent: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  connectButton: {
    width: '100%',
    padding: '20px',
    fontSize: '1.5rem',
    backgroundColor: '#00ff88',
    color: '#000000',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    boxShadow: '0 0 20px #00ff88',
  },
  conversationInfo: {
    textAlign: 'center',
    padding: '20px',
    border: '2px solid #00ff88',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  stateTitle: {
    fontSize: '1.8rem',
    marginBottom: '20px',
    color: '#00ff88',
  },
  audioText: {
    padding: '15px',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #00ff88',
  },
  recordingInfo: {
    marginTop: '20px',
  },
  recordingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '1.2rem',
    color: '#ff4444',
  },
  recordingDot: {
    width: '10px',
    height: '10px',
    backgroundColor: '#ff4444',
    borderRadius: '50%',
    animation: 'pulse 1s infinite',
  },
  vadIndicator: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: '5px',
    color: '#00ff88',
    fontWeight: 'bold',
  },
  queueInfo: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
    borderRadius: '5px',
    color: '#ffff00',
  },
  disconnectButton: {
    marginTop: '30px',
    padding: '15px 30px',
    fontSize: '1rem',
    backgroundColor: 'transparent',
    color: '#ff4444',
    border: '2px solid #ff4444',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
  },
  visualFeedback: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '5px',
  },
  waveAnimation: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveLine: {
    width: '4px',
    height: '30px',
    backgroundColor: '#00ff88',
    borderRadius: '2px',
    animation: 'wave 1s ease-in-out infinite',
  },
  waveLineRecording: {
    width: '4px',
    height: '30px',
    backgroundColor: '#ff4444',
    borderRadius: '2px',
    animation: 'wave 1s ease-in-out infinite',
  },
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  
  @keyframes wave {
    0%, 100% { height: 30px; }
    50% { height: 60px; }
  }
`;
document.head.appendChild(styleSheet);

export default AudioInterviewSocket;
