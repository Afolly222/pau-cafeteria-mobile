import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { isPauEmail, supabase } from '../../lib/supabase';

export default function Verify() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const [busy, setBusy] = useState(false);
  async function resend() {
    if (!isPauEmail(email)) return Alert.alert('Missing email', 'Return to sign up and enter your PAU email.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      Alert.alert('Check your inbox', 'If a verification email can be sent, you will receive it shortly.');
    } catch (err) { Alert.alert('Could not resend', err instanceof Error ? err.message : 'Try again later.'); }
    finally { setBusy(false); }
  }
  return (
    <View style={s.container}>
      <Text style={s.title}>Verify your email</Text>
      <Text style={s.text}>We sent a verification link to:</Text>
      <Text style={s.email}>{email || 'your PAU email address'}</Text>
      <Text style={s.text}>Open the email and confirm your address. Then return to the app and log in. Check your spam folder if needed.</Text>
      <Pressable style={s.button} onPress={() => router.replace('/login')}><Text style={s.buttonText}>Go to Log In</Text></Pressable>
      <Pressable disabled={busy} onPress={resend}>{busy ? <ActivityIndicator /> : <Text style={s.link}>Resend verification email</Text>}</Pressable>
    </View>
  );
}
const s = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#fff' }, title: { fontSize: 30, fontWeight: '800', color: '#102D50', marginBottom: 20 }, text: { fontSize: 16, color: '#667085', lineHeight: 24, marginBottom: 16 }, email: { color: '#102D50', fontWeight: '700', marginBottom: 20 }, button: { backgroundColor: '#102D50', padding: 18, alignItems: 'center', borderRadius: 12, marginTop: 20 }, buttonText: { color: '#fff', fontWeight: '700' }, link: { color: '#102D50', textAlign: 'center', marginTop: 24, fontWeight: '600' } });
