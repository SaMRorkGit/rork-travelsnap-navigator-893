/**
 * VoiceSessionService
 * 
 * Service for managing voice input sessions with strict isolation
 * and validation to prevent hallucinated/stale text from appearing.
 */

export interface VoiceSession {
  sessionId: string;
  recordingId: string;
  timestamp: number;
  status: 'idle' | 'recording' | 'processing' | 'completed' | 'error';
  transcript: string | null;
  audioUri: string | null;
  isValidated: boolean;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique recording ID
 */
export function generateRecordingId(): string {
  return `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new voice session
 */
export function createVoiceSession(): VoiceSession {
  return {
    sessionId: generateSessionId(),
    recordingId: generateRecordingId(),
    timestamp: Date.now(),
    status: 'idle',
    transcript: null,
    audioUri: null,
    isValidated: false,
  };
}

/**
 * Validate transcript before setting
 * Ensures no hallucinated or stale text appears
 */
export function validateTranscript(
  transcript: string,
  sessionId: string,
  currentSession: VoiceSession | null
): { valid: boolean; error?: string } {
  // Check if transcript is empty
  if (!transcript || typeof transcript !== 'string') {
    return { valid: false, error: 'Transcript is empty or invalid' };
  }

  // Check transcript length (reasonable limit)
  const trimmed = transcript.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Transcript is empty after trimming' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Transcript exceeds maximum length' };
  }

  // Check session match (critical for preventing stale text)
  if (!currentSession) {
    return { valid: false, error: 'No active session' };
  }

  if (currentSession.sessionId !== sessionId) {
    return { valid: false, error: 'Transcript does not match current session' };
  }

  // Check if session is still valid (not too old)
  const sessionAge = Date.now() - currentSession.timestamp;
  const MAX_SESSION_AGE = 5 * 60 * 1000; // 5 minutes
  if (sessionAge > MAX_SESSION_AGE) {
    return { valid: false, error: 'Session has expired' };
  }

  // Additional validation: check for suspicious patterns
  // (e.g., repeated characters, only special chars, etc.)
  if (/^[^a-zA-Z0-9\s]+$/.test(trimmed)) {
    return { valid: false, error: 'Transcript contains only special characters' };
  }

  return { valid: true };
}

/**
 * Update session with validated transcript
 */
export function updateSessionWithTranscript(
  session: VoiceSession,
  transcript: string,
  sessionId: string
): VoiceSession | null {
  const validation = validateTranscript(transcript, sessionId, session);
  
  if (!validation.valid) {
    console.warn('[VoiceSessionService] Transcript validation failed:', validation.error);
    return null;
  }

  return {
    ...session,
    transcript: transcript.trim(),
    isValidated: true,
    status: 'completed',
  };
}

/**
 * Clear session state (for reset)
 */
export function clearSession(): VoiceSession | null {
  return null;
}

