import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import type { AuthScreenProps } from '../../navigation/types';

// Official Jain University logo URL
const JGI_LOGO_URL = 'https://www.jainuniversity.ac.in/jain/theme/assets/images/Jain-logo.png';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const result = await login(data);
      if (!result.success) {
        Alert.alert('Login Failed', result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Gradient colors for header - matching web app's JGI Navy
  const gradientColors = isDark
    ? ['#0F1D32', '#132037', '#0A1628']
    : ['#001c54', '#002366', '#001040'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* JGI Header - Like Web App */}
          <View style={[styles.jgiHeader, { backgroundColor: gradientColors[0] }]}>
            {/* Background pattern */}
            <View style={styles.headerPattern}>
              <View style={[styles.goldGlow1, { backgroundColor: 'rgba(201, 162, 39, 0.2)' }]} />
              <View style={[styles.goldGlow2, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
            </View>

            {/* Logo Container */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoImageContainer, { backgroundColor: '#FFF' }]}>
                <Image
                  source={{ uri: JGI_LOGO_URL }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Gold accent line */}
            <View style={styles.goldLine} />

            {/* Title and Tagline */}
            <Text style={styles.mainTitle}>Boardroom Booking</Text>
            <Text style={styles.tagline}>Reserve. Collaborate. Succeed.</Text>
          </View>

          {/* Login Form Card */}
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Welcome back
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Sign in to your account to continue
            </Text>

            {/* Form */}
            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    leftIcon="mail-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    leftIcon="lock-closed-outline"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                )}
              />

              <Button
                title="Sign In"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: 8 }}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <Button
                title="Sign Up"
                variant="ghost"
                onPress={() => navigation.navigate('Register')}
                size="sm"
              />
            </View>
          </View>

          {/* Copyright */}
          <Text style={[styles.copyright, { color: colors.textTertiary }]}>
            © {new Date().getFullYear()} Jain (Deemed-to-be University). All rights reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  // JGI Header Styles
  jgiHeader: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  goldGlow1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  goldGlow2: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoImageContainer: {
    width: 180,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  goldLine: {
    width: 80,
    height: 3,
    backgroundColor: '#c9a227',
    borderRadius: 2,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: '#c9a227',
    marginTop: 8,
    textAlign: 'center',
  },
  // Form Card
  formCard: {
    margin: 20,
    marginTop: -20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  form: {
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
