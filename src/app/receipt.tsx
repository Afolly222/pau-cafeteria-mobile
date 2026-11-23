
import { router, useLocalSearchParams } from 'expo-router';

import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useOrders } from '../providers/OrderProvider';

const NAVY = '#172B4D';

function formatPickupTime(value?: string | null) {
  if (!value) return 'Not specified';

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Not specified';
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

export default function ReceiptScreen() {
  const { reference } = useLocalSearchParams<{
    reference?: string;
  }>();

  const { getOrder, hydrated } = useOrders();

  const order = getOrder(reference ?? '');

  if (!hydrated) {
    return (
      <View style={styles.center}>
        <Text>Loading receipt...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>
          Receipt not found
        </Text>

        <Pressable
          onPress={() => router.replace('/orders')}
        >
          <Text style={styles.link}>
            View My Orders
          </Text>
        </Pressable>
      </View>
    );
  }

  const pickupLabel =
    order.pickupOption === 'scheduled'
      ? formatPickupTime(order.pickupTime)
      : order.pickupOption === 'asap'
        ? 'As soon as possible'
        : 'Not specified';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.successIcon}>
        <Text style={styles.check}>✓</Text>
      </View>

      <Text style={styles.heading}>
        Payment Successful
      </Text>

      <Text style={styles.subtitle}>
        Your simulated payment has been recorded.
      </Text>

      <View style={styles.receiptCard}>
        <Text style={styles.receiptHeading}>
          Digital Receipt
        </Text>

        <Text style={styles.brand}>
          PAU Cafeteria
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Merchant</Text>
          <Text style={styles.value}>
            {order.cafeteriaName}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>
            ₦{order.total.toLocaleString('en-NG')}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>
            Payment method
          </Text>
          <Text style={styles.value}>
            {order.paymentMethod}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>
            Payment reference
          </Text>
          <Text style={styles.value}>
            {order.id}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>
          Pickup Information
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>
            Pickup preference
          </Text>
          <Text style={styles.value}>
            {order.pickupOption === 'scheduled'
              ? 'Scheduled Pickup'
              : order.pickupOption === 'asap'
                ? 'As Soon As Possible'
                : 'Not specified'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>
            Preferred pickup time
          </Text>
          <Text style={styles.value}>
            {pickupLabel}
          </Text>
        </View>

        <Text style={styles.pickupNotice}>
          This is a demonstration pickup preference,
          not a confirmed cafeteria reservation.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>
          Order Items
        </Text>

        {order.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.label}>
              {item.quantity} × {item.name}
            </Text>

            <Text style={styles.value}>
              ₦{(
                item.price * item.quantity
              ).toLocaleString('en-NG')}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>
            Order status
          </Text>
          <Text style={styles.value}>
            {order.status}
          </Text>
        </View>

        <Text style={styles.successLabel}>
          SIMULATED PAYMENT SUCCESSFUL
        </Text>
      </View>

      <Text style={styles.notice}>
        This is a demonstration receipt for HCI
        testing. No real payment was processed and
        no cafeteria order was submitted.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() =>
          router.replace({
            pathname: '/order/[id]',
            params: { id: order.id },
          })
        }
      >
        <Text style={styles.buttonText}>
          Track Order
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.replace('/orders')}
      >
        <Text style={styles.secondaryText}>
          View My Orders
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.replace('/home')}
      >
        <Text style={styles.secondaryText}>
          Back to Cafeterias
        </Text>
      </Pressable>
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
    paddingTop: 65,
    paddingBottom: 50,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: '#E7F8EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  check: {
    fontSize: 46,
    color: '#16804A',
    fontWeight: '700',
  },
  heading: {
    fontSize: 27,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#667085',
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center',
  },
  receiptCard: {
    width: '100%',
    padding: 22,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  receiptHeading: {
    fontSize: 23,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  brand: {
    fontSize: 15,
    color: '#667085',
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D5DD',
    borderStyle: 'dashed',
    marginVertical: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#667085',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: NAVY,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 20,
  },
  pickupNotice: {
    color: '#785C20',
    backgroundColor: '#FFF4DB',
    padding: 12,
    borderRadius: 10,
    fontSize: 12,
    lineHeight: 19,
  },
  successLabel: {
    color: '#16804A',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 13,
  },
  notice: {
    fontSize: 12,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 24,
  },
  button: {
    backgroundColor: NAVY,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  secondaryText: {
    color: NAVY,
    fontWeight: '700',
  },
  link: {
    color: '#1645A3',
    marginTop: 20,
  },
});
