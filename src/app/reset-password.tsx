
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

// Extract recovery parameters from the email link.
function parseParams(url: string): URLSearchParams {
  const fragment = url.includes('#')
    ? url.split('#')[1]
    : '';

  const query = url.includes('?')
    ? url.split('?')[1].split('#')[0]
    : '';

  return new URLSearchParams(fragment || query);
}

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    let active = true;

    async function accept(url: string | null) {
      if (!url || !active) {
        if (active) setChecking(false);
        return;
      }

      setChecking(true);

      const params = parseParams(url);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      const errorDescription = params.get('error_description');

      try {
        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (active) setReady(true);
        } else if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) throw error;

          if (active) setReady(true);
        } else {
          if (active) setReady(false);
        }
      } catch (error) {
        if (active) {
          setReady(false);

          Alert.alert(
            'Reset link invalid',
            error instanceof Error
              ? error.message
              : 'Please request a new password reset email.'
          );
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    Linking.getInitialURL()
      .then(accept)
      .catch(() => {
        if (active) setChecking(false);
      });

    const subscription = Linking.addEventListener(
      'url',
      (event) => {
        accept(event.url);
      }
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  async function submit() {
    if (!ready || busy) return;

    if (password.length < 8) {
      Alert.alert(
        'Password too short',
        'Your password must contain at least 8 characters.'
      );
      return;
    }

    if (password !== confirm) {
      Alert.alert(
        'Passwords do not match',
        'Please make sure both passwords are the same.'
      );
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      Alert.alert(
        'Password updated',
        'Your password has been changed successfully. Please log in with your new password.',
        [
          {
            text: 'Log In',
            onPress: () => {
              router.replace('/login' as any);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Set a new password
      </Text>

      {checking ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#102D50" />

          <Text style={styles.text}>
            Verifying your password reset link...
          </Text>
        </View>
      ) : !ready ? (
        <Text style={styles.text}>
          Open this page using the password reset link
          sent to your PAU email address.

          {'\n\n'}

          If your link has expired, return to the
          Forgot Password screen and request a new one.
        </Text>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Enter your new password below.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="New password (8+ characters)"
            placeholderTextColor="#98A2B3"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            editable={!busy}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#98A2B3"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={confirm}
            onChangeText={setConfirm}
            editable={!busy}
          />

          <Pressable
            style={[
              styles.button,
              busy && styles.disabledButton,
            ]}
            disabled={busy}
            onPress={submit}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                Update password
              </Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 30,
    color: '#102D50',
    fontWeight: '800',
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 15,
    color: '#667085',
    lineHeight: 24,
    marginBottom: 24,
  },

  text: {
    color: '#667085',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
  },

  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 18,
    fontSize: 16,
    color: '#102D50',
  },

  button: {
    backgroundColor: '#102D50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
