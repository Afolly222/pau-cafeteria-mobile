
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    useOrders,
    type OrderStatus,
    type SavedOrder,
} from '../providers/OrderProvider';
import { useWallet } from '../providers/WalletProvider';

const NAVY = '#172B4D';
const STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Completed',
];

type Tab = 'orders' | 'refunds';

function money(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function StaffScreen() {
  const {
    orders,
    hydrated: ordersReady,
    updateStatus,
    reviewRefund,
    markRefunded,
  } = useOrders();

  const {
    hydrated: walletReady,
    creditRefund,
    transactions,
  } = useWallet();

  const [tab, setTab] = useState<Tab>('orders');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const refunds = orders.filter(
    (order) => Boolean(order.refundRequest)
  );

  const pendingCount = refunds.filter(
    (order) =>
      order.refundRequest?.status === 'Pending Review'
  ).length;

  function advanceOrder(order: SavedOrder) {
    const index = STATUSES.indexOf(order.status);

    if (index < 0 || index >= STATUSES.length - 1) {
      return;
    }

    const next = STATUSES[index + 1];

    Alert.alert(
      'Update Order Status',
      `Change this order to "${next}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => updateStatus(order.id, next),
        },
      ]
    );
  }

  function decideRefund(
    order: SavedOrder,
    decision: 'Approved' | 'Rejected'
  ) {
    Alert.alert(
      `${decision === 'Approved' ? 'Approve' : 'Reject'} Refund`,
      `Review the ${money(order.total)} refund request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            const result = reviewRefund(
              order.id,
              decision
            );

            Alert.alert(
              result.success ? 'Updated' : 'Unable to Update',
              result.message
            );
          },
        },
      ]
    );
  }

  function issueRefund(order: SavedOrder) {
    if (busyRef.current) return;

    if (!ordersReady || !walletReady) {
      Alert.alert(
        'Please Wait',
        'Orders and wallet are still loading.'
      );
      return;
    }

    if (order.refundRequest?.status !== 'Approved') {
      Alert.alert(
        'Not Approved',
        'Approve the refund first.'
      );
      return;
    }

    if (order.paymentMethod !== 'Cafeteria Wallet') {
      Alert.alert(
        'Bank Transfer Refund',
        'Bank transfer reversals are not supported in this prototype.'
      );
      return;
    }

    const alreadyCredited = transactions.some(
      (item) =>
        item.id === `REFUND-${order.id}` &&
        item.type === 'refund' &&
        item.status === 'completed'
    );

    if (alreadyCredited) {
      Alert.alert(
        'Refund Already Credited',
        'The wallet credit already exists. Update the order record without crediting again?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reconcile',
            onPress: () => {
              const result = markRefunded(order.id);
              Alert.alert(
                result.success ? 'Updated' : 'Unable to Update',
                result.message
              );
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Issue Demo Refund',
      `Credit ${money(order.total)} to the demo wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue Refund',
          onPress: () => {
            if (busyRef.current) return;

            busyRef.current = true;
            setBusy(true);

            try {
              const result = creditRefund(
                order.total,
                order.id,
                order.cafeteriaName
              );

              if (!result.success) {
                Alert.alert(
                  'Refund Not Completed',
                  result.message
                );
                return;
              }

              const updated = markRefunded(order.id);

              if (!updated.success) {
                Alert.alert(
                  'Reconciliation Required',
                  'The wallet credit was recorded but the order status was not updated. Do not issue another credit.'
                );
                return;
              }

              Alert.alert(
                'Refund Recorded',
                `${money(order.total)} has been returned to the demo wallet.`
              );
            } finally {
              busyRef.current = false;
              setBusy(false);
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
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.heading}>
        Staff Dashboard
      </Text>
      <Text style={styles.subtitle}>
        Manage cafeteria orders and refund requests.
      </Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>
          Staff Testing Mode
        </Text>
        <Text style={styles.noticeText}>
          This is a local HCI demonstration. Staff
          authentication and real payments are not
          connected.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {orders.length}
          </Text>
          <Text style={styles.summaryLabel}>
            Total Orders
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {pendingCount}
          </Text>
          <Text style={styles.summaryLabel}>
            Refunds to Review
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[
            styles.tab,
            tab === 'orders' && styles.activeTab,
          ]}
          onPress={() => setTab('orders')}
        >
          <Text
            style={[
              styles.tabText,
              tab === 'orders' && styles.activeTabText,
            ]}
          >
            Orders
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            tab === 'refunds' && styles.activeTab,
          ]}
          onPress={() => setTab('refunds')}
        >
          <Text
            style={[
              styles.tabText,
              tab === 'refunds' && styles.activeTabText,
            ]}
          >
            Refunds
          </Text>
        </Pressable>
      </View>

      {!ordersReady ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
          <Text style={styles.empty}>
            No orders yet.
          </Text>
        ) : (
          orders.map((order) => {
            const index = STATUSES.indexOf(order.status);
            const next =
              index >= 0 && index < STATUSES.length - 1
                ? STATUSES[index + 1]
                : null;

            return (
              <View key={order.id} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {order.cafeteriaName}
                </Text>
                <Text style={styles.reference}>
                  {order.id}
                </Text>
                <Text style={styles.detail}>
                  {new Date(
                    order.createdAt
                  ).toLocaleString()}
                </Text>

                <View style={styles.divider} />

                {order.items.map((item) => (
                  <Text
                    key={item.id}
                    style={styles.detail}
                  >
                    {item.quantity} × {item.name}
                  </Text>
                ))}

                <Text style={styles.amount}>
                  {money(order.total)}
                </Text>
                <Text style={styles.status}>
                  Status: {order.status}
                </Text>

                {next ? (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => advanceOrder(order)}
                  >
                    <Text style={styles.primaryText}>
                      Mark as {next}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.completed}>
                    Order Completed
                  </Text>
                )}
              </View>
            );
          })
        )
      ) : refunds.length === 0 ? (
        <Text style={styles.empty}>
          No refund requests yet.
        </Text>
      ) : (
        refunds.map((order) => {
          const request = order.refundRequest;
          if (!request) return null;

          return (
            <View key={order.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {order.cafeteriaName}
              </Text>
              <Text style={styles.reference}>
                {request.id}
              </Text>
              <Text style={styles.detail}>
                Order: {order.id}
              </Text>
              <Text style={styles.detail}>
                Reason: {request.reason}
              </Text>
              {request.details ? (
                <Text style={styles.detail}>
                  Details: {request.details}
                </Text>
              ) : null}
              <Text style={styles.detail}>
                Payment: {order.paymentMethod}
              </Text>
              <Text style={styles.amount}>
                {money(order.total)}
              </Text>
              <Text style={styles.status}>
                Refund: {request.status}
              </Text>

              {request.status === 'Pending Review' && (
                <View style={styles.actions}>
                  <Pressable
                    style={[
                      styles.primaryButton,
                      styles.actionButton,
                    ]}
                    onPress={() =>
                      decideRefund(order, 'Approved')
                    }
                  >
                    <Text style={styles.primaryText}>
                      Approve
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.outlineButton,
                      styles.actionButton,
                    ]}
                    onPress={() =>
                      decideRefund(order, 'Rejected')
                    }
                  >
                    <Text style={styles.outlineText}>
                      Reject
                    </Text>
                  </Pressable>
                </View>
              )}

              {request.status === 'Approved' &&
                (order.paymentMethod ===
                'Cafeteria Wallet' ? (
                  <Pressable
                    style={[
                      styles.primaryButton,
                      busy && styles.disabledButton,
                    ]}
                    disabled={busy || !walletReady}
                    onPress={() => issueRefund(order)}
                  >
                    <Text style={styles.primaryText}>
                      Issue Demo Wallet Refund
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.warning}>
                    Bank transfer refunds require
                    external processing. No money
                    has been returned.
                  </Text>
                ))}

              {request.status === 'Refunded' && (
                <Text style={styles.completed}>
                  Refund Completed
                </Text>
              )}

              {request.status === 'Rejected' && (
                <Text style={styles.warning}>
                  Request Rejected
                </Text>
              )}
            </View>
          );
        })
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
    paddingBottom: 60,
  },
  back: {
    color: NAVY,
    fontSize: 18,
    marginBottom: 25,
  },
  heading: {
    color: NAVY,
    fontSize: 29,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  notice: {
    backgroundColor: '#FFF4DB',
    padding: 16,
    borderRadius: 13,
    marginBottom: 20,
  },
  noticeTitle: {
    color: '#785C20',
    fontWeight: '800',
  },
  noticeText: {
    color: '#785C20',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F2F5FA',
    borderRadius: 14,
    padding: 18,
  },
  summaryNumber: {
    color: NAVY,
    fontSize: 29,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 12,
    marginTop: 6,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F2F5FA',
    padding: 5,
    borderRadius: 13,
    marginBottom: 25,
  },
  tab: {
    flex: 1,
    padding: 13,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: NAVY,
  },
  tabText: {
    color: NAVY,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: NAVY,
    fontSize: 18,
    fontWeight: '800',
  },
  reference: {
    color: '#667085',
    fontSize: 12,
    marginTop: 8,
  },
  detail: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7EC',
    marginVertical: 13,
  },
  amount: {
    color: NAVY,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 16,
  },
  status: {
    color: '#1645A3',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  actionButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: NAVY,
    padding: 15,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 15,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#B42318',
    padding: 15,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 15,
  },
  outlineText: {
    color: '#B42318',
    fontWeight: '700',
    fontSize: 13,
  },
  completed: {
    color: '#16804A',
    fontWeight: '800',
    marginTop: 17,
  },
  warning: {
    color: '#946200',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#98A2B3',
  },
  empty: {
    color: '#667085',
    textAlign: 'center',
    marginTop: 45,
  },
});
