
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

import type { CartItem } from './CartProvider';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Completed';

export type RefundStatus =
  | 'Pending Review'
  | 'Approved'
  | 'Rejected'
  | 'Refunded';

export type PickupOption = 'asap' | 'scheduled';

export type RefundRequest = {
  id: string;
  reason: string;
  details: string;
  status: RefundStatus;
  requestedAt: string;
  updatedAt: string;
};

export type SavedOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type SavedOrder = {
  id: string;
  cafeteriaId: string;
  cafeteriaName: string;
  items: SavedOrderItem[];
  total: number;
  paymentMethod: string;
  paymentStatus: 'Simulated Successful';
  status: OrderStatus;
  createdAt: string;
  pickupOption?: PickupOption;
  pickupTime?: string | null;
  refundRequest?: RefundRequest;
};

type Result = {
  success: boolean;
  message: string;
};

type OrderContextType = {
  orders: SavedOrder[];
  hydrated: boolean;
  createOrder: (
    cartItems: CartItem[],
    paymentMethod: string,
    reference: string,
    pickupOption?: PickupOption,
    pickupTime?: string | null
  ) => SavedOrder | null;
  getOrder: (id: string) => SavedOrder | undefined;
  updateStatus: (id: string, status: OrderStatus) => void;
  requestRefund: (
    orderId: string,
    reason: string,
    details: string
  ) => Result;
  reviewRefund: (
    orderId: string,
    decision: 'Approved' | 'Rejected'
  ) => Result;
  markRefunded: (orderId: string) => Result;
};

const STORAGE_KEY = 'pau-cafeteria-demo-orders-v1';

const OrderContext = createContext<
  OrderContextType | undefined
>(undefined);

const STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Completed',
];

export function OrderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const ordersRef = useRef<SavedOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  function saveOrders(next: SavedOrder[]) {
    ordersRef.current = next;
    setOrders(next);
  }

  useEffect(() => {
    async function loadOrders() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            saveOrders(parsed as SavedOrder[]);
          }
        }
      } catch (error) {
        console.warn('Could not load orders:', error);
      } finally {
        setHydrated(true);
      }
    }

    void loadOrders();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(orders)
    ).catch((error) => {
      console.warn('Could not save orders:', error);
    });
  }, [orders, hydrated]);

  function createOrder(
    cartItems: CartItem[],
    paymentMethod: string,
    reference: string,
    pickupOption: PickupOption = 'asap',
    pickupTime: string | null = null
  ): SavedOrder | null {
    if (
      !hydrated ||
      cartItems.length === 0 ||
      !reference.trim()
    ) {
      return null;
    }

    const existing = ordersRef.current.find(
      (order) => order.id === reference
    );

    if (existing) return existing;

    if (
      pickupOption !== 'asap' &&
      pickupOption !== 'scheduled'
    ) {
      return null;
    }

    if (pickupOption === 'scheduled') {
      if (
        !pickupTime ||
        !Number.isFinite(Date.parse(pickupTime)) ||
        Date.parse(pickupTime) <= Date.now()
      ) {
        return null;
      }
    }

    const firstStore = cartItems[0].cafeteriaId;

    if (
      cartItems.some(
        (item) => item.cafeteriaId !== firstStore
      )
    ) {
      return null;
    }

    const orderItems: SavedOrderItem[] = cartItems.map(
      (item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })
    );

    const total = orderItems.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

    if (!Number.isFinite(total) || total <= 0) {
      return null;
    }

    const order: SavedOrder = {
      id: reference,
      cafeteriaId: cartItems[0].cafeteriaId,
      cafeteriaName: cartItems[0].cafeteriaName,
      items: orderItems,
      total,
      paymentMethod,
      paymentStatus: 'Simulated Successful',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      pickupOption,
      pickupTime:
        pickupOption === 'scheduled'
          ? pickupTime
          : null,
    };

    saveOrders([order, ...ordersRef.current]);

    return order;
  }

  function getOrder(id: string) {
    return ordersRef.current.find(
      (order) => order.id === id
    );
  }

  function updateStatus(
    id: string,
    status: OrderStatus
  ) {
    if (!hydrated || !STATUSES.includes(status)) return;

    const current = ordersRef.current.find(
      (order) => order.id === id
    );

    if (!current) return;

    const currentIndex = STATUSES.indexOf(current.status);
    const nextIndex = STATUSES.indexOf(status);

    if (nextIndex !== currentIndex + 1) return;

    saveOrders(
      ordersRef.current.map((order) =>
        order.id === id
          ? { ...order, status }
          : order
      )
    );
  }

  function requestRefund(
    orderId: string,
    reason: string,
    details: string
  ): Result {
    if (!hydrated) {
      return {
        success: false,
        message: 'Orders are still loading.',
      };
    }

    const order = ordersRef.current.find(
      (item) => item.id === orderId
    );

    if (!order) {
      return {
        success: false,
        message: 'Order not found.',
      };
    }

    if (order.refundRequest) {
      return {
        success: false,
        message: 'A refund request already exists.',
      };
    }

    if (!reason.trim()) {
      return {
        success: false,
        message: 'Select a refund reason.',
      };
    }

    if (reason === 'Other' && !details.trim()) {
      return {
        success: false,
        message: 'Please explain the issue.',
      };
    }

    const now = new Date().toISOString();

    const request: RefundRequest = {
      id: `REF-${orderId}`,
      reason: reason.trim(),
      details: details.trim(),
      status: 'Pending Review',
      requestedAt: now,
      updatedAt: now,
    };

    saveOrders(
      ordersRef.current.map((item) =>
        item.id === orderId
          ? { ...item, refundRequest: request }
          : item
      )
    );

    return {
      success: true,
      message: 'Refund request submitted.',
    };
  }

  function reviewRefund(
    orderId: string,
    decision: 'Approved' | 'Rejected'
  ): Result {
    if (!hydrated) {
      return {
        success: false,
        message: 'Orders are still loading.',
      };
    }

    const order = ordersRef.current.find(
      (item) => item.id === orderId
    );

    if (!order?.refundRequest) {
      return {
        success: false,
        message: 'Refund request not found.',
      };
    }

    if (order.refundRequest.status !== 'Pending Review') {
      return {
        success: false,
        message: 'This request has already been reviewed.',
      };
    }

    const now = new Date().toISOString();

    saveOrders(
      ordersRef.current.map((item) =>
        item.id === orderId && item.refundRequest
          ? {
              ...item,
              refundRequest: {
                ...item.refundRequest,
                status: decision,
                updatedAt: now,
              },
            }
          : item
      )
    );

    return {
      success: true,
      message: `Refund ${decision.toLowerCase()}.`,
    };
  }

  function markRefunded(orderId: string): Result {
    if (!hydrated) {
      return {
        success: false,
        message: 'Orders are still loading.',
      };
    }

    const order = ordersRef.current.find(
      (item) => item.id === orderId
    );

    if (order?.refundRequest?.status !== 'Approved') {
      return {
        success: false,
        message: 'Refund must be approved first.',
      };
    }

    const now = new Date().toISOString();

    saveOrders(
      ordersRef.current.map((item) =>
        item.id === orderId && item.refundRequest
          ? {
              ...item,
              refundRequest: {
                ...item.refundRequest,
                status: 'Refunded',
                updatedAt: now,
              },
            }
          : item
      )
    );

    return {
      success: true,
      message: 'Refund recorded.',
    };
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        hydrated,
        createOrder,
        getOrder,
        updateStatus,
        requestRefund,
        reviewRefund,
        markRefunded,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      'useOrders must be used inside OrderProvider'
    );
  }

  return context;
}
