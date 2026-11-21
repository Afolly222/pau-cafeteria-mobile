
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (loading) return;

    const fullName = name.trim();
    const studentEmail = email.trim().toLowerCase();

    // Check for empty fields
    if (
      !fullName ||
      !studentEmail ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        'Missing information',
        'Please fill in all fields.'
      );
      return;
    }

    // Only allow PAU student email addresses
    const pauEmailPattern = /^[^\s@]+@pau\.edu\.ng$/i;

    if (!pauEmailPattern.test(studentEmail)) {
      Alert.alert(
        'Invalid student email',
        'Please use your Pan-Atlantic University email address ending in @pau.edu.ng.'
      );
      return;
    }

    // Check password length
    if (password.length < 8) {
      Alert.alert(
        'Weak password',
        'Your password must contain at least 8 characters.'
      );
      return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      Alert.alert(
        'Password mismatch',
        'Your passwords do not match.'
      );
      return;
    }

    setLoading(true);

    try {
      // Create a real student account in Supabase
      const { data, error } = await supabase.auth.signUp({
        email: studentEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          'We could not create your account. Please try again.'
        );
      }

      if (data.session) {
        // A session can be returned if email confirmation
        // is disabled in the Supabase project.
        Alert.alert(
          'Account created',
          'Your account has been created successfully.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/home'),
            },
          ]
        );
      } else {
        // Email confirmation is normally required.
        Alert.alert(
          'Check your email',
          `We have submitted your registration for ${studentEmail}. If confirmation is required, open the verification link sent to your PAU email before logging in.`,
          [
            {
              text: 'Go to Log In',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.';

      Alert.alert('Signup unsuccessful', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Join PAU Cafeteria to order your campus meals.
        </Text>

        <Text style={styles.label}>Full Name</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#98A2B3"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />

        <Text style={styles.label}>Student Email</Text>

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

        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Create a password"
          placeholderTextColor="#98A2B3"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <Text style={styles.label}>Confirm Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          placeholderTextColor="#98A2B3"
          secureTextEntry
          autoCapitalize="none"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/login')}
          disabled={loading}
        >
          <Text style={styles.link}>
            Already have an account? Log In
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 28,
    justifyContent: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#102D50',
    marginBottom: 8,
  },

  subtitle: {
    color: '#667085',
    fontSize: 15,
    marginBottom: 30,
    lineHeight: 23,
  },

  label: {
    color: '#102D50',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
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

  button: {
    backgroundColor: '#102D50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 56,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  link: {
    textAlign: 'center',
    marginTop: 24,
    color: '#102D50',
    fontWeight: '600',
  },
});
