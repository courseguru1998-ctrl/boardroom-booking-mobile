import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { campusesApi } from '../../services/campuses';
import type { Campus } from '../../types';
import type { AuthScreenProps } from '../../navigation/types';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string(),
    department: z.string().optional(),
    campusId: z.string().min(1, 'Please select a campus'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [showCampusPicker, setShowCampusPicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: '',
      campusId: '',
    },
  });

  const selectedCampusId = watch('campusId');
  const selectedCampus = campuses.find((c) => c.id === selectedCampusId);

  useEffect(() => {
    loadCampuses();
  }, []);

  const loadCampuses = async () => {
    try {
      const data = await campusesApi.getActive();
      setCampuses(data);
    } catch {
      // Silently fail, user can retry
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const result = await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        campusId: data.campusId,
      });

      if (result.success) {
        Alert.alert(
          'Registration Successful',
          result.message || 'Your account is pending approval. Please wait for admin approval before logging in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign up to start booking rooms
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="First Name"
                      placeholder="First name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.firstName?.message}
                    />
                  )}
                />
              </View>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Last Name"
                      placeholder="Last name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.lastName?.message}
                    />
                  )}
                />
              </View>
            </View>

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
                  placeholder="Create a password"
                  leftIcon="lock-closed-outline"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  leftIcon="lock-closed-outline"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="department"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Department (Optional)"
                  placeholder="e.g. Engineering"
                  leftIcon="briefcase-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.department?.message}
                />
              )}
            />

            {/* Campus Picker */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 }}>
                Campus
              </Text>
              <TouchableOpacity
                onPress={() => setShowCampusPicker(!showCampusPicker)}
                style={{
                  borderWidth: 1.5,
                  borderColor: errors.campusId ? colors.error : colors.border,
                  borderRadius: 12,
                  padding: 12,
                  backgroundColor: colors.surface,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: selectedCampus ? colors.text : colors.textTertiary,
                  }}
                >
                  {selectedCampus ? selectedCampus.name : 'Select a campus'}
                </Text>
              </TouchableOpacity>
              {errors.campusId && (
                <Text style={{ fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 4 }}>
                  {errors.campusId.message}
                </Text>
              )}
              {showCampusPicker && (
                <View
                  style={{
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    maxHeight: 200,
                  }}
                >
                  <ScrollView nestedScrollEnabled>
                    {campuses.map((campus) => (
                      <TouchableOpacity
                        key={campus.id}
                        onPress={() => {
                          setValue('campusId', campus.id);
                          setShowCampusPicker(false);
                        }}
                        style={{
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                          backgroundColor:
                            campus.id === selectedCampusId
                              ? colors.primaryLight
                              : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: 16, color: colors.text }}>
                          {campus.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                          {campus.city}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <Button
              title="Create Account"
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
              Already have an account?{' '}
            </Text>
            <Button
              title="Sign In"
              variant="ghost"
              onPress={() => navigation.navigate('Login')}
              size="sm"
            />
          </View>
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
    padding: 24,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
  },
});
