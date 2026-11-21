
import { useRouter } from 'expo-router';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>PAU</Text>
        </View>

        <Text style={styles.university}>
          PAN-ATLANTIC UNIVERSITY
        </Text>

        <Text style={styles.title}>
          PAU Cafeteria
        </Text>

        <Text style={styles.subtitle}>
          Your favourite campus meals, made easier.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryText}>
              Create Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryText}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>
        Made for the PAU community
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logoBox: {
    width: 112,
    height: 112,
    borderRadius: 24,
    backgroundColor: '#102D50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  university: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#102D50',
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#102D50',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    width: '100%',
    marginTop: 55,
    gap: 14,
  },
  primaryButton: {
    backgroundColor: '#102D50',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#102D50',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#102D50',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: '#98A2B3',
    fontSize: 12,
    paddingBottom: 28,
  },
});