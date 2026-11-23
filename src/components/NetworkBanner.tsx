import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNetwork } from '../providers/NetworkProvider';

export default function NetworkBanner() {
  const { isOnline, isChecking, refreshConnection } = useNetwork();
  const [showReconnected, setShowReconnected] = useState(false);
  const previousOnline = useRef<boolean | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isChecking) return;
    if (previousOnline.current === false && isOnline) {
      setShowReconnected(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setShowReconnected(false), 3500);
    } else if (!isOnline) {
      setShowReconnected(false);
      if (timer.current) clearTimeout(timer.current);
    }
    previousOnline.current = isOnline;
  }, [isOnline, isChecking]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (isChecking && previousOnline.current === null) {
    return (
      <View style={styles.checking}>
        <ActivityIndicator size="small" color="#172B4D" />
        <Text style={styles.checkingText}>Checking connection...</Text>
      </View>
    );
  }

  if (isOnline) {
    if (!showReconnected) return null;
    return (
      <View style={styles.reconnected} accessibilityRole="alert">
        <Text style={styles.reconnectedText}>
          Connection restored. Review your cart and payment details before continuing.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.icon}>!</Text>
      <View style={styles.message}>
        <Text style={styles.title}>You're browsing offline</Text>
        <Text style={styles.description}>
          Saved menus, cart and orders are available. Reconnect to pay.
        </Text>
      </View>
      <Pressable
        style={[styles.retry, isChecking && styles.retryDisabled]}
        onPress={() => void refreshConnection()}
        disabled={isChecking}
        accessibilityRole="button"
        accessibilityLabel="Retry internet connection"
      >
        {isChecking ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.retryText}>Retry</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4DB',
    borderBottomColor: '#E9D39C', borderBottomWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  icon: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#8A6116',
    color: '#FFFFFF', textAlign: 'center', textAlignVertical: 'center',
    fontWeight: '800', fontSize: 16, overflow: 'hidden',
  },
  message: { flex: 1 },
  title: { fontSize: 13, fontWeight: '800', color: '#674A16' },
  description: { fontSize: 11, lineHeight: 16, color: '#785C20', marginTop: 2 },
  retry: { backgroundColor: '#172B4D', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 9 },
  retryDisabled: { opacity: 0.7 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  checking: {
    backgroundColor: '#EFF4FB', flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: 10, gap: 8,
  },
  checkingText: { color: '#172B4D', fontSize: 12 },
  reconnected: {
    backgroundColor: '#E8F5ED', paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#B7DFC5',
  },
  reconnectedText: { color: '#1D6538', fontSize: 12, fontWeight: '700', lineHeight: 18 },
});
