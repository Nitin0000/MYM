import { Colors, Radius, Spacing } from '@/constants/Theme';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  function extractParamsFromUrl(url: string) {
    try {
      const parsedUrl = new URL(url);
      const hash = parsedUrl.hash.substring(1);
      const params = new URLSearchParams(hash);
      return {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
      };
    } catch {
      return { access_token: null, refresh_token: null };
    }
  }

  async function onSignInButtonPress() {
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('/');
      console.log('🔗 Redirect URL:', redirectUrl); // Add this to Supabase redirect list


      const res = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: { prompt: 'consent' },
          skipBrowserRedirect: true,
        },
      });

      const googleOAuthUrl = res.data.url;
      if (!googleOAuthUrl) {
        console.error('No OAuth URL returned');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        googleOAuthUrl,
        redirectUrl,
        { showInRecents: true }
      );

      if (result && result.type === 'success') {
        const params = extractParamsFromUrl(result.url);
        if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        }
      }
    } catch (e) {
      console.error('Google Sign-In error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => { WebBrowser.coolDownAsync(); };
  }, []);

  return (
    <TouchableOpacity
      onPress={onSignInButtonPress}
      style={styles.button}
      activeOpacity={0.75}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} size="small" />
      ) : (
        <>
          <View style={styles.logoWrapper}>
            <Image
              source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
              style={styles.logo}
            />
          </View>
          <Text style={styles.text}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  logoWrapper: {
    width: 22,
    height: 22,
  },
  logo: {
    width: 22,
    height: 22,
  },
  text: {
    fontSize: 16,
    color: '#2D2D2D',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
