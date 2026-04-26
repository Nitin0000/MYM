import React from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';
import { Icons } from '@/constants/Icons';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const displayName: string = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email: string = user?.email || '';
  const provider: string = user?.app_metadata?.provider || 'email';
  const joinedDate: string = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  // Initials avatar
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  const infoRows = [
    { icon: Icons.email, label: 'Email', value: email },
    { icon: Icons.name, label: 'Name', value: displayName },
    {
      icon: provider === 'google' ? Icons.google : Icons.password,
      label: 'Sign-in method',
      value: provider === 'google' ? 'Google' : 'Email & Password',
    },
    { icon: Icons.calendar, label: 'Member since', value: joinedDate },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Avatar card */}
        <LinearGradient
          colors={Gradients.balanceCard}
          style={styles.avatarCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.emailText}>{email}</Text>
          <View style={styles.providerBadge}>
            <Ionicons
              name={provider === 'google' ? Icons.google : Icons.mailProvider}
              size={12}
              color={Colors.primary}
            />
            <Text style={styles.providerText}>
              {provider === 'google' ? 'Google account' : 'Email account'}
            </Text>
          </View>
        </LinearGradient>

        {/* Info rows */}
        <View style={styles.infoCard}>
          {infoRows.map((row, i) => (
            <View key={row.label}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={row.icon as any} size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{row.value}</Text>
                </View>
              </View>
              {i < infoRows.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>

        {/* Sign out button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name={Icons.logout} size={20} color={Colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MYM v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 20, gap: Spacing.lg },

  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Avatar card
  avatarCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  displayName: { fontSize: 22, fontWeight: '700', color: '#fff' },
  emailText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: Spacing.xs,
  },
  providerText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Info card
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: 14,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2, fontWeight: '500' },
  infoValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: 66 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: `${Colors.danger}18`,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.danger}40`,
    paddingVertical: 16,
  },
  signOutText: { fontSize: 16, fontWeight: '700', color: Colors.danger },

  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12 },
});
