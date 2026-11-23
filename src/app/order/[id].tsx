
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    useOrders,
    type OrderStatus,
    type SavedOrder,
} from '../../providers/OrderProvider';

import { useNetwork } from '../../providers/NetworkProvider';

const NAVY = '#172B4D';

const STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Completed',
];

const DESCRIPTIONS = [
  'Your prototype order has been recorded.',
  'The order has been marked as confirmed.',
  'The order has been marked as preparing.',
  'The order is marked ready for collection.',
  'The order has been marked as completed.',
];

const REFUND_REASONS = [
  'Payment issue',
  'Order not received',
  'Incorrect order',
  'Food unavailable',
  'Other',
];

function formatPrice(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
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

function getPickupInformation(order: SavedOrder) {
  if (order.pickupOption === 'scheduled') {
    return {
      title: 'Scheduled Pickup',
      value: order.pickupTime
        ? formatDate(order.pickupTime)
        : 'Time unavailable',
      description:
        'This is your preferred pickup time. It has not been confirmed by cafeteria staff.',
    };
  }

  if (order.pickupOption === 'asap') {
    return {
      title: 'As Soon As Possible',
      value: 'Pick up when marked ready',
      description:
        'Check the order progress for the prototype pickup-ready status.',
    };
  }

  return {
    title: 'Pickup Preference',
    value: 'Not recorded',
    description:
      'This order was saved before pickup scheduling was introduced.',
  };
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const {
    getOrder,
    requestRefund,
    hydrated,
  } = useOrders();

  const { isOnline, isChecking } = useNetwork();

  const [showRefundForm, setShowRefundForm] =
    useState(false);

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const order = getOrder(id ?? '');

  function submitRefund() {
    if (!order) return;

    if (!reason.trim()) {
      Alert.alert(
        'Select a reason',
        'Please select a reason for your refund request.'
      );
      return;
    }

    if (reason === 'Other' && !details.trim()) {
      Alert.alert(
        'Additional details required',
        'Please explain the issue before submitting.'
      );
      return;
    }

    Alert.alert(
      'Submit Refund Request',
      `Submit a refund request for ${formatPrice(order.total)}? This does not automatically return money.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            const result = requestRefund(
              order.id,
              reason,
              details
            );

            if (!result.success) {
              Alert.alert(
                'Request not submitted',
                result.message
              );
              return;
            }

            setShowRefundForm(false);
            setReason('');
            setDetails('');

            Alert.alert(
              'Request Submitted',
              'Your prototype refund request is now pending review. You can track its status here.'
            );
          },
        },
      ]
    );
  }

  if (!hydrated) {
    return (
      <View style={styles.center}>
        <Text>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>
          Order not found
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

  const currentIndex = STATUSES.indexOf(order.status);
  const pickup = getPickupInformation(order);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.heading}>
        Order Tracking
      </Text>

      <Text style={styles.reference}>
        {order.id}
      </Text>

      {!isChecking && !isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineTitle}>
            Offline Order History
          </Text>

          <Text style={styles.offlineText}>
            You are viewing order details saved on
            this device. The displayed status is not
            a live update from the cafeteria.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.store}>
          {order.cafeteriaName}
        </Text>

        <Text style={styles.muted}>
          Ordered: {formatDate(order.createdAt)}
        </Text>

        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>
            {order.status}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Order Items
        </Text>

        {order.items.map((item) => (
          <View key={item.id} style={styles.row}>
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

        <View style={styles.row}>
          <Text style={styles.totalLabel}>
            Total
          </Text>

          <Text style={styles.total}>
            {formatPrice(order.total)}
          </Text>
        </View>

        <Text style={styles.payment}>
          Payment: {order.paymentStatus} (Demo)
        </Text>

        <Text style={styles.paymentMethod}>
          Method: {order.paymentMethod}
        </Text>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/receipt',
              params: { reference: order.id },
            })
          }
        >
          <Text style={styles.link}>
            View Digital Receipt
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        Pickup Information
      </Text>

      <View style={styles.pickupCard}>
        <Text style={styles.pickupIcon}>◷</Text>

        <Text style={styles.pickupTitle}>
          {pickup.title}
        </Text>

        <Text style={styles.pickupValue}>
          {pickup.value}
        </Text>

        <Text style={styles.pickupDescription}>
          {pickup.description}
        </Text>
      </View>

      {order.status === 'Ready for Pickup' && (
        <View style={styles.readyCard}>
          <Text style={styles.readyIcon}>✓</Text>

          <Text style={styles.readyTitle}>
            Your Order Is Ready for Pickup
          </Text>

          <Text style={styles.readyDescription}>
            This prototype order has reached the
            Ready for Pickup stage. In the real app,
            this would indicate that your food is
            ready for collection at{' '}
            {order.cafeteriaName}.
          </Text>

          <Text style={styles.readyNote}>
            Demonstration status only. Please do
            not visit the cafeteria based on this message.
          </Text>
        </View>
      )}

      {order.status === 'Completed' && (
        <View style={styles.completedCard}>
          <Text style={styles.completedTitle}>
            ✓ Order Completed
          </Text>

          <Text style={styles.completedDescription}>
            This prototype order has been marked
            as completed.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Order Progress
      </Text>

      <View style={styles.timeline}>
        {STATUSES.map((status, index) => {
          const completed =
            currentIndex >= 0 &&
            index <= currentIndex;

          const current = index === currentIndex;

          return (
            <View key={status} style={styles.step}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.dot,
                    completed && styles.activeDot,
                    current && styles.currentDot,
                  ]}
                >
                  <Text
                    style={[
                      styles.dotText,
                      completed && styles.activeDotText,
                    ]}
                  >
                    {completed ? '✓' : index + 1}
                  </Text>
                </View>

                {index < STATUSES.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      index < currentIndex &&
                        styles.activeConnector,
                    ]}
                  />
                )}
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepTitle,
                    completed && styles.activeStepTitle,
                  ]}
                >
                  {status}
                </Text>

                <Text style={styles.stepDescription}>
                  {DESCRIPTIONS[index]}
                </Text>

                {current && (
                  <Text style={styles.currentLabel}>
                    Current prototype status
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.refundSection}>
        <Text style={styles.sectionTitle}>
          Payment or Order Issue?
        </Text>

        <Text style={styles.muted}>
          If something went wrong with your payment
          or order, you can submit a prototype
          refund request.
        </Text>

        {order.refundRequest ? (
          <View style={styles.refundStatusCard}>
            <Text style={styles.refundHeading}>
              Refund Request
            </Text>

            <Text style={styles.refundStatus}>
              {order.refundRequest.status}
            </Text>

            <Text style={styles.refundDetail}>
              Reason: {order.refundRequest.reason}
            </Text>

            {order.refundRequest.details ? (
              <Text style={styles.refundDetail}>
                Details: {order.refundRequest.details}
              </Text>
            ) : null}

            <Text style={styles.refundDetail}>
              Reference: {order.refundRequest.id}
            </Text>

            <Text style={styles.refundDetail}>
              Submitted:{' '}
              {formatDate(
                order.refundRequest.requestedAt
              )}
            </Text>

            <Text style={styles.refundNote}>
              This is a saved prototype request.
              No real refund has been processed.
            </Text>
          </View>
        ) : showRefundForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              Why are you requesting a refund?
            </Text>

            {REFUND_REASONS.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.reasonOption,
                  reason === option &&
                    styles.reasonSelected,
                ]}
                onPress={() => setReason(option)}
              >
                <Text style={styles.reasonText}>
                  {reason === option ? '◉' : '○'}{' '}
                  {option}
                </Text>
              </Pressable>
            ))}

            <Text style={styles.fieldLabel}>
              Additional Details
            </Text>

            <TextInput
              style={styles.textArea}
              multiline
              textAlignVertical="top"
              placeholder="Describe what happened..."
              placeholderTextColor="#98A2B3"
              value={details}
              onChangeText={setDetails}
              maxLength={500}
            />

            <Pressable
              style={[
                styles.button,
                !reason && styles.disabledButton,
              ]}
              disabled={!reason}
              onPress={submitRefund}
            >
              <Text style={styles.buttonText}>
                Submit Refund Request
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setShowRefundForm(false);
                setReason('');
                setDetails('');
              }}
            >
              <Text style={styles.secondaryText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.button}
            onPress={() => setShowRefundForm(true)}
          >
            <Text style={styles.buttonText}>
              Request a Refund
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.disclaimer}>
        Order tracking, pickup information and
        refund requests are demonstrations.
        They are not connected to cafeteria staff
        or a real payment provider.
      </Text>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.replace('/orders')}
      >
        <Text style={styles.secondaryText}>
          Back to My Orders
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
    paddingTop: 20,
    paddingBottom: 55,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  back: {
    fontSize: 18,
    color: NAVY,
    marginBottom: 25,
  },
  heading: {
    fontSize: 29,
    fontWeight: '800',
    color: NAVY,
  },
  reference: {
    fontSize: 14,
    color: '#667085',
    marginTop: 8,
    marginBottom: 25,
  },
  offlineBanner: {
    backgroundColor: '#FFF4DB',
    borderRadius: 13,
    padding: 15,
    marginBottom: 22,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#785C20',
  },
  offlineText: {
    fontSize: 12,
    lineHeight: 19,
    color: '#785C20',
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
  },
  store: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
  },
  muted: {
    color: '#667085',
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
  },
  statusPill: {
    backgroundColor: '#EFF4FB',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 15,
  },
  statusPillText: {
    color: '#1645A3',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: NAVY,
    marginTop: 22,
    marginBottom: 17,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#344054',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7EC',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
  },
  total: {
    fontSize: 21,
    fontWeight: '800',
    color: NAVY,
  },
  payment: {
    color: '#16804A',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  paymentMethod: {
    color: '#667085',
    fontSize: 13,
    marginTop: 7,
  },
  pickupCard: {
    backgroundColor: '#F2F5FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
  },
  pickupIcon: {
    fontSize: 32,
    color: NAVY,
    marginBottom: 10,
  },
  pickupTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
  },
  pickupValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1645A3',
    marginTop: 10,
    lineHeight: 23,
  },
  pickupDescription: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  readyCard: {
    backgroundColor: '#E7F8EF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  readyIcon: {
    color: '#16804A',
    fontSize: 34,
    fontWeight: '800',
  },
  readyTitle: {
    color: '#16804A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  readyDescription: {
    color: '#16804A',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },
  readyNote: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 12,
  },
  completedCard: {
    backgroundColor: '#F2F4F7',
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
  },
  completedTitle: {
    color: NAVY,
    fontWeight: '800',
    fontSize: 16,
  },
  completedDescription: {
    color: '#667085',
    fontSize: 13,
    marginTop: 7,
    lineHeight: 20,
  },
  timeline: {
    marginTop: 8,
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 88,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 36,
  },
  dot: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    backgroundColor: NAVY,
  },
  currentDot: {
    borderWidth: 3,
    borderColor: '#B8C9E2',
  },
  dotText: {
    color: '#98A2B3',
    fontWeight: '800',
  },
  activeDotText: {
    color: '#FFFFFF',
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E4E7EC',
    marginVertical: 5,
  },
  activeConnector: {
    backgroundColor: NAVY,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 18,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#98A2B3',
  },
  activeStepTitle: {
    color: NAVY,
  },
  stepDescription: {
    fontSize: 13,
    color: '#667085',
    marginTop: 6,
    lineHeight: 19,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1645A3',
    marginTop: 8,
  },
  refundSection: {
    borderTopWidth: 1,
    borderTopColor: '#E4E7EC',
    paddingTop: 10,
  },
  refundStatusCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 14,
    padding: 18,
    marginTop: 17,
  },
  refundHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
  },
  refundStatus: {
    color: '#946200',
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  refundDetail: {
    fontSize: 13,
    color: '#344054',
    lineHeight: 20,
    marginTop: 6,
  },
  refundNote: {
    fontSize: 12,
    color: '#785C20',
    marginTop: 15,
    lineHeight: 19,
  },
  formCard: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 14,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 15,
  },
  reasonOption: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 13,
    borderRadius: 10,
    marginBottom: 9,
  },
  reasonSelected: {
    borderColor: NAVY,
    backgroundColor: '#F2F5FA',
  },
  reasonText: {
    color: NAVY,
    fontSize: 14,
  },
  fieldLabel: {
    color: '#344054',
    fontWeight: '700',
    fontSize: 14,
    marginTop: 15,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 105,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 12,
    padding: 13,
    color: NAVY,
    fontSize: 14,
  },
  button: {
    backgroundColor: NAVY,
    borderRadius: 13,
    padding: 17,
    alignItems: 'center',
    marginTop: 18,
  },
  disabledButton: {
    backgroundColor: '#98A2B3',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disclaimer: {
    color: '#98A2B3',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 25,
  },
  secondaryButton: {
    padding: 17,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryText: {
    color: NAVY,
    fontWeight: '700',
  },
  link: {
    color: '#1645A3',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 18,
  },
});
