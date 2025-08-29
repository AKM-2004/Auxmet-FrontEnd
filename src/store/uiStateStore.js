import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * UI State Enum
 * Defines all possible states for the voice interface
 */
export const UIState = Object.freeze({
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
  ERROR: 'ERROR',
  DISABLED: 'DISABLED'
});

/**
 * UI State Store
 * Manages the voice interface state machine with Zustand
 * 
 * State Transitions:
 * - IDLE -> LISTENING: When user initiates voice input
 * - LISTENING -> PROCESSING: When voice input is detected and being analyzed
 * - PROCESSING -> SPEAKING: When AI response is ready and being spoken
 * - SPEAKING -> IDLE: When AI finishes speaking
 * - Any state -> ERROR: When an error occurs
 * - ERROR -> IDLE: When error is cleared
 * - Any state -> DISABLED: When interface is disabled
 * - DISABLED -> IDLE: When interface is re-enabled
 */
export const useUIStateStore = create(
  subscribeWithSelector((set, get) => ({
    // Current UI state
    state: UIState.IDLE,
    
    // Previous state for transition tracking
    previousState: null,
    
    // Additional state data
    voiceActivity: 0,
    errorMessage: null,
    isEnabled: true,
    
    // State transition history for debugging
    stateHistory: [],
    
    /**
     * Transition to a new state
     * @param {string} newState - The new state from UIState enum
     * @param {object} metadata - Optional metadata for the transition
     */
    transition: (newState, metadata = {}) => {
      const currentState = get().state;
      
      // Validate state transition
      if (!UIState[newState]) {
        console.error(`Invalid state: ${newState}`);
        return;
      }
      
      // Check if transition is valid
      const validTransitions = get().getValidTransitions();
      if (!validTransitions.includes(newState)) {
        console.warn(`Invalid transition from ${currentState} to ${newState}`);
        return;
      }
      
      set((state) => ({
        previousState: currentState,
        state: newState,
        stateHistory: [...state.stateHistory, {
          from: currentState,
          to: newState,
          timestamp: Date.now(),
          metadata
        }].slice(-50) // Keep last 50 transitions
      }));
      
      // Log transition for debugging
      console.log(`UI State: ${currentState} → ${newState}`, metadata);
    },
    
    /**
     * Get valid transitions from current state
     * @returns {string[]} Array of valid next states
     */
    getValidTransitions: () => {
      const currentState = get().state;
      const isEnabled = get().isEnabled;
      
      // If disabled, no transitions except to enable
      if (!isEnabled && currentState !== UIState.DISABLED) {
        return [UIState.DISABLED];
      }
      
      switch (currentState) {
        case UIState.IDLE:
          return [UIState.LISTENING, UIState.ERROR, UIState.DISABLED];
          
        case UIState.LISTENING:
          return [UIState.PROCESSING, UIState.IDLE, UIState.ERROR, UIState.DISABLED];
          
        case UIState.PROCESSING:
          return [UIState.SPEAKING, UIState.IDLE, UIState.ERROR, UIState.DISABLED];
          
        case UIState.SPEAKING:
          return [UIState.IDLE, UIState.LISTENING, UIState.ERROR, UIState.DISABLED];
          
        case UIState.ERROR:
          return [UIState.IDLE, UIState.DISABLED];
          
        case UIState.DISABLED:
          return isEnabled ? [UIState.IDLE] : [];
          
        default:
          return [UIState.IDLE];
      }
    },
    
    /**
     * State-specific actions
     */
    
    // Start listening
    startListening: () => {
      const validTransitions = get().getValidTransitions();
      if (validTransitions.includes(UIState.LISTENING)) {
        get().transition(UIState.LISTENING, { source: 'user_action' });
      }
    },
    
    // Stop listening and return to idle
    stopListening: () => {
      const currentState = get().state;
      if (currentState === UIState.LISTENING) {
        get().transition(UIState.IDLE, { source: 'user_action' });
      }
    },
    
    // Start processing voice input
    startProcessing: () => {
      const validTransitions = get().getValidTransitions();
      if (validTransitions.includes(UIState.PROCESSING)) {
        get().transition(UIState.PROCESSING, { source: 'voice_detected' });
      }
    },
    
    // Start speaking response
    startSpeaking: (response) => {
      const validTransitions = get().getValidTransitions();
      if (validTransitions.includes(UIState.SPEAKING)) {
        get().transition(UIState.SPEAKING, { source: 'response_ready', response });
      }
    },
    
    // Finish speaking and return to idle
    finishSpeaking: () => {
      const currentState = get().state;
      if (currentState === UIState.SPEAKING) {
        get().transition(UIState.IDLE, { source: 'speech_complete' });
      }
    },
    
    // Handle error
    setError: (errorMessage) => {
      set({ errorMessage });
      get().transition(UIState.ERROR, { source: 'error', message: errorMessage });
    },
    
    // Clear error and return to idle
    clearError: () => {
      set({ errorMessage: null });
      const currentState = get().state;
      if (currentState === UIState.ERROR) {
        get().transition(UIState.IDLE, { source: 'error_cleared' });
      }
    },
    
    // Enable/disable interface
    setEnabled: (enabled) => {
      set({ isEnabled: enabled });
      if (!enabled) {
        get().transition(UIState.DISABLED, { source: 'disabled' });
      } else if (get().state === UIState.DISABLED) {
        get().transition(UIState.IDLE, { source: 'enabled' });
      }
    },
    
    // Update voice activity level (0-1)
    setVoiceActivity: (level) => {
      set({ voiceActivity: Math.max(0, Math.min(1, level)) });
    },
    
    // Reset to initial state
    reset: () => {
      set({
        state: UIState.IDLE,
        previousState: null,
        voiceActivity: 0,
        errorMessage: null,
        isEnabled: true,
        stateHistory: []
      });
    },
    
    // Get current state info
    getStateInfo: () => {
      const state = get().state;
      return {
        state,
        isActive: [UIState.LISTENING, UIState.PROCESSING, UIState.SPEAKING].includes(state),
        canListen: get().getValidTransitions().includes(UIState.LISTENING),
        isError: state === UIState.ERROR,
        isDisabled: state === UIState.DISABLED
      };
    }
  }))
);

/**
 * Selectors for common state queries
 */
export const selectUIState = (state) => state.state;
export const selectIsActive = (state) => [UIState.LISTENING, UIState.PROCESSING, UIState.SPEAKING].includes(state.state);
export const selectIsListening = (state) => state.state === UIState.LISTENING;
export const selectIsProcessing = (state) => state.state === UIState.PROCESSING;
export const selectIsSpeaking = (state) => state.state === UIState.SPEAKING;
export const selectIsError = (state) => state.state === UIState.ERROR;
export const selectIsDisabled = (state) => state.state === UIState.DISABLED;
export const selectVoiceActivity = (state) => state.voiceActivity;
export const selectCanTransitionTo = (targetState) => (state) => state.getValidTransitions().includes(targetState);

/**
 * Subscribe to state changes for animations
 * Example usage:
 * 
 * useEffect(() => {
 *   const unsubscribe = useUIStateStore.subscribe(
 *     (state) => state.state,
 *     (newState, previousState) => {
 *       console.log(`State changed from ${previousState} to ${newState}`);
 *       // Trigger animations based on state change
 *     }
 *   );
 *   return unsubscribe;
 * }, []);
 */
