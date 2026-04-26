import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
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

        <View style={styles.content}>
          {/* Logo & Branding */}
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <LinearGradient colors={Gradients.primary} style={styles.logoGradient}>
                <Ionicons name="wallet" size={36} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>MYM</Text>
            <Text style={styles.tagline}>Manage Your Money</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Welcome back 👋</Text>
            <Text style={styles.cardBody}>
              Sign in to take control of your finances and track every rupee.
            </Text>
            <GoogleSignInButton />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Secure • Private • Free</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.features}>
              {[
                { icon: 'shield-checkmark', label: 'Bank-grade security' },
                { icon: 'analytics', label: 'Smart insights' },
                { icon: 'sync', label: 'Real-time sync' },
              ].map((f) => (
                <View key={f.label} style={styles.featureItem}>
                  <Ionicons name={f.icon as any} size={16} color={Colors.primary} />
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124,110,248,0.12)',
    top: -80,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(52,211,153,0.08)',
    bottom: 60,
    left: -60,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    gap: 40,
  },
  logoSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
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
  cardHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cardBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.separator,
  },
  dividerText: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
