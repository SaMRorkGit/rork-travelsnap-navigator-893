import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const { t } = useSettings();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert(t('common', 'error'), "Please fill in all required fields");
      return;
    }

    if (!isLogin && !fullName) {
      Alert.alert(t('common', 'error'), "Please enter your full name");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          Alert.alert("Sign In Error", error.message);
        } else {
          router.replace("/");
        }
      } else {
        const { error } = await signUp(email.trim(), password, fullName.trim());
        if (error) {
          Alert.alert("Sign Up Error", error.message);
        } else {
          Alert.alert(
            "Success",
            "Account created successfully! Please check your email to verify your account.",
            [
              {
                text: "OK",
                onPress: () => {
                  setIsLogin(true);
                  setPassword("");
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert(t('common', 'error'), "An unexpected error occurred");
      console.error("Auth error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setFullName("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={[styles.welcomeText, { color: colors.text }]}>
                {isLogin ? t('auth', 'welcome') : t('auth', 'signUp')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {isLogin
                  ? t('auth', 'signInSubtitle')
                  : t('auth', 'signUpSubtitle')}
              </Text>
            </View>

            <View style={styles.formContainer}>
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <User size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder={t('auth', 'fullNamePlaceholder')}
                      placeholderTextColor={colors.textSecondary}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      editable={!isSubmitting}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Mail size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('auth', 'emailPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Lock size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('auth', 'passwordPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary, shadowColor: colors.primary },
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {isLogin ? t('auth', 'signIn') : t('auth', 'signUp')}
                    </Text>
                    <ArrowRight color="#FFFFFF" size={20} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={toggleMode}
                disabled={isSubmitting}
              >
                <Text style={[styles.switchButtonText, { color: colors.textSecondary }]}>
                  {isLogin
                    ? t('auth', 'noAccount') + " "
                    : t('auth', 'haveAccount') + " "}
                  <Text style={[styles.switchButtonTextBold, { color: colors.primary }]}>
                    {isLogin ? t('auth', 'signUp') : t('auth', 'signIn')}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    fontWeight: "500",
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  switchButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  switchButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  switchButtonTextBold: {
    fontWeight: "800",
  },
});
