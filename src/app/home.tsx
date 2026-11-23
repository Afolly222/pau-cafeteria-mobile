
import NetInfo from '@react-native-community/netinfo';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';


import { cafeterias } from '../data/cafeterias';
import { useAuth } from '../providers/AuthProvider';

export default function Home() {
  const { session, loading, authenticated, signOut } = useAuth();

  const [search, setSearch] = useState('');
  const [online, setOnline] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(
        state.isConnected === true &&
          state.isInternetReachable !== false
      );
    });

    return () => unsubscribe();
  }, []);

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      Alert.alert(
        'Log out failed',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#102D50" />
      </View>
    );
  }

  if (!authenticated) {
    return <Redirect href="/" />;
  }

  const email = session?.user.email ?? '';
  const studentName =
    session?.user.user_metadata?.full_name ||
    email.split('@')[0] ||
    'Student';

  const filteredCafeterias = cafeterias.filter((store) =>
    store.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandText}>PAU</Text>
          </View>

          <Pressable onPress={logout} disabled={loggingOut}>
            <Text style={styles.logout}>
              {loggingOut ? 'Signing out...' : 'Log out'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.greeting}>Hello, {studentName} 👋</Text>

        <Text style={styles.subtitle}>
          What would you like to eat today?
        </Text>

        <View style={styles.studentBadge}>
          <Text style={styles.verified}>
            ✓ Verified PAU Student
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search cafeterias..."
            placeholderTextColor="#98A2B3"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        <View style={styles.networkCard}>
          <View
            style={[
              styles.networkDot,
              {
                backgroundColor:
                  online === null
                    ? '#98A2B3'
                    : online
                      ? '#16803C'
                      : '#D97706',
              },
            ]}
          />

          <View style={styles.networkTextContainer}>
            <Text style={styles.networkTitle}>
              {online === null
                ? 'Checking connection'
                : online
                  ? 'Connected'
                  : 'Offline mode'}
            </Text>

            <Text style={styles.networkDescription}>
              {online
                ? 'You can browse the cafeteria menus.'
                : 'Showing sample menus stored in the app.'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Campus Cafeterias
          </Text>

          <Text style={styles.storeCount}>
            {filteredCafeterias.length} stores
          </Text>
        </View>

        {filteredCafeterias.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              No cafeterias found
            </Text>

            <Text style={styles.emptyDescription}>
              Try searching with another name.
            </Text>
          </View>
        ) : (
          filteredCafeterias.map((store) => (
            <Pressable
              key={store.id}
              style={styles.storeCard}
              onPress={() =>
                router.push({
                  pathname: '/cafeteria/[id]',
                  params: { id: store.id },
                })
              }
            >
              <View style={styles.storeIcon}>
                <Text style={styles.storeEmoji}>
                  {store.emoji}
                </Text>
              </View>

              <View style={styles.storeDetails}>
                <Text style={styles.storeName}>
                  {store.name}
                </Text>

                <Text style={styles.storeDescription}>
                  {store.description}
                </Text>

                <Text style={styles.browseText}>
                  View menu
                </Text>
              </View>

              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}

        <Pressable
          style={styles.supportCard}
          onPress={() => router.push('/support')}
          accessibilityRole="button"
          accessibilityLabel="Open Help and Support"
        >
          <View style={styles.supportIcon}><Text style={styles.supportEmoji}>?</Text></View>
          <View style={styles.storeDetails}>
            <Text style={styles.storeName}>Help & Support</Text>
            <Text style={styles.storeDescription}>
              Report wallet, payment, order or app issues.
            </Text>
            <Text style={styles.browseText}>Open support center</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Text style={styles.demoNotice}>
          Menu information is currently for prototype testing.
        </Text>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>⌂</Text>
          <Text style={styles.navActive}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/orders')}
        >
          <Text style={styles.navIcon}>▤</Text>
          <Text style={styles.navLabel}>Orders</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/wallet')}
        >
          <Text style={styles.navIcon}>▣</Text>
          <Text style={styles.navLabel}>Wallet</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            Alert.alert(
              'Profile',
              `Signed in as ${email}`
            )
          }
        >
          <Text style={styles.navIcon}>♙</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  supportCard: {
    borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 17,
    padding: 15, flexDirection: 'row', alignItems: 'center',
    marginTop: 18, backgroundColor: '#F8FAFC',
  },
  supportIcon: {
    width: 62, height: 62, borderRadius: 14,
    backgroundColor: '#E5EBF3', justifyContent: 'center',
    alignItems: 'center', marginRight: 13,
  },
  supportEmoji: { color: '#102D50', fontSize: 28, fontWeight: '800' },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  brand: {
    backgroundColor: '#102D50',
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  logout: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 25,
    fontWeight: '800',
    color: '#102D50',
  },
  subtitle: {
    color: '#667085',
    fontSize: 15,
    marginTop: 7,
    marginBottom: 18,
  },
  studentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF3',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginBottom: 25,
  },
  verified: {
    color: '#16803C',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 25,
    color: '#667085',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 54,
    fontSize: 15,
    color: '#102D50',
  },
  networkCard: {
    backgroundColor: '#F3F6FA',
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  networkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  networkTextContainer: {
    flex: 1,
  },
  networkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#102D50',
  },
  networkDescription: {
    fontSize: 12,
    color: '#667085',
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#102D50',
  },
  storeCount: {
    color: '#667085',
    fontSize: 13,
  },
  storeCard: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    backgroundColor: '#FFFFFF',
  },
  storeIcon: {
    width: 62,
    height: 62,
    backgroundColor: '#F3F6FA',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  storeEmoji: {
    fontSize: 29,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102D50',
  },
  storeDescription: {
    fontSize: 12,
    color: '#667085',
    marginTop: 4,
    lineHeight: 18,
  },
  browseText: {
    color: '#1B5F9E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  chevron: {
    fontSize: 30,
    color: '#98A2B3',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#102D50',
  },
  emptyDescription: {
    color: '#667085',
    marginTop: 8,
  },
  demoNotice: {
    fontSize: 11,
    color: '#98A2B3',
    textAlign: 'center',
    marginTop: 15,
  },
  bottomNav: {
    borderTopWidth: 1,
    borderTopColor: '#E4E7EC',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    color: '#102D50',
  },
  navActive: {
    color: '#102D50',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  navLabel: {
    color: '#98A2B3',
    fontSize: 11,
    marginTop: 4,
  },
});