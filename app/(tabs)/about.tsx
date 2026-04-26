import React from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';

export default function AboutScreen() {
  const phoneNumber = '9350130449';

  const handleCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=91${phoneNumber}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.pageTitle}>About MYM</Text>

        {/* Vision Card */}
        <LinearGradient
          colors={Gradients.balanceCard}
          style={styles.visionCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="bulb-outline" size={32} color="#fff" />
          </View>
          <Text style={styles.visionTitle}>AI-Powered Expense Manager</Text>
          <Text style={styles.visionText}>
            We are building a smart product that not only tracks your expenses but actively helps you optimize them. 
            Our upcoming AI features will analyze your spending habits and provide personalized financial insights.
          </Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Get Expert Recommendations</Text>

        {/* Manager Contact Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <View style={[styles.contactIconWrap, { backgroundColor: `${Colors.primary}22` }]}>
              <Ionicons name="headset" size={24} color={Colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Finance Manager</Text>
              <Text style={styles.contactSubtitle}>Available for consultation</Text>
            </View>
          </View>

          <Text style={styles.contactDesc}>
            For now, you can connect directly with our expert finance managers to get personalized investment and savings recommendations.
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{phoneNumber}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.waBtn]} onPress={handleWhatsApp} activeOpacity={0.8}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

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
    marginBottom: Spacing.xs,
  },

  visionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'flex-start',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  visionTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  visionText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },

  contactCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  contactIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  contactSubtitle: { fontSize: 13, color: Colors.success, fontWeight: '500' },
  contactDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 8,
  },
  callBtn: {
    backgroundColor: Colors.primary,
  },
  waBtn: {
    backgroundColor: '#25D366',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
