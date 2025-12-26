import { router } from "expo-router";
import { Check, Mic, RotateCcw } from "lucide-react-native";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";

import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import {
  transcribeAudio,
  startAudioRecording,
  stopAudioRecording,
} from "@/lib/speakDestinationApi";

export default function VoiceInputScreen() {
  const { t } = useSettings();
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const requestPermissions = useCallback(async () => {
    const audioPermission = await Audio.requestPermissionsAsync();
    if (audioPermission.status !== 'granted') {
      Alert.alert('Permission Required', 'Microphone permission is required for voice input');
      return false;
    }
    return true;
  }, []);

  const startListening = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        t('voice', 'alertTitle'),
        t('voice', 'alertMessage')
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }

    try {
      setIsListening(true);
      setRecognizedText("");
      setIsProcessing(false);

      const recording = await startAudioRecording();
      recordingRef.current = recording;
    } catch (error) {
      console.error('[VoiceInput] Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsListening(false);
    }
  }, [t, requestPermissions]);

  const stopListening = useCallback(async () => {
    if (!recordingRef.current) {
      return;
    }

    setIsListening(false);
    setIsProcessing(true);

    try {
      const recording = recordingRef.current;
      const audioUri = await stopAudioRecording(recording);
      
      if (!audioUri) {
        throw new Error('Failed to get audio recording');
      }

      console.log('[VoiceInput] Transcribing audio');
      const result = await transcribeAudio(audioUri);
      
      if (!result.transcript || result.transcript.trim() === '') {
        throw new Error('Could not understand speech. Please try again.');
      }

      console.log('[VoiceInput] Transcript:', result.transcript);
      setRecognizedText(result.transcript);
      
      const iHeard = t('voice', 'iHeard').replace(':', ''); 
      Speech.speak(`${iHeard} ${result.transcript}`);
    } catch (error) {
      console.error('[VoiceInput] Error processing audio:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to process audio. Please try again.'
      );
      setRecognizedText("");
    } finally {
      setIsProcessing(false);
      recordingRef.current = null;
    }
  }, [t]);

  useEffect(() => {
    // Auto-start listening when component mounts
    startListening();
  }, [startListening]);

  useEffect(() => {
    // Cleanup: stop recording if component unmounts
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);

  const handleConfirmDestination = () => {
     if (recognizedText) {
        // We need to navigate back to Home stack's destination screen
        // The destination screen is now in (tabs)/(home)/destination
        router.push({
          pathname: "/main/home/destination" as any,
          params: { address: recognizedText }
        });
        // Or we could replace? "Core flows must not expose Profile..."
        // If we push, back button goes to Voice Input. 
        // Better to probably replace or dismiss to home then push destination.
        // But simpler to just push to destination for now.
     }
  };

  const handleTryAgain = () => {
      setRecognizedText("");
      startListening();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <View style={styles.content}>
              <View style={styles.voiceContainer}>
                  {isListening ? (
                      <View style={styles.listeningState}>
                           <View style={styles.micCircle}>
                              <Mic color={Colors.primary} size={64} strokeWidth={2} />
                           </View>
                           <Text style={styles.listeningText}>{t('voice', 'listening')}</Text>
                           <TouchableOpacity 
                               style={styles.stopButton} 
                               onPress={stopListening}
                               activeOpacity={0.8}
                           >
                               <Text style={styles.stopButtonText}>Stop Recording</Text>
                           </TouchableOpacity>
                      </View>
                  ) : isProcessing ? (
                      <View style={styles.listeningState}>
                           <View style={styles.micCircle}>
                              <Mic color={Colors.primary} size={64} strokeWidth={2} />
                           </View>
                           <Text style={styles.listeningText}>Processing...</Text>
                      </View>
                  ) : (
                      <View style={styles.confirmationState}>
                          <Text style={styles.recognizedLabel}>{t('voice', 'iHeard')}</Text>
                          <Text style={styles.recognizedText}>{recognizedText}</Text>
                          
                          <View style={styles.confirmationActions}>
                              <TouchableOpacity 
                                  style={[styles.primaryButton, styles.confirmButton]} 
                                  onPress={handleConfirmDestination}
                                  activeOpacity={0.8}
                              >
                                  <Check color="#FFFFFF" size={24} strokeWidth={2.5} />
                                  <Text style={styles.primaryButtonText}>{t('voice', 'confirmDestination')}</Text>
                              </TouchableOpacity>

                              <TouchableOpacity 
                                  style={styles.tryAgainButton} 
                                  onPress={handleTryAgain}
                                  activeOpacity={0.8}
                              >
                                  <RotateCcw color="#FFFFFF" size={20} />
                                  <Text style={styles.tryAgainText}>{t('voice', 'tryAgain')}</Text>
                              </TouchableOpacity>
                          </View>
                      </View>
                  )}
                   {!isListening && (
                       <TouchableOpacity 
                          style={styles.cancelVoiceButton} 
                          onPress={handleCancel}
                       >
                           <Text style={styles.cancelVoiceText}>{t('voice', 'cancel')}</Text>
                       </TouchableOpacity>
                   )}
                   {isListening && (
                       <TouchableOpacity 
                          style={styles.cancelVoiceButton} 
                          onPress={handleCancel}
                       >
                           <Text style={styles.cancelVoiceText}>{t('voice', 'cancel')}</Text>
                       </TouchableOpacity>
                   )}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  voiceContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  listeningState: {
      alignItems: 'center',
      gap: 24,
  },
  micCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "#FFFFFF",
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 10,
  },
  listeningText: {
      fontSize: 24,
      fontWeight: '600',
      color: "#FFFFFF",
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
  },
  confirmationState: {
      width: '100%',
      alignItems: 'center',
      gap: 16,
  },
  recognizedLabel: {
      fontSize: 18,
      color: "rgba(255, 255, 255, 0.8)",
  },
  recognizedText: {
      fontSize: 32,
      fontWeight: '700',
      color: "#FFFFFF",
      textAlign: 'center',
      marginBottom: 32,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
  },
  confirmationActions: {
      width: '100%',
      gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  confirmButton: {
      width: '100%',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
  },
  tryAgainButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      gap: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
  },
  tryAgainText: {
      fontSize: 16,
      fontWeight: '600',
      color: "#FFFFFF",
  },
  stopButton: {
      marginTop: 24,
      paddingVertical: 14,
      paddingHorizontal: 28,
      backgroundColor: 'rgba(255, 59, 48, 0.9)',
      borderRadius: 14,
  },
  stopButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: "#FFFFFF",
  },
  cancelVoiceButton: {
      marginTop: 40,
      padding: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 30,
      paddingHorizontal: 24,
  },
  cancelVoiceText: {
      fontSize: 16,
      color: "#FFFFFF",
      fontWeight: "500",
  },
});
