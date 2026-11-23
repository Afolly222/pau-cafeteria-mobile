
import { router } from 'expo-router';

import {
    Alert,
    FlatList,
    Image,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    getCafeteria,
    type MenuItem,
} from '../data/cafeterias';

import { useCart } from '../providers/CartProvider';
import { useNetwork } from '../providers/NetworkProvider';

const NAVY = '#172B4D';

function formatPrice(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function findStockIssue(
  items: {
    id: string;
    name: string;
    quantity: number;
    cafeteriaId: string;
  }[]
): string | null {
  for (const item of items) {
    const store = getCafeteria(item.cafeteriaId);

    if (!store) {
      return `The cafeteria for ${item.name} could not be found.`;
    }

    const menuItem: MenuItem | undefined =
      store.menu.find((food) => food.id === item.id);

    if (!menuItem) {
      return `${item.name} is no longer listed in the prototype menu.`;
    }

    if (!menuItem.available || menuItem.quantity <= 0) {
      return `${item.name} is marked as sold out. Please remove it from your cart.`;
    }

    if (item.quantity > menuItem.quantity) {
      return `You selected ${item.quantity} × ${item.name}, but only ${menuItem.quantity} are listed as available. Please reduce the quantity.`;
    }
  }

  return null;
}

export default function CartScreen() {
  const {
    items,
    total,
    itemCount,
    hydrated,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { isOnline, isChecking } = useNetwork();

  const stockIssue = findStockIssue(items);

  function handleIncrease(id: string) {
    const result = increaseQuantity(id);

    if (result === 'stock-limit') {
      Alert.alert(
        'Quantity limit',
        'You have reached the maximum displayed quantity.'
      );
    }
  }

  function handleClear() {
    Alert.alert(
      'Clear cart?',
      'All items will be removed from your cart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  }

  function handleCheckout() {
    if (!hydrated) {
      Alert.alert(
        'Please wait',
        'Your saved cart is still loading.'
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert(
        'Empty cart',
        'Please add food before checking out.'
      );
      return;
    }

    const issue = findStockIssue(items);

    if (issue) {
      Alert.alert('Review your cart', issue);
      return;
    }

    if (isChecking || !isOnline) {
      Alert.alert(
        'Internet required',
        'Your cart is saved. Reconnect before proceeding to payment.'
      );
      return;
    }

    router.push('/checkout');
  }

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Loading your saved cart...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.heading}>Your Cart</Text>
        <Text style={styles.subtitle}>
          Review your order before checkout
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>
            Your cart is empty
          </Text>
          <Text style={styles.emptyText}>
            Explore the cafeterias and add your favourite meals.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/home')}
          >
            <Text style={styles.primaryButtonText}>
              Browse Cafeterias
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.storeBanner}>
            <Text style={styles.storeLabel}>
              Ordering from
            </Text>
            <Text style={styles.storeName}>
              {items[0].cafeteriaName}
            </Text>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const menuItem = getCafeteria(
                item.cafeteriaId
              )?.menu.find(
                (food) => food.id === item.id
              );

              const stock =
                menuItem?.available
                  ? menuItem.quantity
                  : 0;

              const invalid =
                !menuItem ||
                stock <= 0 ||
                item.quantity > stock;

              return (
                <View style={styles.itemCard}>
                  {item.image ? (
                    <Image
                      source={item.image}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.placeholderText}>
                        🍽️
                      </Text>
                    </View>
                  )}

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>
                      {item.name}
                    </Text>

                    <Text style={styles.price}>
                      {formatPrice(item.price)}
                    </Text>

                    <Text style={styles.subtotal}>
                      Subtotal:{' '}
                      {formatPrice(
                        item.price * item.quantity
                      )}
                    </Text>

                    <Text
                      style={[
                        styles.stockText,
                        invalid && styles.stockError,
                      ]}
                    >
                      {!menuItem || stock <= 0
                        ? 'Sold out in prototype menu'
                        : invalid
                          ? `Only ${stock} listed available`
                          : `${stock} listed available`}
                    </Text>

                    <View style={styles.itemActions}>
                      <View style={styles.quantityControls}>
                        <Pressable
                          style={styles.quantityButton}
                          onPress={() =>
                            decreaseQuantity(item.id)
                          }
                        >
                          <Text style={styles.quantityText}>
                            −
                          </Text>
                        </Pressable>

                        <Text style={styles.quantityValue}>
                          {item.quantity}
                        </Text>

                        <Pressable
                          style={[
                            styles.quantityButton,
                            item.quantity >= stock &&
                              styles.disabledQuantityButton,
                          ]}
                          disabled={item.quantity >= stock}
                          onPress={() =>
                            handleIncrease(item.id)
                          }
                        >
                          <Text style={styles.quantityText}>
                            +
                          </Text>
                        </Pressable>
                      </View>

                      <Pressable
                        onPress={() => removeItem(item.id)}
                      >
                        <Text style={styles.removeText}>
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Items
              </Text>
              <Text style={styles.summaryValue}>
                {itemCount}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>
                Total
              </Text>
              <Text style={styles.totalValue}>
                {formatPrice(total)}
              </Text>
            </View>

            {stockIssue && (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  {stockIssue}
                </Text>
              </View>
            )}

            <Text style={styles.verificationNote}>
              Stock quantities are prototype values, not
              confirmed live inventory. Internet access
              is required to continue to payment.
            </Text>

            <Pressable
              style={[
                styles.primaryButton,
                (Boolean(stockIssue) ||
                  !isOnline ||
                  isChecking) &&
                  styles.disabledButton,
              ]}
              onPress={handleCheckout}
            >
              <Text style={styles.primaryButtonText}>
                {stockIssue
                  ? 'Review Cart to Continue'
                  : !isOnline || isChecking
                    ? 'Reconnect to Checkout'
                    : 'Proceed to Checkout'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Text style={styles.clearText}>
                Clear Cart
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
  },
  backText: {
    color: NAVY,
    fontSize: 18,
    marginBottom: 18,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: NAVY,
  },
  subtitle: {
    color: '#667085',
    fontSize: 15,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 65,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: NAVY,
  },
  emptyText: {
    color: '#667085',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 25,
    lineHeight: 23,
  },
  storeBanner: {
    backgroundColor: '#EFF4FB',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 15,
    padding: 17,
  },
  storeLabel: {
    color: '#667085',
    fontSize: 13,
  },
  storeName: {
    fontSize: 19,
    fontWeight: '700',
    color: NAVY,
    marginTop: 5,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  itemImage: {
    width: 85,
    height: 90,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 85,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 35,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },
  price: {
    fontSize: 15,
    color: '#344054',
    marginTop: 6,
  },
  subtotal: {
    fontSize: 13,
    color: '#667085',
    marginTop: 6,
  },
  stockText: {
    color: '#16804A',
    fontSize: 12,
    marginTop: 7,
  },
  stockError: {
    color: '#B42318',
    fontWeight: '700',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: '#EFF2F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledQuantityButton: {
    opacity: 0.4,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },
  removeText: {
    color: '#B42318',
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E8EBF0',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 15,
  },
  summaryValue: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: NAVY,
  },
  verificationNote: {
    fontSize: 12,
    color: '#667085',
    lineHeight: 18,
    marginTop: 8,
  },
  warning: {
    backgroundColor: '#FEE4E2',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  warningText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    backgroundColor: NAVY,
    borderRadius: 13,
    padding: 17,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#98A2B3',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  clearButton: {
    alignItems: 'center',
    padding: 15,
  },
  clearText: {
    color: '#B42318',
    fontWeight: '600',
  },
});
