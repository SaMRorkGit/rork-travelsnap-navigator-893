import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const DEEPGRAM_API_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY || '';
const DEEPGRAM_WS_URL = 'wss://agent.deepgram.com/v1/agent/converse';

export function verifyDeepgramConfiguration(): { isValid: boolean; error?: string } {
  console.log('[DeepgramConfig] ========================================');
  console.log('[DeepgramConfig] Verifying Deepgram configuration');
  console.log('[DeepgramConfig] ========================================');
  console.log('[DeepgramConfig] EXPO_PUBLIC_DEEPGRAM_API_KEY present:', !!DEEPGRAM_API_KEY);
  console.log('[DeepgramConfig] API Key length:', DEEPGRAM_API_KEY.length);
  
  if (DEEPGRAM_API_KEY.length > 0) {
    console.log('[DeepgramConfig] API Key prefix:', DEEPGRAM_API_KEY.substring(0, 10) + '...');
  }
  
  if (!DEEPGRAM_API_KEY) {
    console.error('[DeepgramConfig] ✗ API key is missing!');
    return {
      isValid: false,
      error: 'EXPO_PUBLIC_DEEPGRAM_API_KEY is not set. Please configure this environment variable.'
    };
  }
  
  if (DEEPGRAM_API_KEY.length < 20) {
    console.error('[DeepgramConfig] ✗ API key appears to be invalid (too short)');
    return {
      isValid: false,
      error: 'EXPO_PUBLIC_DEEPGRAM_API_KEY appears to be invalid (too short).'
    };
  }
  
  console.log('[DeepgramConfig] ✓ Configuration is valid');
  return { isValid: true };
}

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.aac',
    outputFormat: Audio.AndroidOutputFormat.AAC_ADTS,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export type DeepgramMessageType = 
  | 'Welcome'
  | 'SettingsApplied'
  | 'ConversationText'
  | 'FunctionCallRequest'
  | 'AgentStartedSpeaking'
  | 'AgentAudioDone'
  | 'UserStartedSpeaking'
  | 'Error';

export interface DeepgramMessage {
  type: DeepgramMessageType;
  [key: string]: any;
}

export interface ConversationTextMessage extends DeepgramMessage {
  type: 'ConversationText';
  role: 'user' | 'assistant';
  content: string;
}

export interface FunctionCallRequestMessage extends DeepgramMessage {
  type: 'FunctionCallRequest';
  function_call_id: string;
  function_name: string;
  input: Record<string, any>;
}

export interface DeepgramVoiceAgentCallbacks {
  onConnected?: () => void;
  onSettingsApplied?: () => void;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onFunctionCall?: (functionName: string, args: Record<string, any>, callId: string) => void;
  onAgentSpeaking?: (isSpeaking: boolean) => void;
  onAudioReceived?: (audioData: ArrayBuffer) => void;
  onError?: (error: Error) => void;
  onDisconnected?: () => void;
}

// Polyfill for atob if not available
const decodeBase64 = (input: string) => {
  if (typeof atob === 'function') {
    return atob(input);
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  for (let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);

    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
};

export class DeepgramVoiceAgentService {
  private ws: WebSocket | null = null;
  private callbacks: DeepgramVoiceAgentCallbacks = {};
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private audioQueue: ArrayBuffer[] = [];
  private isProcessingAudio: boolean = false;
  private sound: Audio.Sound | null = null;
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private lastFilePosition: number = 0;
  private recordingUri: string | null = null;

  constructor(callbacks: DeepgramVoiceAgentCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    console.log('[DeepgramVoiceAgent] ========================================');
    console.log('[DeepgramVoiceAgent] Starting connection to Deepgram Voice Agent');
    console.log('[DeepgramVoiceAgent] ========================================');
    
    const configCheck = verifyDeepgramConfiguration();
    if (!configCheck.isValid) {
      console.error('[DeepgramVoiceAgent] ✗ Configuration check failed:', configCheck.error);
      throw new Error(configCheck.error);
    }
    
    console.log('[DeepgramVoiceAgent] ✓ Configuration verified successfully');

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${DEEPGRAM_WS_URL}?token=${DEEPGRAM_API_KEY}`;
        console.log('[DeepgramVoiceAgent] WebSocket URL:', wsUrl.replace(DEEPGRAM_API_KEY, '***'));
        
        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        const connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            console.error('[DeepgramVoiceAgent] Connection timeout');
            this.disconnect();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          console.log('[DeepgramVoiceAgent] ✓ WebSocket successfully connected!');
          console.log('[DeepgramVoiceAgent] Connection state: OPEN');
          console.log('[DeepgramVoiceAgent] Ready state:', this.ws?.readyState);
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.sendSettings();
          this.callbacks.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error: Event) => {
          console.error('[DeepgramVoiceAgent] WebSocket error:', error);
          clearTimeout(connectionTimeout);
          this.callbacks.onError?.(new Error('WebSocket connection error'));
          if (!this.isConnected) {
            reject(new Error('Failed to connect to Deepgram'));
          }
        };

        this.ws.onclose = (event: CloseEvent) => {
          console.log('[DeepgramVoiceAgent] WebSocket closed:', event.code, event.reason);
          clearTimeout(connectionTimeout);
          this.isConnected = false;
          this.callbacks.onDisconnected?.();
        };
      } catch (error) {
        console.error('[DeepgramVoiceAgent] Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  private sendSettings(): void {
    console.log('[DeepgramVoiceAgent] Sending settings...');
    
    const settings = {
      type: 'Settings',
      agent: {
        think: {
          provider: { type: 'open_ai', model: 'gpt-4o-mini' },
          prompt: `You are a navigation assistant. Your job is to help users navigate to their destinations.
When a user tells you where they want to go, extract the destination name or address and call the start_navigation function.
Be concise and helpful. If the destination is unclear, ask for clarification.
Examples:
- "Take me to the Eiffel Tower" -> call start_navigation with destination "Eiffel Tower, Paris"
- "I want to go to Central Park" -> call start_navigation with destination "Central Park, New York"
- "Navigate to 123 Main Street" -> call start_navigation with destination "123 Main Street"`,
        },
        listen: { 
          provider: { type: 'deepgram', model: 'nova-3' }
        },
        speak: { 
          provider: { type: 'deepgram', model: 'aura-2-asteria-en' }
        },
      },
      context: {
        functions: [
          {
            name: 'start_navigation',
            description: 'Start navigation to a destination. Call this when the user specifies where they want to go.',
            parameters: {
              type: 'object',
              properties: {
                destination: {
                  type: 'string',
                  description: 'The destination name, address, or place the user wants to navigate to',
                },
              },
              required: ['destination'],
            },
          },
        ],
      },
    };

    this.send(JSON.stringify(settings));
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data instanceof ArrayBuffer) {
      console.log('[DeepgramVoiceAgent] Received audio chunk:', event.data.byteLength, 'bytes');
      this.audioQueue.push(event.data);
      this.callbacks.onAudioReceived?.(event.data);
      return;
    }

    try {
      const message: DeepgramMessage = JSON.parse(event.data);
      console.log('[DeepgramVoiceAgent] Received message:', message.type, JSON.stringify(message).substring(0, 200));

      switch (message.type) {
        case 'Welcome':
          console.log('[DeepgramVoiceAgent] Welcome received');
          break;

        case 'SettingsApplied':
          console.log('[DeepgramVoiceAgent] ✓ Settings successfully applied!');
          console.log('[DeepgramVoiceAgent] Voice agent is now ready to receive audio');
          this.callbacks.onSettingsApplied?.();
          break;

        case 'ConversationText':
          const textMsg = message as ConversationTextMessage;
          console.log('[DeepgramVoiceAgent] ========================================');
          console.log('[DeepgramVoiceAgent] ✓ TRANSCRIPT RECEIVED!');
          console.log('[DeepgramVoiceAgent] ========================================');
          console.log('[DeepgramVoiceAgent]   Role:', textMsg.role);
          console.log('[DeepgramVoiceAgent]   Text:', textMsg.content);
          console.log('[DeepgramVoiceAgent]   Length:', textMsg.content.length, 'characters');
          this.callbacks.onTranscript?.(textMsg.content, textMsg.role);
          break;

        case 'FunctionCallRequest':
          const funcMsg = message as FunctionCallRequestMessage;
          console.log('[DeepgramVoiceAgent] ========================================');
          console.log('[DeepgramVoiceAgent] ✓ FUNCTION CALL RECEIVED!');
          console.log('[DeepgramVoiceAgent] ========================================');
          console.log('[DeepgramVoiceAgent]   Function:', funcMsg.function_name);
          console.log('[DeepgramVoiceAgent]   Arguments:', JSON.stringify(funcMsg.input));
          console.log('[DeepgramVoiceAgent]   Call ID:', funcMsg.function_call_id);
          this.callbacks.onFunctionCall?.(funcMsg.function_name, funcMsg.input, funcMsg.function_call_id);
          this.sendFunctionCallResponse(funcMsg.function_call_id, true);
          break;

        case 'AgentStartedSpeaking':
          console.log('[DeepgramVoiceAgent] Agent started speaking');
          this.callbacks.onAgentSpeaking?.(true);
          break;

        case 'AgentAudioDone':
          console.log('[DeepgramVoiceAgent] Agent audio done');
          this.callbacks.onAgentSpeaking?.(false);
          break;

        case 'UserStartedSpeaking':
          console.log('[DeepgramVoiceAgent] User started speaking');
          break;

        case 'Error':
          console.error('[DeepgramVoiceAgent] Error from server:', message);
          this.callbacks.onError?.(new Error(message.message || 'Unknown error from Deepgram'));
          break;

        default:
          console.log('[DeepgramVoiceAgent] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[DeepgramVoiceAgent] Failed to parse message:', error);
    }
  }

  private sendFunctionCallResponse(callId: string, success: boolean, output?: any): void {
    const response = {
      type: 'FunctionCallResponse',
      function_call_id: callId,
      output: output || { success, message: success ? 'Navigation started' : 'Failed to start navigation' },
    };
    console.log('[DeepgramVoiceAgent] Sending function call response:', response);
    this.send(JSON.stringify(response));
  }

  send(data: string | ArrayBuffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.warn('[DeepgramVoiceAgent] Cannot send - WebSocket not connected');
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
      console.log('[DeepgramVoiceAgent] → Sent audio chunk to WebSocket:', audioData.byteLength, 'bytes');
    } else {
      console.error('[DeepgramVoiceAgent] ✗ Cannot send audio - WebSocket not open!');
      console.error('[DeepgramVoiceAgent]   Current state:', this.ws?.readyState);
      console.error('[DeepgramVoiceAgent]   Expected state: 1 (OPEN)');
    }
  }

  async startListening(): Promise<void> {
    if (this.isRecording) {
      console.warn('[DeepgramVoiceAgent] Already recording');
      return;
    }

    try {
      console.log('[DeepgramVoiceAgent] ========================================');
      console.log('[DeepgramVoiceAgent] Starting audio recording and streaming');
      console.log('[DeepgramVoiceAgent] ========================================');
      
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);
      
      this.recording = recording;
      this.lastFilePosition = 0;
      this.isRecording = true;

      recording.setProgressUpdateInterval(150);
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          this.processAudioStream();
        }
      });

      await recording.startAsync();
      this.recordingUri = recording.getURI();
      console.log('[DeepgramVoiceAgent] ✓ Recording started successfully!');
      console.log('[DeepgramVoiceAgent]   URI:', this.recordingUri);
      console.log('[DeepgramVoiceAgent]   Platform:', Platform.OS);
      console.log('[DeepgramVoiceAgent]   WebSocket state:', this.ws?.readyState);
      console.log('[DeepgramVoiceAgent] Audio will be streamed to Deepgram in real-time');

    } catch (error) {
      console.error('[DeepgramVoiceAgent] Failed to start recording:', error);
      this.isRecording = false;
      this.recording = null;
      throw error;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isRecording || !this.recording) {
      return;
    }

    console.log('[DeepgramVoiceAgent] Stopping recording...');
    
    try {
      await this.recording.stopAndUnloadAsync();
      
      // Process any remaining audio
      await this.processAudioStream();
      
    } catch (error) {
      console.error('[DeepgramVoiceAgent] Error stopping recording:', error);
    } finally {
      this.isRecording = false;
      this.recording = null;
      this.recordingUri = null;
      this.lastFilePosition = 0;
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    }
  }

  private async processAudioStream(): Promise<void> {
    if (!this.recordingUri || !this.isRecording) return;
    
    // Skip file reading on Web as it works differently
    if (Platform.OS === 'web') return;

    try {
      const info = await FileSystem.getInfoAsync(this.recordingUri);
      if (!info.exists) return;

      const currentSize = info.size;
      if (currentSize > this.lastFilePosition) {
        const bytesToRead = currentSize - this.lastFilePosition;
        
        if (bytesToRead > 0) {
          const chunkBase64 = await FileSystem.readAsStringAsync(this.recordingUri, {
            encoding: 'base64',
            position: this.lastFilePosition,
            length: bytesToRead,
          });

          if (chunkBase64) {
             const binaryString = decodeBase64(chunkBase64);
             const bytes = new Uint8Array(binaryString.length);
             for (let i = 0; i < binaryString.length; i++) {
               bytes[i] = binaryString.charCodeAt(i);
             }
             console.log('[DeepgramVoiceAgent] ✓ Streaming audio chunk:', bytes.buffer.byteLength, 'bytes');
             this.sendAudio(bytes.buffer);
          }

          this.lastFilePosition = currentSize;
        }
      }
    } catch (error) {
      console.error('[DeepgramVoiceAgent] ✗ Error processing audio stream:', error);
      console.error('[DeepgramVoiceAgent] Error details:', JSON.stringify(error, null, 2));
    }
  }

  disconnect(): void {
    if (this.recording) {
      this.stopListening().catch(console.error);
    }

    console.log('[DeepgramVoiceAgent] Disconnecting...');
    this.isConnected = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.sound) {
      this.sound.unloadAsync().catch(console.error);
      this.sound = null;
    }

    this.audioQueue = [];
  }

  isActive(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

export interface VoiceAgentSession {
  service: DeepgramVoiceAgentService;
  recording: Audio.Recording | null;
  isListening: boolean;
  transcript: string;
  destination: string | null;
}

export async function createVoiceAgentSession(
  callbacks: DeepgramVoiceAgentCallbacks
): Promise<DeepgramVoiceAgentService> {
  const service = new DeepgramVoiceAgentService(callbacks);
  await service.connect();
  return service;
}

export async function convertAudioToBase64(uri: string): Promise<string> {
  console.log('[DeepgramVoiceAgent] Converting audio to base64...');
  
  const response = await fetch(uri);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function startVoiceRecording(): Promise<Audio.Recording> {
  console.log('[DeepgramVoiceAgent] Starting standalone voice recording...');
  
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  } catch (error) {
    console.warn('[DeepgramVoiceAgent] Audio mode setup warning:', error);
  }

  const recording = new Audio.Recording();
  
  try {
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();
    console.log('[DeepgramVoiceAgent] Recording started');
  } catch (error) {
    console.error('[DeepgramVoiceAgent] Failed to start recording:', error);
    throw new Error('Failed to start audio recording. Please check microphone permissions.');
  }
  
  return recording;
}

export async function stopVoiceRecording(recording: Audio.Recording): Promise<string> {
  console.log('[DeepgramVoiceAgent] Stopping standalone voice recording...');
  
  try {
    await recording.stopAndUnloadAsync();
  } catch (error) {
    console.error('[DeepgramVoiceAgent] Error stopping recording:', error);
  }
  
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  } catch (error) {
    console.warn('[DeepgramVoiceAgent] Audio mode cleanup warning:', error);
  }
  
  const uri = recording.getURI();
  console.log('[DeepgramVoiceAgent] Recording saved to:', uri);
  
  return uri || '';
}

export async function transcribeWithRorkToolkitFallback(audioUri: string): Promise<string> {
  console.log('[DeepgramVoiceAgent] Using Rork Toolkit STT fallback...');
  
  const uriParts = audioUri.split('.');
  const fileExtension = uriParts[uriParts.length - 1] || 'm4a';
  
  const mimeTypes: Record<string, string> = {
    'm4a': 'audio/mp4',
    'mp4': 'audio/mp4',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'aac': 'audio/aac',
    'webm': 'audio/webm',
  };
  
  const mimeType = mimeTypes[fileExtension] || 'audio/m4a';
  const fileName = `recording.${fileExtension}`;

  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    const response = await fetch(audioUri);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: mimeType });
    formData.append('audio', file);
  } else {
    formData.append('audio', {
      uri: audioUri,
      name: fileName,
      type: mimeType,
    } as any);
  }

  const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`STT API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('[DeepgramVoiceAgent] Rork Toolkit STT response:', data);
  
  return data.text || '';
}

