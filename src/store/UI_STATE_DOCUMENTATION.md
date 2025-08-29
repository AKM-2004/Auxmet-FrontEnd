# UI State Machine Documentation

## Overview

This implementation provides a robust state machine for managing voice interface UI states. It offers two approaches:

1. **Global State Management** - Using Zustand store for shared state across components
2. **Local State Management** - Using React hooks for isolated component state

## State Definitions

### UIState Enum

```javascript
export const UIState = Object.freeze({
  IDLE: 'IDLE',             // Default state, waiting for interaction
  LISTENING: 'LISTENING',   // Actively listening for voice input
  PROCESSING: 'PROCESSING', // Processing voice input
  SPEAKING: 'SPEAKING',     // Playing back AI response
  ERROR: 'ERROR',           // Error state
  DISABLED: 'DISABLED'      // Interface is disabled
});
```

## State Transitions

### Valid State Transitions

```
IDLE ──────────► LISTENING
     │                │
     │                ▼
     │          PROCESSING
     │                │
     │                ▼
     └────────── SPEAKING
                      │
                      ▼
                    IDLE

Any State ────► ERROR ────► IDLE
Any State ────► DISABLED ──► IDLE (when re-enabled)
```

### Transition Rules

1. **IDLE** → LISTENING, ERROR, DISABLED
2. **LISTENING** → PROCESSING, IDLE, ERROR, DISABLED
3. **PROCESSING** → SPEAKING, IDLE, ERROR, DISABLED
4. **SPEAKING** → IDLE, LISTENING, ERROR, DISABLED
5. **ERROR** → IDLE, DISABLED
6. **DISABLED** → IDLE (only when re-enabled)

## Usage Examples

### 1. Global State with Zustand Store

```javascript
import { useUIStateStore, UIState, selectIsListening } from '../store/uiStateStore';

function VoiceComponent() {
  // Access state
  const state = useUIStateStore((state) => state.state);
  const isListening = useUIStateStore(selectIsListening);
  const voiceActivity = useUIStateStore((state) => state.voiceActivity);
  
  // Access actions
  const startListening = useUIStateStore((state) => state.startListening);
  const stopListening = useUIStateStore((state) => state.stopListening);
  
  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = useUIStateStore.subscribe(
      (state) => state.state,
      (newState, previousState) => {
        console.log(`State changed: ${previousState} → ${newState}`);
        // Trigger animations based on state change
      }
    );
    
    return unsubscribe;
  }, []);
  
  return (
    <button onClick={startListening}>
      {state}
    </button>
  );
}
```

### 2. Local State with Hook

```javascript
import useUIState from '../hooks/useUIState';

function VoiceComponent() {
  const {
    state,
    isListening,
    voiceActivity,
    startListening,
    stopListening,
    setVoiceActivity
  } = useUIState({
    debug: true,
    onStateChange: (newState, oldState) => {
      console.log(`State changed: ${oldState} → ${newState}`);
    }
  });
  
  return (
    <button onClick={startListening}>
      {state}
    </button>
  );
}
```

### 3. Animation Integration

```javascript
import { useStateAnimation } from '../hooks/useUIState';

function AnimatedVoiceUI() {
  const { state } = useUIState();
  
  // Define animations for each state
  const animation = useStateAnimation(state, {
    [UIState.IDLE]: { 
      scale: 1, 
      opacity: 0.7,
      glow: 0
    },
    [UIState.LISTENING]: { 
      scale: 1.1, 
      opacity: 1,
      glow: 0.3
    },
    [UIState.PROCESSING]: { 
      scale: 1.05, 
      opacity: 0.9,
      glow: 0.2
    },
    [UIState.SPEAKING]: { 
      scale: 1.15, 
      opacity: 1,
      glow: 0.4
    }
  });
  
  return (
    <motion.div
      animate={{
        scale: animation.scale,
        opacity: animation.opacity
      }}
      style={{
        boxShadow: `0 0 ${animation.glow * 100}px rgba(34, 255, 68, ${animation.glow})`
      }}
    >
      {/* Voice UI content */}
    </motion.div>
  );
}
```

## API Reference

### Zustand Store Actions

- `startListening()` - Transition to LISTENING state
- `stopListening()` - Return to IDLE from LISTENING
- `startProcessing()` - Transition to PROCESSING state
- `startSpeaking(response)` - Transition to SPEAKING state
- `finishSpeaking()` - Complete speaking and return to IDLE
- `setError(message)` - Set error state with message
- `clearError()` - Clear error and return to IDLE
- `setEnabled(enabled)` - Enable/disable the interface
- `setVoiceActivity(level)` - Update voice activity (0-1)
- `reset()` - Reset to initial state
- `transition(newState, metadata)` - Manual state transition
- `getValidTransitions()` - Get array of valid next states
- `getStateInfo()` - Get current state information

### Hook Returns

The `useUIState` hook returns:

```javascript
{
  // State values
  state: string,
  previousState: string | null,
  voiceActivity: number,
  errorMessage: string | null,
  isEnabled: boolean,
  
  // State queries
  isActive: boolean,
  isListening: boolean,
  isProcessing: boolean,
  isSpeaking: boolean,
  isError: boolean,
  isDisabled: boolean,
  canListen: boolean,
  
  // Actions
  startListening: () => boolean,
  stopListening: () => boolean,
  startProcessing: () => boolean,
  startSpeaking: (response) => boolean,
  finishSpeaking: () => boolean,
  setError: (message) => boolean,
  clearError: () => boolean,
  setEnabled: (enabled) => boolean,
  setVoiceActivity: (level) => void,
  reset: () => void,
  
  // Advanced
  transition: (newState, metadata) => boolean,
  getValidTransitions: () => string[],
  getHistory: () => TransitionHistory[]
}
```

## Best Practices

### 1. Choose the Right Approach

- **Use Zustand Store when:**
  - Multiple components need to share the same UI state
  - You need persistent state across navigation
  - You want to debug state changes globally
  
- **Use Local Hook when:**
  - Component manages its own isolated state
  - You need multiple independent voice interfaces
  - You want simpler, self-contained components

### 2. Handle State Transitions

```javascript
// Always check if transition is valid
const handleUserAction = () => {
  const validTransitions = getValidTransitions();
  if (validTransitions.includes(UIState.LISTENING)) {
    startListening();
  } else {
    console.warn('Cannot start listening in current state');
  }
};
```

### 3. Subscribe to State Changes

```javascript
// For animations and side effects
useEffect(() => {
  const unsubscribe = useUIStateStore.subscribe(
    (state) => state.state,
    (newState, previousState) => {
      // Trigger animations
      if (newState === UIState.LISTENING) {
        startListeningAnimation();
      }
      
      // Handle side effects
      if (previousState === UIState.SPEAKING && newState === UIState.IDLE) {
        onSpeechComplete();
      }
    }
  );
  
  return unsubscribe;
}, []);
```

### 4. Error Handling

```javascript
try {
  // Some operation that might fail
  await processVoiceInput();
} catch (error) {
  setError(error.message);
  
  // Auto-clear error after delay
  setTimeout(() => {
    clearError();
  }, 5000);
}
```

### 5. Voice Activity Updates

```javascript
// Update voice activity from audio analyzer
const updateVoiceActivity = (audioData) => {
  const activity = calculateActivity(audioData); // 0-1
  setVoiceActivity(activity);
};
```

## Integration with External Systems

### Web Speech API Integration

```javascript
const recognition = new webkitSpeechRecognition();

recognition.onstart = () => {
  startListening();
};

recognition.onresult = (event) => {
  startProcessing();
  // Process results...
};

recognition.onend = () => {
  if (state === UIState.LISTENING) {
    stopListening();
  }
};
```

### Animation Libraries

```javascript
// Framer Motion
<motion.div
  animate={{
    scale: isListening ? 1.1 : 1,
    opacity: isActive ? 1 : 0.7
  }}
  transition={{ duration: 0.3 }}
/>

// Three.js
useFrame(() => {
  if (meshRef.current) {
    meshRef.current.scale.setScalar(
      isListening ? 1.1 : 1
    );
  }
});
```

## Debugging

### Enable Debug Mode

```javascript
// With hook
const { state } = useUIState({ debug: true });

// With store
useUIStateStore.subscribe(
  (state) => state,
  (state) => {
    console.log('State update:', state);
  }
);
```

### View State History

```javascript
// Get transition history
const history = getHistory();
console.table(history);
```

### Monitor State in DevTools

The Zustand store integrates with Redux DevTools:

```javascript
// Install Redux DevTools Extension
// State changes will appear in the DevTools
```

## Migration Guide

### From Props to State Machine

```javascript
// Before
<VoiceUI 
  isListening={isListening}
  isProcessing={isProcessing}
  isSpeaking={isSpeaking}
  onStartListening={() => setIsListening(true)}
  onStopListening={() => setIsListening(false)}
/>

// After (with hook)
function VoiceUI() {
  const { state, startListening, stopListening } = useUIState();
  // Component manages its own state
}

// After (with store)
function VoiceUI() {
  const state = useUIStateStore((state) => state.state);
  const startListening = useUIStateStore((state) => state.startListening);
  // Shared state across components
}
```

## Performance Considerations

1. **Selective Subscriptions** - Only subscribe to the state you need
2. **Memoization** - Use React.memo for components that only care about specific states
3. **Shallow Comparisons** - Zustand uses shallow equality by default
4. **Transition Validation** - Invalid transitions are rejected early

## Future Enhancements

1. **State Persistence** - Add localStorage persistence
2. **State History Replay** - Time-travel debugging
3. **Analytics Integration** - Track state transitions
4. **Custom Transitions** - Plugin system for custom state logic
5. **TypeScript Support** - Full type safety (already compatible)
