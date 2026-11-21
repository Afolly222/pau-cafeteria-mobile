
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;

    const studentEmail = email.trim().toLowerCase();

    // Check that all fields are completed.
    if (!studentEmail || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email address and password.'
      );
      return;
    }

    // Only PAU student email addresses are accepted.
    if (!studentEmail.endsWith('@pau.edu.ng')) {
      Alert.alert(
        'Invalid email address',
        'Please use your Pan-Atlantic University email address.'
      );
      return;
    }

    setLoading(true);

    try {
      // Authenticate the student with Supabase.
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: studentEmail,
          password: password,
        });

      if (error) {
        if (
          error.message.toLowerCase().includes('email not confirmed')
        ) {
          Alert.alert(
            'Email not verified',
            'Please verify your PAU email address before logging in.',
            [
              {
                text: 'OK',
              },
            ]
          );
          return;
        }

        if (
          error.message.toLowerCase().includes('invalid login')
        ) {
          Alert.alert(
            'Login unsuccessful',
            'Your email or password is incorrect. Please try again.'
          );
          return;
        }

        throw error;
      }

      if (!data.session) {
        Alert.alert(
          'Login unsuccessful',
          'We could not establish your session. Please try again.'
        );
        return;
      }

      // Login successful.
      router.replace('/home');
    } catch (error) {
      Alert.alert(
        'Unable to log in',
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>
        Welcome Back
      </Text>

      <Text style={styles.subtitle}>
        Log in to your PAU Cafeteria account.
      </Text>

      <Text style={styles.label}>
        Email Address
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your PAU email"
        placeholderTextColor="#98A2B3"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <Text style={styles.label}>
        Password
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#98A2B3"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        editable={!loading}
        onSubmitEditing={handleLogin}
      />

      <TouchableOpacity
        onPress={() => router.push('/forgot-password')}
        disabled={loading}
      >
        <Text style={styles.forgot}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Log In
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace('/signup')}
        disabled={loading}
      >
        <Text style={styles.link}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    padding: 28,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#102D50',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#667085',
    marginBottom: 32,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#102D50',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    fontSize: 15,
    color: '#101828',
    backgroundColor: '#FFFFFF',
  },

  forgot: {
    textAlign: 'right',
    color: '#102D50',
    fontWeight: '600',
    marginBottom: 24,
  },

  button: {
    backgroundColor: '#102D50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },

  disabledButton: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  link: {
    textAlign: 'center',
    color: '#102D50',
    marginTop: 26,
    fontWeight: '600',
  },
});
