
import { Redirect, router } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useAuth } from '../providers/AuthProvider';

export default function Home() {
  const { session, loading, authenticated, signOut } = useAuth();

  async function logout() {
    try {
      await signOut();
      router.replace('/app' as never);
    } catch (error) {
      Alert.alert(
        'Log out failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#102D50" />
      </View>
    );
  }

  if (!authenticated) {
    return <Redirect href={'/app' as never} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PAU Cafeteria</Text>

      <Text style={styles.subtitle}>
        Welcome to your campus food ordering app.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Account</Text>

        <Text style={styles.label}>Email address</Text>

        <Text style={styles.email}>
          {session?.user.email ?? 'No email available'}
        </Text>

        <Text style={styles.verified}>
          ✓ Verified PAU Student
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Campus Cafeterias</Text>

      <View style={styles.storeCard}>
        <Text style={styles.storeName}>General Cafeteria</Text>
        <Text style={styles.storeName}>Executive Cafeteria</Text>
        <Text style={styles.storeName}>Terrace Café</Text>
        <Text style={styles.storeName}>SST Snack Bar</Text>
        <Text style={styles.storeName}>Heritage Kitchen</Text>
      </View>

      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#102D50',
  },
  subtitle: {
    fontSize: 15,
    color: '#667085',
    marginTop: 8,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#F3F6FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#102D50',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#667085',
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    color: '#102D50',
    marginTop: 5,
  },
  verified: {
    color: '#16803C',
    fontWeight: '700',
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#102D50',
    marginBottom: 14,
  },
  storeCard: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 14,
    padding: 18,
  },
  storeName: {
    fontSize: 15,
    color: '#344054',
    marginBottom: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#102D50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
