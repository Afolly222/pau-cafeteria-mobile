
import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useNetwork } from '../providers/NetworkProvider';
import {
    useOrders,
    type SavedOrder,
} from '../providers/OrderProvider';

const NAVY = '#172B4D';

function formatPrice(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getPickupLabel(order: SavedOrder) {
  if (order.pickupOption === 'scheduled') {
    if (!order.pickupTime) {
      return 'Scheduled time unavailable';
    }

    return `Scheduled: ${formatDate(order.pickupTime)}`;
  }

  if (order.pickupOption === 'asap') {
    return 'Pickup: As soon as possible';
  }

  return 'Pickup preference not recorded';
}

function getStatusStyle(status: string) {
  if (status === 'Ready for Pickup') {
    return {
      backgroundColor: '#E7F8EF',
      color: '#16804A',
    };
  }

  if (status === 'Completed') {
    return {
      backgroundColor: '#F2F4F7',
      color: '#475467',
    };
  }

  if (status === 'Preparing') {
    return {
      backgroundColor: '#FFF4DB',
      color: '#946200',
    };
  }

  return {
    backgroundColor: '#EFF4FB',
    color: '#1645A3',
  };
}

export default function OrdersScreen() {
  const { orders, hydrated } = useOrders();
  const { isOnline, isChecking } = useNetwork();

  const [search, setSearch] = useState('');

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) => {
      const itemsText = order.items
        .map((item) => item.name)
        .join(' ')
        .toLowerCase();

      return (
        order.id.toLowerCase().includes(query) ||
        order.cafeteriaName.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query) ||
        itemsText.includes(query)
      );
    });
  }, [orders, search]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.heading}>My Orders</Text>

        <Text style={styles.subtitle}>
          View your saved orders, pickup preferences,
          payment records and refund requests.
        </Text>

        {!isChecking && !isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineTitle}>
              Offline Mode
            </Text>

            <Text style={styles.offlineText}>
              Your previously saved orders are available
              on this device. Statuses may not reflect
              changes made elsewhere.
            </Text>
          </View>
        )}

        <TextInput
          style={styles.searchInput}
          placeholder="Search reference, cafeteria or food"
          placeholderTextColor="#98A2B3"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.searchHint}>
          If a payment was interrupted, check your
          saved order reference before trying again.
        </Text>

        {hydrated && orders.length > 0 && (
          <Text style={styles.orderCount}>
            {orders.length}{' '}
            {orders.length === 1 ? 'saved order' : 'saved orders'}
          </Text>
        )}
      </View>

      {!hydrated ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Loading your saved orders...
          </Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧾</Text>

          <Text style={styles.emptyTitle}>
            {search.trim()
              ? 'No matching orders'
              : 'No orders yet'}
          </Text>

          <Text style={styles.emptyText}>
            {search.trim()
              ? 'Try searching by cafeteria, food item, order status or payment reference.'
              : 'Your completed prototype checkout records will appear here.'}
          </Text>

          {!search.trim() && (
            <Pressable
              style={styles.button}
              onPress={() => router.replace('/home')}
            >
              <Text style={styles.buttonText}>
                Browse Cafeterias
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const statusStyle = getStatusStyle(item.status);

            return (
              <Pressable
                style={styles.orderCard}
                onPress={() =>
                  router.push({
                    pathname: '/order/[id]',
                    params: { id: item.id },
                  })
                }
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.storeName}>
                    {item.cafeteriaName}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          statusStyle.backgroundColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusStyle.color },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reference}>
                  {item.id}
                </Text>

                <Text style={styles.date}>
                  Ordered: {formatDate(item.createdAt)}
                </Text>

                <View style={styles.pickupCard}>
                  <Text style={styles.pickupIcon}>◷</Text>

                  <View style={styles.pickupDetails}>
                    <Text style={styles.pickupHeading}>
                      Pickup Preference
                    </Text>

                    <Text style={styles.pickupValue}>
                      {getPickupLabel(item)}
                    </Text>
                  </View>
                </View>

                {item.status === 'Ready for Pickup' && (
                  <View style={styles.readyNotice}>
                    <Text style={styles.readyTitle}>
                      ✓ Ready for Pickup
                    </Text>

                    <Text style={styles.readyText}>
                      This prototype order is marked
                      ready for collection.
                    </Text>
                  </View>
                )}

                <Text style={styles.paymentStatus}>
                  ✓ Demo payment recorded
                </Text>

                {item.refundRequest && (
                  <View style={styles.refundBadge}>
                    <Text style={styles.refundText}>
                      Refund: {item.refundRequest.status}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.total}>
                    {formatPrice(item.total)}
                  </Text>

                  <Text style={styles.viewDetails}>
                    Track Order ›
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Text style={styles.disclaimer}>
        Orders and payment records are simulated for
        HCI testing. No real cafeteria orders are submitted.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  back: {
    color: NAVY,
    fontSize: 18,
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
    lineHeight: 22,
  },
  offlineBanner: {
    backgroundColor: '#FFF4DB',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  offlineTitle: {
    color: '#785C20',
    fontWeight: '800',
    fontSize: 14,
  },
  offlineText: {
    color: '#785C20',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: NAVY,
    fontSize: 14,
    marginTop: 22,
  },
  searchHint: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  orderCount: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 15,
  },
  list: {
    padding: 20,
    paddingBottom: 30,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  storeName: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    maxWidth: '48%',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  reference: {
    fontSize: 13,
    color: '#667085',
    marginTop: 12,
  },
  date: {
    color: '#98A2B3',
    fontSize: 12,
    marginTop: 6,
  },
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F5FA',
    borderRadius: 12,
    padding: 14,
    marginTop: 17,
    gap: 12,
  },
  pickupIcon: {
    color: NAVY,
    fontSize: 25,
  },
  pickupDetails: {
    flex: 1,
  },
  pickupHeading: {
    fontSize: 12,
    color: '#667085',
    marginBottom: 5,
  },
  pickupValue: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  readyNotice: {
    backgroundColor: '#E7F8EF',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  readyTitle: {
    color: '#16804A',
    fontSize: 14,
    fontWeight: '800',
  },
  readyText: {
    color: '#16804A',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  paymentStatus: {
    color: '#16804A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 15,
  },
  refundBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF4DB',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 9,
    marginTop: 12,
  },
  refundText: {
    color: '#946200',
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  total: {
    fontSize: 19,
    fontWeight: '800',
    color: NAVY,
  },
  viewDetails: {
    color: '#1645A3',
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 12,
    marginBottom: 22,
  },
  button: {
    backgroundColor: NAVY,
    paddingHorizontal: 25,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disclaimer: {
    color: '#98A2B3',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 25,
    paddingBottom: 15,
  },
});
