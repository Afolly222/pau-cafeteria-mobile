
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  getAvailabilityLabel,
  getAvailabilityStatus,
  getCafeteria,
  type MenuItem,
} from '../../data/cafeterias';

import { useCart } from '../../providers/CartProvider';
import { useNetwork } from '../../providers/NetworkProvider';

const NAVY = '#172B4D';

function FoodPhoto({
  item,
  emoji,
}: {
  item: MenuItem;
  emoji: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!item.image || failed) {
    return (
      <View style={styles.imagePlaceholder}>
        <Text style={styles.placeholderEmoji}>
          {emoji}
        </Text>
        <Text style={styles.placeholderLabel}>
          {failed ? 'Image unavailable' : 'No photo'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.imageFrame}>
      {!loaded && (
        <View style={styles.loadingPlaceholder}>
          <Text style={styles.loadingText}>
            Loading photo...
          </Text>
        </View>
      )}

      <Image
        source={item.image}
        style={styles.foodImage}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
        onError={(event) => {
          console.warn(
            'Food image failed:',
            item.name,
            event.nativeEvent.error
          );
          setFailed(true);
        }}
      />
    </View>
  );
}

export default function CafeteriaMenu() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const store = getCafeteria(id ?? '');

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const { isOnline, isChecking } = useNetwork();

  const {
    items: cartItems,
    addItem,
    itemCount,
    hydrated,
  } = useCart();

  const offline = !isOnline && !isChecking;

  const availableCount =
    store?.menu.filter(
      (item) => getAvailabilityStatus(item) !== 'sold-out'
    ).length ?? 0;

  const soldOutCount =
    store?.menu.filter(
      (item) => getAvailabilityStatus(item) === 'sold-out'
    ).length ?? 0;

  const items = useMemo(() => {
    if (!store) return [];

    return store.menu.filter((item) => {
      const matchesCategory =
        category === 'All' ||
        item.category === category;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesAvailability =
        !availableOnly ||
        getAvailabilityStatus(item) !== 'sold-out';

      return (
        matchesCategory &&
        matchesSearch &&
        matchesAvailability
      );
    });
  }, [store, category, search, availableOnly]);

  function handleAdd(item: MenuItem) {
    if (!store) return;

    if (getAvailabilityStatus(item) === 'sold-out') {
      Alert.alert(
        'Sold Out',
        'This item is currently marked as unavailable in the prototype menu.'
      );
      return;
    }

    const result = addItem(item, store.id, store.name);

    if (result === 'added') {
      Alert.alert(
        'Added to Cart',
        `${item.name} has been added successfully.`,
        [
          { text: 'Continue Shopping' },
          {
            text: 'View Cart',
            onPress: () => router.push('/cart'),
          },
        ]
      );
      return;
    }

    if (result === 'different-store') {
      Alert.alert(
        'Different Cafeteria',
        'Your cart contains food from another cafeteria. Complete or clear that cart before ordering here.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Cart',
            onPress: () => router.push('/cart'),
          },
        ]
      );
      return;
    }

    if (result === 'stock-limit') {
      Alert.alert(
        'Quantity Limit Reached',
        'You have reached the maximum displayed quantity.'
      );
      return;
    }

    if (result === 'not-ready') {
      Alert.alert(
        'Please Wait',
        'Your saved cart is still loading.'
      );
      return;
    }

    Alert.alert(
      'Unavailable',
      'This item cannot be added to the cart.'
    );
  }

  if (!store) {
    return (
      <View style={styles.center}>
        <Text>Cafeteria not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topRow}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.cartButton}
          onPress={() => router.push('/cart')}
        >
          <Text style={styles.cartButtonText}>
            🛒 Cart ({itemCount})
          </Text>
        </Pressable>
      </View>

      <View style={styles.logoArea}>
        <Text style={styles.logoEmoji}>
          {store.emoji}
        </Text>
      </View>

      <Text style={styles.storeName}>
        {store.name}
      </Text>

      <Text style={styles.storeDescription}>
        {store.description}
      </Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>ⓘ</Text>
        <Text style={styles.infoText}>
          {store.serviceInfo}
        </Text>
      </View>

      <View style={styles.availabilitySummary}>
        <View style={styles.summaryTop}>
          <Text style={styles.summaryHeading}>
            Menu Availability
          </Text>

          <View
            style={[
              styles.connectionBadge,
              offline
                ? styles.offlineBadge
                : styles.onlineBadge,
            ]}
          >
            <Text
              style={[
                styles.connectionText,
                offline
                  ? styles.offlineText
                  : styles.onlineText,
              ]}
            >
              {isChecking
                ? 'Checking connection'
                : offline
                  ? 'Offline'
                  : 'Online'}
            </Text>
          </View>
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.availableNumber}>
              {availableCount}
            </Text>
            <Text style={styles.statLabel}>
              Listed Available
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.soldOutNumber}>
              {soldOutCount}
            </Text>
            <Text style={styles.statLabel}>
              Listed Sold Out
            </Text>
          </View>
        </View>

        <Text style={styles.dataDisclaimer}>
          Availability and quantities are sample
          prototype data, not live cafeteria inventory.
        </Text>
      </View>

      {offline && (
        <View style={styles.offlineNotice}>
          <Text style={styles.offlineNoticeTitle}>
            Offline Browsing Mode
          </Text>

          <Text style={styles.offlineNoticeText}>
            You can still browse the menu, view food
            images and add items to your cart.
            Availability cannot be verified while
            offline. Complete your payment when
            your connection returns.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Explore Menu
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={styles.categoryContent}
      >
        {store.categories.map((categoryItem) => (
          <Pressable
            key={categoryItem}
            onPress={() => setCategory(categoryItem)}
            style={[
              styles.categoryButton,
              category === categoryItem &&
                styles.activeCategory,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                category === categoryItem &&
                  styles.activeCategoryText,
              ]}
            >
              {categoryItem}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search food and drinks..."
        placeholderTextColor="#98A2B3"
        style={styles.searchInput}
      />

      <Pressable
        style={styles.filterRow}
        onPress={() => setAvailableOnly((value) => !value)}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: availableOnly,
        }}
      >
        <View
          style={[
            styles.checkbox,
            availableOnly && styles.checkedBox,
          ]}
        >
          {availableOnly && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>

        <View style={styles.filterInfo}>
          <Text style={styles.filterTitle}>
            Show Available Items Only
          </Text>
          <Text style={styles.filterDescription}>
            Hide items marked as sold out
          </Text>
        </View>
      </Pressable>

      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {items.length}{' '}
          {items.length === 1 ? 'item' : 'items'} found
        </Text>

        {(search.trim() ||
          category !== 'All' ||
          availableOnly) && (
          <Pressable
            onPress={() => {
              setSearch('');
              setCategory('All');
              setAvailableOnly(false);
            }}
          >
            <Text style={styles.clearText}>
              Clear Filters
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        {items.map((item) => {
          const selectedQuantity =
            cartItems.find(
              (cartItem) => cartItem.id === item.id
            )?.quantity ?? 0;

          const status = getAvailabilityStatus(item);
          const unavailable = status === 'sold-out';

          const atLimit =
            selectedQuantity >= item.quantity;

          return (
            <View key={item.id} style={styles.foodCard}>
              <View style={styles.photoContainer}>
                <Pressable
                  onPress={() => handleAdd(item)}
                  disabled={unavailable || !hydrated}
                >
                  <FoodPhoto
                    item={item}
                    emoji={store.emoji}
                  />
                </Pressable>

                <View
                  style={[
                    styles.statusBadge,
                    status === 'available'
                      ? styles.availableBadge
                      : status === 'low-stock'
                        ? styles.lowStockBadge
                        : styles.soldOutBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      status === 'available'
                        ? styles.availableBadgeText
                        : status === 'low-stock'
                          ? styles.lowStockBadgeText
                          : styles.soldOutBadgeText,
                    ]}
                  >
                    {getAvailabilityLabel(item)}
                  </Text>
                </View>
              </View>

              <Text
                style={styles.foodName}
                numberOfLines={2}
              >
                {item.name}
              </Text>

              <Text
                style={styles.foodDescription}
                numberOfLines={2}
              >
                {item.description}
              </Text>

              <Text style={styles.price}>
                ₦{item.price.toLocaleString('en-NG')}
              </Text>

              <Text
                style={[
                  styles.quantity,
                  unavailable && styles.unavailableText,
                  status === 'low-stock' &&
                    styles.lowStockText,
                ]}
              >
                {unavailable
                  ? 'Currently unavailable'
                  : status === 'low-stock'
                    ? `Only ${item.quantity} listed left`
                    : `${item.quantity} listed in stock`}
              </Text>

              {selectedQuantity > 0 && (
                <Text style={styles.inCartText}>
                  {selectedQuantity} in your cart
                </Text>
              )}

              <Pressable
                style={[
                  styles.addButton,
                  (unavailable ||
                    atLimit ||
                    !hydrated) &&
                    styles.disabledButton,
                ]}
                disabled={
                  unavailable ||
                  atLimit ||
                  !hydrated
                }
                onPress={() => handleAdd(item)}
              >
                <Text style={styles.addButtonText}>
                  {unavailable
                    ? 'Sold Out'
                    : atLimit
                      ? 'Limit Reached'
                      : !hydrated
                        ? 'Loading...'
                        : '+ Add to Cart'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {items.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔎</Text>
          <Text style={styles.emptyTitle}>
            No matching items
          </Text>
          <Text style={styles.emptyText}>
            Try another search or change your filters.
          </Text>
        </View>
      )}

      {itemCount > 0 && (
        <Pressable
          style={styles.bottomCartButton}
          onPress={() => router.push('/cart')}
        >
          <Text style={styles.bottomCartText}>
            View Cart ({itemCount})
          </Text>
        </Pressable>
      )}

      <Text style={styles.footerNote}>
        PAU Cafeteria · Offline-friendly HCI prototype
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 36,
    color: NAVY,
    marginRight: 12,
  },
  backText: {
    fontSize: 16,
    color: '#667085',
  },
  cartButton: {
    backgroundColor: NAVY,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  logoArea: {
    height: 165,
    backgroundColor: NAVY,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 75,
  },
  storeName: {
    fontSize: 27,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 8,
  },
  storeDescription: {
    fontSize: 14,
    color: '#667085',
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 24,
    color: '#1645A3',
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: NAVY,
    flex: 1,
    lineHeight: 21,
  },
  availabilitySummary: {
    backgroundColor: '#F6F8FC',
    borderRadius: 15,
    padding: 17,
    marginBottom: 20,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  summaryHeading: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '800',
  },
  connectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlineBadge: {
    backgroundColor: '#DDF7E9',
  },
  offlineBadge: {
    backgroundColor: '#FFF0D6',
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  onlineText: {
    color: '#16804A',
  },
  offlineText: {
    color: '#946200',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    height: 45,
    width: 1,
    backgroundColor: '#D0D5DD',
  },
  availableNumber: {
    color: '#16804A',
    fontSize: 27,
    fontWeight: '800',
  },
  soldOutNumber: {
    color: '#B42318',
    fontSize: 27,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#667085',
    marginTop: 5,
  },
  dataDisclaimer: {
    fontSize: 11,
    color: '#667085',
    lineHeight: 17,
    textAlign: 'center',
  },
  offlineNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0D38C',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
  },
  offlineNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#785C20',
  },
  offlineNoticeText: {
    fontSize: 12,
    color: '#785C20',
    lineHeight: 19,
    marginTop: 7,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 15,
  },
  categories: {
    marginBottom: 20,
  },
  categoryContent: {
    backgroundColor: '#F6F7F9',
    borderRadius: 12,
    padding: 5,
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  activeCategory: {
    backgroundColor: '#FFFFFF',
  },
  categoryText: {
    color: '#98A2B3',
    fontSize: 15,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: NAVY,
  },
  searchInput: {
    backgroundColor: '#F6F7F9',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    marginBottom: 18,
    color: NAVY,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 12,
    marginBottom: 18,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#98A2B3',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  filterInfo: {
    flex: 1,
  },
  filterTitle: {
    fontSize: 14,
    color: NAVY,
    fontWeight: '700',
  },
  filterDescription: {
    color: '#667085',
    fontSize: 11,
    marginTop: 3,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  resultsText: {
    fontSize: 13,
    color: '#667085',
  },
  clearText: {
    fontSize: 13,
    color: '#1645A3',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  foodCard: {
    width: '48%',
    marginBottom: 30,
  },
  photoContainer: {
    position: 'relative',
  },
  imageFrame: {
    width: '100%',
    height: 145,
    backgroundColor: '#F2F4F7',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
 loadingPlaceholder: {
  ...StyleSheet.absoluteFill,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#F2F4F7',
},
  loadingText: {
    color: '#98A2B3',
    fontSize: 11,
  },
  imagePlaceholder: {
    width: '100%',
    height: 145,
    borderRadius: 15,
    backgroundColor: '#EFF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 44,
  },
  placeholderLabel: {
    color: '#667085',
    fontSize: 11,
    marginTop: 6,
  },
  statusBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  availableBadge: {
    backgroundColor: '#DDF7E9',
  },
  lowStockBadge: {
    backgroundColor: '#FFF0D6',
  },
  soldOutBadge: {
    backgroundColor: '#FEE4E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  availableBadgeText: {
    color: '#16804A',
  },
  lowStockBadgeText: {
    color: '#946200',
  },
  soldOutBadgeText: {
    color: '#B42318',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
    marginTop: 12,
    minHeight: 40,
  },
  foodDescription: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    minHeight: 32,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginTop: 8,
  },
  quantity: {
    fontSize: 12,
    color: '#1645A3',
    marginTop: 7,
  },
  unavailableText: {
    color: '#B42318',
  },
  lowStockText: {
    color: '#946200',
    fontWeight: '700',
  },
  inCartText: {
    color: '#16804A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
  },
  addButton: {
    marginTop: 12,
    backgroundColor: NAVY,
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#98A2B3',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 35,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    color: NAVY,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
    marginTop: 7,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomCartButton: {
    backgroundColor: NAVY,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 15,
  },
  bottomCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerNote: {
    textAlign: 'center',
    color: '#98A2B3',
    fontSize: 11,
    marginTop: 30,
  },
});
