import { Stack } from 'expo-router';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import NetworkBanner from '../components/NetworkBanner';
import { AuthProvider } from '../providers/AuthProvider';
import { CartProvider } from '../providers/CartProvider';
import { NetworkProvider } from '../providers/NetworkProvider';
import { OrderProvider } from '../providers/OrderProvider';
import { SupportProvider } from '../providers/SupportProvider';
import { WalletProvider } from '../providers/WalletProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <CartProvider>
          <OrderProvider>
            <WalletProvider>
              <SupportProvider>
                <SafeAreaView style={styles.safeArea}>
                  <NetworkBanner />
                  <View style={styles.navigator}>
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="signup" />
                      <Stack.Screen name="login" />
                      <Stack.Screen name="verify" />
                      <Stack.Screen name="forgot-password" />
                      <Stack.Screen name="reset-password" />
                      <Stack.Screen name="home" />
                      <Stack.Screen name="cafeteria/[id]" />
                      <Stack.Screen name="cart" />
                      <Stack.Screen name="checkout" />
                      <Stack.Screen name="payment-verification" />
                      <Stack.Screen name="receipt" />
                      <Stack.Screen name="orders" />
                      <Stack.Screen name="order/[id]" />
                      <Stack.Screen name="wallet" />
                      <Stack.Screen name="support" />
                    </Stack>
                  </View>
                </SafeAreaView>
              </SupportProvider>
            </WalletProvider>
          </OrderProvider>
        </CartProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  navigator: { flex: 1 },
});
