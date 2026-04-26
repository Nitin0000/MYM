import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TextInput, TouchableOpacity, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        console.log("signup response: ", error);
        if (error) throw error;
        Alert.alert(
          'Check your email ✉️',
          'We sent you a confirmation link. Please verify your email then sign in.',
        );
        setMode('signin');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setEmail('');
    setPassword('');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0D0D1A', '#1A1040', '#0D0D1A']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={styles.logoIcon}>
                <LinearGradient colors={Gradients.primary} style={styles.logoGradient}>
                  <Ionicons name="wallet" size={36} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.appName}>MYM</Text>
              <Text style={styles.tagline}>Manage Your Money</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Mode tabs */}
              <View style={styles.modeTabs}>
                {(['signin', 'signup'] as Mode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeTab, mode === m && styles.modeTabActive]}
                    onPress={() => setMode(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                      {m === 'signin' ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Email field */}
              <View style={styles.field}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Email address"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password field */}
              <View style={styles.field}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={mode === 'signin' ? 'password' : 'new-password'}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Primary button */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleEmailAuth}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={Gradients.primary}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google button */}
              <GoogleSignInButton />

              {/* Toggle mode */}
              <TouchableOpacity onPress={toggleMode} style={styles.toggleRow} activeOpacity={0.7}>
                <Text style={styles.toggleText}>
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={styles.toggleLink}>
                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: 40, justifyContent: 'center', flexGrow: 1 },

  circle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(124,110,248,0.12)', top: -80, right: -80,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(52,211,153,0.08)', bottom: 60, left: -60,
  },

  // Logo
  logoSection: { alignItems: 'center', gap: Spacing.sm },
  logoIcon: {
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoGradient: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 42, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 4 },
  tagline: { fontSize: 14, color: Colors.textSecondary, letterSpacing: 1.5 },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },

  // Mode tabs
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
    padding: 4,
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  modeTabActive: { backgroundColor: Colors.primary },
  modeTabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  modeTabTextActive: { color: '#fff' },

  // Fields
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
    height: 52,
  },
  fieldInput: { flex: 1, color: Colors.textPrimary, fontSize: 15 },

  // Primary button
  primaryBtn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnGradient: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.separator },
  dividerText: { fontSize: 13, color: Colors.textMuted },

  // Toggle
  toggleRow: { alignItems: 'center', paddingTop: Spacing.xs },
  toggleText: { fontSize: 14, color: Colors.textSecondary },
  toggleLink: { color: Colors.primary, fontWeight: '700' },
});
