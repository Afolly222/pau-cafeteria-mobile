
import { router } from 'expo-router';
import { useState } from 'react';

import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { getCafeteria } from '../data/cafeterias';
import { useCart } from '../providers/CartProvider';
import { useNetwork } from '../providers/NetworkProvider';
import { useWallet } from '../providers/WalletProvider';

type PaymentMethod = 'wallet' | 'transfer';
type PickupOption = 'asap' | 'scheduled';

const NAVY = '#172B4D';

function formatPrice(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function getPickupSlots() {
  const now = new Date();
  const slots: { label: string; value: string }[] = [];

  // Demo pickup slots: every 30 minutes,
  // starting at least 30 minutes from now.
  const first = new Date(now.getTime() + 30 * 60000);
  first.setMinutes(
    Math.ceil(first.getMinutes() / 30) * 30,
    0,
    0
  );

  for (let i = 0; i < 12; i++) {
    const slot = new Date(
      first.getTime() + i * 30 * 60000
    );

    slots.push({
      value: slot.toISOString(),
      label: slot.toLocaleString('en-NG', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }),
    });
  }

  return slots;
}

export default function CheckoutScreen() {
  const { items, total, itemCount, hydrated } = useCart();

  const {
    isOnline,
    isChecking,
    refreshConnection,
  } = useNetwork();

  const {
    balance,
    hydrated: walletReady,
  } = useWallet();

  const [method, setMethod] =
    useState<PaymentMethod>('wallet');

  const [pickupOption, setPickupOption] =
    useState<PickupOption>('asap');

  const [selectedPickupTime, setSelectedPickupTime] =
    useState<string | null>(null);

  const [pickupSlots] = useState(getPickupSlots);

  const insufficientFunds =
    method === 'wallet' &&
    walletReady &&
    balance < total;

  const stockIssue = items.reduce<string | null>(
    (issue, item) => {
      if (issue) return issue;

      const menuItem = getCafeteria(
        item.cafeteriaId
      )?.menu.find((food) => food.id === item.id);

      if (!menuItem || !menuItem.available) {
        return `${item.name} is marked as unavailable.`;
      }

      if (
        menuItem.quantity <= 0 ||
        item.quantity > menuItem.quantity
      ) {
        return `${item.name}: requested quantity exceeds the listed stock.`;
      }

      return null;
    },
    null
  );

  const pickupValid =
    pickupOption === 'asap' ||
    (
      selectedPickupTime !== null &&
      new Date(selectedPickupTime).getTime() >
        Date.now()
    );

  const canContinue =
    hydrated &&
    walletReady &&
    items.length > 0 &&
    isOnline &&
    !isChecking &&
    !insufficientFunds &&
    !stockIssue &&
    pickupValid;

  function handleContinue() {
    if (!hydrated || items.length === 0) {
      Alert.alert(
        'Empty cart',
        'Add food before checking out.'
      );
      return;
    }

    if (stockIssue) {
      Alert.alert(
        'Stock issue',
        stockIssue,
        [
          {
            text: 'Review Cart',
            onPress: () => router.push('/cart'),
          },
        ]
      );
      return;
    }

    if (isChecking || !isOnline) {
      Alert.alert(
        'Internet required',
        'Reconnect before making a payment.'
      );
      return;
    }

    if (!walletReady) {
      Alert.alert(
        'Please wait',
        'Your wallet is still loading.'
      );
      return;
    }

    if (!pickupValid) {
      Alert.alert(
        'Select a pickup time',
        'Choose a future pickup time or select As soon as possible.'
      );
      return;
    }

    if (method === 'wallet' && balance < total) {
      Alert.alert(
        'Insufficient Wallet Balance',
        `Your balance is ${formatPrice(balance)}, but your order costs ${formatPrice(total)}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Money',
            onPress: () => router.push('/wallet'),
          },
        ]
      );
      return;
    }

    router.push({
      pathname: '/payment-verification',
      params: {
        method,
        pickupOption,
        pickupTime:
          pickupOption === 'scheduled'
            ? selectedPickupTime ?? ''
            : '',
      },
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.heading}>Checkout</Text>

      <Text style={styles.subtitle}>
        Review your order, choose a pickup time and
        select a payment method.
      </Text>

      {items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            Your cart is empty.
          </Text>

          <Pressable
            onPress={() => router.replace('/home')}
          >
            <Text style={styles.link}>
              Browse cafeterias
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Order Summary
            </Text>

            <Text style={styles.store}>
              {items[0].cafeteriaName}
            </Text>

            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.quantity} × {item.name}
                </Text>

                <Text style={styles.itemPrice}>
                  {formatPrice(
                    item.price * item.quantity
                  )}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.itemRow}>
              <Text style={styles.muted}>Items</Text>
              <Text>{itemCount}</Text>
            </View>

            <View style={styles.itemRow}>
              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text style={styles.totalValue}>
                {formatPrice(total)}
              </Text>
            </View>
          </View>

          {stockIssue && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>
                Review Stock Availability
              </Text>

              <Text style={styles.warningText}>
                {stockIssue}
              </Text>

              <Pressable
                style={styles.smallButton}
                onPress={() => router.push('/cart')}
              >
                <Text style={styles.smallButtonText}>
                  Review Cart
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.sectionTitle}>
            Pickup Preference
          </Text>

          <Pressable
            style={[
              styles.paymentOption,
              pickupOption === 'asap' &&
                styles.selectedOption,
            ]}
            onPress={() => {
              setPickupOption('asap');
              setSelectedPickupTime(null);
            }}
          >
            <Text style={styles.optionIcon}>◷</Text>

            <View style={styles.optionDetails}>
              <Text style={styles.optionTitle}>
                As Soon As Possible
              </Text>

              <Text style={styles.muted}>
                Pick up when your order is ready
              </Text>
            </View>

            <Text style={styles.radio}>
              {pickupOption === 'asap' ? '◉' : '○'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.paymentOption,
              pickupOption === 'scheduled' &&
                styles.selectedOption,
            ]}
            onPress={() => setPickupOption('scheduled')}
          >
            <Text style={styles.optionIcon}>▦</Text>

            <View style={styles.optionDetails}>
              <Text style={styles.optionTitle}>
                Schedule for Later
              </Text>

              <Text style={styles.muted}>
                Choose a preferred pickup time
              </Text>
            </View>

            <Text style={styles.radio}>
              {pickupOption === 'scheduled' ? '◉' : '○'}
            </Text>
          </Pressable>

          {pickupOption === 'scheduled' && (
            <View style={styles.card}>
              <Text style={styles.slotHeading}>
                Select Pickup Time
              </Text>

              <Text style={styles.muted}>
                Choose from the demonstration time slots.
              </Text>

              <View style={styles.slotList}>
                {pickupSlots.map((slot) => {
                  const selected =
                    selectedPickupTime === slot.value;

                  return (
                    <Pressable
                      key={slot.value}
                      style={[
                        styles.slot,
                        selected && styles.selectedSlot,
                      ]}
                      onPress={() =>
                        setSelectedPickupTime(slot.value)
                      }
                    >
                      <Text
                        style={[
                          styles.slotText,
                          selected &&
                            styles.selectedSlotText,
                        ]}
                      >
                        {slot.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>
            Payment Method
          </Text>

          <Pressable
            style={[
              styles.paymentOption,
              method === 'wallet' &&
                styles.selectedOption,
            ]}
            onPress={() => setMethod('wallet')}
          >
            <Text style={styles.optionIcon}>▣</Text>

            <View style={styles.optionDetails}>
              <Text style={styles.optionTitle}>
                Cafeteria Wallet
              </Text>

              <Text style={styles.muted}>
                Available:{' '}
                {walletReady
                  ? formatPrice(balance)
                  : 'Loading...'}
              </Text>
            </View>

            <Text style={styles.radio}>
              {method === 'wallet' ? '◉' : '○'}
            </Text>
          </Pressable>

          {insufficientFunds && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>
                Insufficient Wallet Balance
              </Text>

              <Text style={styles.warningText}>
                You need{' '}
                {formatPrice(total - balance)} more
                to complete this order.
              </Text>

              <Pressable
                style={styles.smallButton}
                onPress={() => router.push('/wallet')}
              >
                <Text style={styles.smallButtonText}>
                  + Add Money
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={[
              styles.paymentOption,
              method === 'transfer' &&
                styles.selectedOption,
            ]}
            onPress={() => setMethod('transfer')}
          >
            <Text style={styles.optionIcon}>▤</Text>

            <View style={styles.optionDetails}>
              <Text style={styles.optionTitle}>
                Bank Transfer
              </Text>

              <Text style={styles.muted}>
                Demo transfer payment
              </Text>
            </View>

            <Text style={styles.radio}>
              {method === 'transfer' ? '◉' : '○'}
            </Text>
          </Pressable>

          {!isOnline && !isChecking && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>
                Internet Connection Required
              </Text>

              <Text style={styles.warningText}>
                Your cart is saved. Reconnect to
                continue with payment.
              </Text>

              <Pressable
                style={styles.smallButton}
                onPress={() =>
                  void refreshConnection()
                }
              >
                <Text style={styles.smallButtonText}>
                  Check Connection
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              HCI prototype: payments are simulated.
              Pickup times are preferences only and
              are not confirmed by cafeteria staff.
              Stock is checked against sample menu data.
            </Text>
          </View>

          <Pressable
            style={[
              styles.button,
              !canContinue && styles.disabledButton,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>
              {isChecking
                ? 'Checking Connection...'
                : !isOnline
                  ? 'Reconnect to Continue'
                  : stockIssue
                    ? 'Review Stock Availability'
                    : !pickupValid
                      ? 'Select Pickup Time'
                      : insufficientFunds
                        ? 'Add Money to Continue'
                        : 'Continue to Payment'}
            </Text>
          </Pressable>
        </>
      )}
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
    paddingBottom: 50,
  },
  back: {
    fontSize: 18,
    color: NAVY,
    marginBottom: 25,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: NAVY,
  },
  subtitle: {
    color: '#667085',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 22,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 16,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 15,
  },
  store: {
    fontSize: 15,
    fontWeight: '600',
    color: '#667085',
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  itemName: {
    flex: 1,
    color: '#344054',
    fontSize: 14,
  },
  itemPrice: {
    color: NAVY,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7EC',
    marginVertical: 12,
  },
  muted: {
    color: '#667085',
    fontSize: 14,
  },
  totalLabel: {
    fontSize: 19,
    fontWeight: '700',
    color: NAVY,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 14,
    padding: 17,
    marginBottom: 13,
  },
  selectedOption: {
    borderColor: NAVY,
    backgroundColor: '#F2F5FA',
  },
  optionIcon: {
    fontSize: 24,
    color: NAVY,
    marginRight: 15,
  },
  optionDetails: {
    flex: 1,
    gap: 5,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },
  radio: {
    fontSize: 22,
    color: NAVY,
  },
  slotHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 8,
  },
  slotList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  slot: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  selectedSlot: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  slotText: {
    fontSize: 12,
    color: NAVY,
    fontWeight: '600',
  },
  selectedSlotText: {
    color: '#FFFFFF',
  },
  warningCard: {
    backgroundColor: '#FFF4DB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#785C20',
  },
  warningText: {
    fontSize: 13,
    color: '#785C20',
    marginTop: 7,
    lineHeight: 20,
  },
  smallButton: {
    backgroundColor: NAVY,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 13,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  notice: {
    backgroundColor: '#F2F5FA',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },
  noticeText: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    backgroundColor: NAVY,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 25,
  },
  disabledButton: {
    backgroundColor: '#98A2B3',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  link: {
    color: NAVY,
    fontWeight: '700',
    marginTop: 12,
  },
});
