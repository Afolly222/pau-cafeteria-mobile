
import * as Linking from 'expo-linking';
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { isPauEmail, supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const studentEmail = email.trim().toLowerCase();

    if (!isPauEmail(studentEmail)) {
      Alert.alert(
        'PAU email required',
        'Please use your student email ending in @pau.edu.ng.'
      );
      return;
    }

    setBusy(true);

    try {
      const redirectUrl = Linking.createURL('reset-password');

      const { error } = await supabase.auth.resetPasswordForEmail(
        studentEmail,
        {
          redirectTo: redirectUrl,
        }
      );

      if (error) {
        throw error;
      }

      Alert.alert(
        'Check your email',
        'If an account exists for this address, you will receive a password reset email shortly.'
      );
    } catch (error) {
      Alert.alert(
        'Request failed',
        error instanceof Error
          ? error.message
          : 'Unable to send the password reset email.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password?</Text>

      <Text style={styles.subtitle}>
        Enter your PAU student email to receive a password reset link.
      </Text>

      <Text style={styles.label}>Student Email</Text>

      <TextInput
        style={styles.input}
        placeholder="studentname@pau.edu.ng"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        editable={!busy}
      />

      <Pressable
        style={[styles.button, busy && styles.disabledButton]}
        onPress={submit}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Send Reset Email
          </Text>
        )}
      </Pressable>
    </View>
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
    fontSize: 30,
    fontWeight: '800',
    color: '#102D50',
  },
  subtitle: {
    color: '#667085',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 32,
  },
  label: {
    color: '#102D50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 24,
    color: '#101828',
  },
  button: {
    backgroundColor: '#102D50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
