
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import {
    ActivityIndicator,
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
import {
    useOrders,
    type PickupOption,
} from '../providers/OrderProvider';
import { useWallet } from '../providers/WalletProvider';

type PaymentStatus = 'pending' | 'success';

const NAVY = '#172B4D';

function formatPrice(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatPickupTime(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Invalid pickup time';
  }

  return date.toLocaleString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PaymentVerificationScreen() {
  const {
    method,
    pickupOption: pickupOptionParam,
    pickupTime: pickupTimeParam,
  } = useLocalSearchParams<{
    method?: string;
    pickupOption?: string;
    pickupTime?: string;
  }>();

  const {
    items,
    total,
    hydrated: cartReady,
    clearCart,
  } = useCart();

  const {
    createOrder,
    getOrder,
    hydrated: ordersReady,
  } = useOrders();

  const {
    balance,
    hydrated: walletReady,
    payForOrder,
    transactions,
  } = useWallet();

  const { isOnline, isChecking } = useNetwork();

  const [status, setStatus] =
    useState<PaymentStatus>('pending');

  const [processing, setProcessing] = useState(false);

  const processingRef = useRef(false);
  const completedRef = useRef(false);

  const [reference] = useState(
    () =>
      `PAU-${Date.now()}-${Math.floor(
        Math.random() * 100000
      )}`
  );

  const isTransfer = method === 'transfer';

  const paymentMethod = isTransfer
    ? 'Bank Transfer'
    : 'Cafeteria Wallet';

  const pickupOption: PickupOption =
    pickupOptionParam === 'scheduled'
      ? 'scheduled'
      : 'asap';

  const pickupTime =
    pickupOption === 'scheduled'
      ? pickupTimeParam ?? ''
      : '';

  const pickupValid =
    pickupOption === 'asap' ||
    (
      pickupTime.length > 0 &&
      Number.isFinite(Date.parse(pickupTime)) &&
      Date.parse(pickupTime) > Date.now()
    );

  const pickupLabel =
    pickupOption === 'scheduled'
      ? formatPickupTime(pickupTime)
      : 'As soon as possible';

  const storeName =
    items[0]?.cafeteriaName ?? 'Cafeteria';

  const ready =
    cartReady &&
    ordersReady &&
    walletReady &&
    !isChecking;

  const stockIssue = items.reduce<string | null>(
    (issue, item) => {
      if (issue) return issue;

      const menuItem = getCafeteria(
        item.cafeteriaId
      )?.menu.find((food) => food.id === item.id);

      if (!menuItem || !menuItem.available) {
        return `${item.name} is unavailable in the prototype menu.`;
      }

      if (
        menuItem.quantity <= 0 ||
        item.quantity > menuItem.quantity
      ) {
        return `${item.name} exceeds the listed stock quantity.`;
      }

      return null;
    },
    null
  );

  function openReceipt() {
    router.replace({
      pathname: '/receipt',
      params: { reference },
    });
  }

  function handlePayment() {
    if (processingRef.current || completedRef.current) {
      return;
    }

    if (!ready) {
      Alert.alert(
        'Please wait',
        'Your payment details are still loading.'
      );
      return;
    }

    const existingOrder = getOrder(reference);

    if (existingOrder) {
      const walletPaymentRecorded = transactions.some(
        (transaction) =>
          transaction.id === reference &&
          transaction.type === 'purchase' &&
          transaction.status === 'completed' &&
          transaction.amount === existingOrder.total
      );

      if (isTransfer || walletPaymentRecorded) {
        completedRef.current = true;
        setStatus('success');
        openReceipt();
      } else {
        Alert.alert(
          'Order Needs Review',
          'This order exists, but a completed demo wallet payment was not found. Do not pay again for this reference. Review your wallet and order history.'
        );
      }
      return;
    }

    if (!isOnline) {
      Alert.alert(
        'Internet Required',
        'Reconnect before confirming payment.'
      );
      return;
    }

    if (items.length === 0 || total <= 0) {
      Alert.alert(
        'Empty Cart',
        'There are no items to pay for.'
      );
      return;
    }

    if (stockIssue) {
      Alert.alert(
        'Stock Availability Issue',
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

    if (!pickupValid) {
      Alert.alert(
        'Pickup Time Unavailable',
        'Your selected pickup time has passed or is invalid. Return to checkout and choose another time.',
        [
          {
            text: 'Back to Checkout',
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }

    if (!isTransfer && balance < total) {
      Alert.alert(
        'Insufficient Wallet Balance',
        `You need ${formatPrice(total - balance)} more to complete this payment.`,
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

    Alert.alert(
      'Confirm Payment',
      `Pay ${formatPrice(total)} to ${storeName} using ${paymentMethod}?\n\nPickup: ${pickupLabel}\n\nThis is a demo transaction.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Pay Now',
          onPress: () => {
            if (
              processingRef.current ||
              completedRef.current
            ) {
              return;
            }

            if (
              !isOnline ||
              !pickupValid ||
              stockIssue
            ) {
              Alert.alert(
                'Please Review',
                'Your connection, pickup time or stock information needs to be checked again.'
              );
              return;
            }

            processingRef.current = true;
            setProcessing(true);

            try {
              // Deduct only after validation. The wallet provider
              // makes the same reference idempotent.
              if (!isTransfer) {
                const result = payForOrder(
                  total,
                  reference,
                  storeName
                );

                if (!result.success) {
                  Alert.alert(
                    'Payment Unsuccessful',
                    result.message
                  );
                  return;
                }
              }

              // A successful demo wallet charge (or a simulated
              // bank transfer) can now create a paid order.
              const order = createOrder(
                items,
                paymentMethod,
                reference,
                pickupOption,
                pickupOption === 'scheduled'
                  ? pickupTime
                  : null
              );

              if (!order) {
                Alert.alert(
                  'Order Could Not Be Recorded',
                  isTransfer
                    ? 'Your simulated transfer could not be recorded. Keep this screen open and retry with the same reference.'
                    : 'A demo wallet deduction may have been recorded, but the order could not be created. Keep this screen open and retry with the same reference. The wallet will not deduct the same completed payment twice.'
                );
                return;
              }

              completedRef.current = true;
              setStatus('success');
              clearCart();
              openReceipt();
            } finally {
              processingRef.current = false;
              setProcessing(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable
        onPress={() => router.back()}
        disabled={processing || status === 'success'}
      >
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.heading}>
        Payment Verification
      </Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusIcon}>
          {status === 'success' ? '✓' : '◷'}
        </Text>

        <Text style={styles.statusTitle}>
          {status === 'success'
            ? 'Payment Successful'
            : 'Confirm Your Payment'}
        </Text>

        <Text style={styles.statusDescription}>
          {status === 'success'
            ? 'Your demo payment has been recorded and your order has been saved.'
            : 'Review the payment and pickup details before continuing.'}
        </Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailTitle}>
          Payment Details
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Merchant</Text>
          <Text style={styles.value}>{storeName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>
            {formatPrice(total)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Method</Text>
          <Text style={styles.value}>
            {paymentMethod}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Pickup</Text>
          <Text style={styles.value}>
            {pickupLabel}
          </Text>
        </View>

        {!isTransfer && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Wallet Balance
            </Text>
            <Text style={styles.value}>
              {formatPrice(balance)}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Reference</Text>
          <Text style={styles.value}>
            {reference}
          </Text>
        </View>
      </View>

      {stockIssue && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            {stockIssue}
          </Text>
        </View>
      )}

      {!pickupValid && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Your pickup time is no longer valid.
            Return to checkout to choose a new time.
          </Text>
        </View>
      )}

      {status === 'pending' && (
        <Pressable
          style={[
            styles.primaryButton,
            (!ready ||
              processing ||
              !isOnline ||
              Boolean(stockIssue) ||
              !pickupValid) &&
              styles.disabledButton,
          ]}
          disabled={
            !ready ||
            processing ||
            !isOnline ||
            Boolean(stockIssue) ||
            !pickupValid
          }
          onPress={handlePayment}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>
              {!isOnline
                ? 'Reconnect to Pay'
                : !pickupValid
                  ? 'Change Pickup Time'
                  : stockIssue
                    ? 'Review Stock'
                    : `Pay ${formatPrice(total)}`}
            </Text>
          )}
        </Pressable>
      )}

      {status === 'success' && (
        <Pressable
          style={styles.primaryButton}
          onPress={openReceipt}
        >
          <Text style={styles.primaryText}>
            View Digital Receipt
          </Text>
        </Pressable>
      )}

      <Text style={styles.disclaimer}>
        HCI prototype only. Payments and pickup
        preferences are simulated. No real money
        is charged, and no actual cafeteria order
        is submitted.
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
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 50,
  },
  back: {
    fontSize: 18,
    color: NAVY,
    marginBottom: 25,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 25,
  },
  statusCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    marginBottom: 22,
  },
  statusIcon: {
    fontSize: 60,
    color: NAVY,
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  detailsCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 15,
    marginBottom: 22,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 17,
  },
  label: {
    color: '#667085',
    fontSize: 14,
    flex: 1,
  },
  value: {
    color: NAVY,
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  warningCard: {
    backgroundColor: '#FFF4DB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  warningText: {
    color: '#785C20',
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: NAVY,
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: '#98A2B3',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disclaimer: {
    color: '#98A2B3',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 25,
  },
});
