import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import { useAuthStore } from '../store/authStore';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, setGuest } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateMode = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(15);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const toggleMode = () => {
    setError('');
    setMode(m => m === 'login' ? 'register' : 'login');
    animateMode();
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    setError('');
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      shakeError();
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      shakeError();
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      shakeError();
      return;
    }

    setLoading(true);
    let result;
    if (mode === 'login') {
      result = await signIn(email.trim(), password);
    } else {
      result = await signUp(email.trim(), password, name.trim());
    }
    setLoading(false);

    if (result.error) {
      setError(result.error);
      shakeError();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleGuest = () => {
    setGuest('Traveller');
    router.replace('/(tabs)');
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800' }}
      style={{ flex: 1 }}
      blurRadius={Platform.OS === 'ios' ? 10 : 3}
    >
      <LinearGradient colors={['rgba(6,13,31,0.4)', 'rgba(6,13,31,0.95)', '#060D1F']} style={styles.gradientOverlay}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
              
              <View style={styles.header}>
                <View style={styles.logoBadge}>
                  <Text style={{ fontSize: 28 }}>✈️</Text>
                </View>
                <Text style={styles.title}>TripWise</Text>
                <Text style={styles.subtitle}>Intelligent luxury travel planning</Text>
              </View>

              <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }]}>
                
                {mode === 'register' && (
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={20} color={Colors.creamMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor={Colors.creamSubtle}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                )}

                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={20} color={Colors.creamMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={Colors.creamSubtle}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.creamMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password (min 6 chars)"
                    placeholderTextColor={Colors.creamSubtle}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}

                <TouchableOpacity style={styles.mainBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.mainBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading ? <ActivityIndicator color={Colors.navy} /> : (
                      <Text style={styles.mainBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleText}>
                    {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                  </Text>
                  <TouchableOpacity onPress={toggleMode} activeOpacity={0.7} style={{ padding: 4 }}>
                    <Text style={styles.toggleLink}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} activeOpacity={0.8}>
                  <Text style={styles.guestBtnText}>Continue as Guest</Text>
                </TouchableOpacity>

              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  gradientOverlay: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: Layout.xl },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBadge: { width: 64, height: 64, backgroundColor: 'rgba(245, 166, 35, 0.15)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.3)' },
  title: { fontFamily: Typography.serif, fontSize: 36, color: Colors.cream, letterSpacing: 0.5 },
  subtitle: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.gold, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' },
  
  formContainer: { backgroundColor: 'rgba(11, 20, 38, 0.6)', borderRadius: 24, padding: Layout.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Layout.radiusLg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: Typography.sans, fontSize: Typography.base, color: Colors.cream, height: '100%' },
  errorText: { fontFamily: Typography.sansSemiBold, fontSize: Typography.sm, color: '#FF4C4C', textAlign: 'center', marginBottom: 16 },
  
  mainBtn: { borderRadius: Layout.radiusLg, overflow: 'hidden', marginTop: 8 },
  mainBtnGrad: { height: 56, alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },
  
  toggleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 6 },
  toggleText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },
  toggleLink: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.gold },
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { marginHorizontal: 16, fontFamily: Typography.sansBold, fontSize: 12, color: Colors.creamSubtle },
  
  guestBtn: { height: 56, borderRadius: Layout.radiusLg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  guestBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream },
});
