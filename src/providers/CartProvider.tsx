
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import {
    cafeterias,
    type MenuItem,
} from '../data/cafeterias';

export type CartItem = {
  id: string;
  cafeteriaId: string;
  cafeteriaName: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: MenuItem['image'];
};

type CartResult =
  | 'added'
  | 'not-ready'
  | 'different-store'
  | 'unavailable'
  | 'stock-limit';

type CartContextType = {
  items: CartItem[];
  hydrated: boolean;
  itemCount: number;
  total: number;
  addItem: (
    item: MenuItem,
    cafeteriaId: string,
    cafeteriaName: string
  ) => CartResult;
  increaseQuantity: (id: string) => CartResult;
  decreaseQuantity: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

type SavedCartItem = {
  id: string;
  cafeteriaId: string;
  quantity: number;
};

const STORAGE_KEY = 'pau-cafeteria-cart-v2';

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

function findMenuItem(cafeteriaId: string, itemId: string) {
  const cafeteria = cafeterias.find(
    (store) => store.id === cafeteriaId
  );

  const menuItem = cafeteria?.menu.find(
    (item) => item.id === itemId
  );

  return { cafeteria, menuItem };
}

function restoreCart(saved: SavedCartItem[]): CartItem[] {
  const restored: CartItem[] = [];
  let selectedStore: string | null = null;

  for (const entry of saved) {
    if (
      !entry ||
      typeof entry.id !== 'string' ||
      typeof entry.cafeteriaId !== 'string' ||
      !Number.isInteger(entry.quantity) ||
      entry.quantity <= 0
    ) {
      continue;
    }

    const { cafeteria, menuItem } = findMenuItem(
      entry.cafeteriaId,
      entry.id
    );

    if (
      !cafeteria ||
      !menuItem ||
      !menuItem.available ||
      menuItem.quantity <= 0
    ) {
      continue;
    }

    if (selectedStore && selectedStore !== cafeteria.id) {
      continue;
    }

    selectedStore = cafeteria.id;

    if (restored.some((item) => item.id === menuItem.id)) {
      continue;
    }

    restored.push({
      id: menuItem.id,
      cafeteriaId: cafeteria.id,
      cafeteriaName: cafeteria.name,
      name: menuItem.name,
      price: menuItem.price,
      quantity: Math.min(entry.quantity, menuItem.quantity),
      stock: menuItem.quantity,
      image: menuItem.image,
    });
  }

  return restored;
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function loadCart() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            setItems(restoreCart(parsed));
          }
        }
      } catch (error) {
        console.warn('Unable to load cart:', error);
      } finally {
        setHydrated(true);
      }
    }

    loadCart();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const savedItems: SavedCartItem[] = items.map(
      ({ id, cafeteriaId, quantity }) => ({
        id,
        cafeteriaId,
        quantity,
      })
    );

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(savedItems)
    ).catch((error) => {
      console.warn('Unable to save cart:', error);
    });
  }, [items, hydrated]);

  function addItem(
    item: MenuItem,
    cafeteriaId: string,
    cafeteriaName: string
  ): CartResult {
    if (!hydrated) return 'not-ready';

    if (
      items.length > 0 &&
      items[0].cafeteriaId !== cafeteriaId
    ) {
      return 'different-store';
    }

    const { menuItem } = findMenuItem(cafeteriaId, item.id);

    if (
      !menuItem ||
      !menuItem.available ||
      menuItem.quantity <= 0
    ) {
      return 'unavailable';
    }

    const existing = items.find(
      (cartItem) => cartItem.id === item.id
    );

    if (
      existing &&
      existing.quantity >= menuItem.quantity
    ) {
      return 'stock-limit';
    }

    setItems((current) => {
      const found = current.find(
        (cartItem) => cartItem.id === item.id
      );

      if (found) {
        return current.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: Math.min(
                  cartItem.quantity + 1,
                  menuItem.quantity
                ),
              }
            : cartItem
        );
      }

      if (
        current.length > 0 &&
        current[0].cafeteriaId !== cafeteriaId
      ) {
        return current;
      }

      return [
        ...current,
        {
          id: menuItem.id,
          cafeteriaId,
          cafeteriaName,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          stock: menuItem.quantity,
          image: menuItem.image,
        },
      ];
    });

    return 'added';
  }

  function increaseQuantity(id: string): CartResult {
    if (!hydrated) return 'not-ready';

    const existing = items.find((item) => item.id === id);

    if (!existing) return 'unavailable';

    if (existing.quantity >= existing.stock) {
      return 'stock-limit';
    }

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(
                item.quantity + 1,
                item.stock
              ),
            }
          : item
      )
    );

    return 'added';
  }

  function decreaseQuantity(id: string) {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(id: string) {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        itemCount,
        total,
        addItem,
        increaseQuantity,
        decreaseQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider'
    );
  }

  return context;
}
