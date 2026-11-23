
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

export type WalletTransaction = {
  id: string;
  type: 'funding' | 'withdrawal' | 'purchase' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
  bankName?: string;
  accountNumber?: string;
};

type WalletData = {
  balance: number;
  transactions: WalletTransaction[];
};

type WalletResult =
  | { success: true; transactionId: string }
  | { success: false; message: string };

type WalletContextType = {
  balance: number;
  pendingBalance: number;
  transactions: WalletTransaction[];
  hydrated: boolean;
  addMoney: (amount: number) => WalletResult;
  completeFunding: (id: string) => void;
  failFunding: (id: string) => void;
  requestWithdrawal: (
    amount: number,
    bankName: string,
    accountNumber: string
  ) => WalletResult;
  payForOrder: (
    amount: number,
    reference: string,
    cafeteriaName: string
  ) => WalletResult;
  creditRefund: (
    amount: number,
    orderReference: string,
    cafeteriaName: string
  ) => WalletResult;
};

const STORAGE_KEY = 'pau-cafeteria-demo-wallet-v1';

const WalletContext = createContext<
  WalletContextType | undefined
>(undefined);

function generateReference() {
  return `WAL-${Date.now()}-${Math.floor(
    Math.random() * 100000
  )}`;
}

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<WalletData>({
    balance: 0,
    transactions: [],
  });

  const dataRef = useRef<WalletData>({
    balance: 0,
    transactions: [],
  });

  const [hydrated, setHydrated] = useState(false);

  function updateWallet(next: WalletData) {
    dataRef.current = next;
    setData(next);
  }

  useEffect(() => {
    async function restoreWallet() {
      try {
        const saved = await AsyncStorage.getItem(
          STORAGE_KEY
        );

        if (saved) {
          const parsed: WalletData = JSON.parse(saved);

          updateWallet({
            balance:
              typeof parsed.balance === 'number'
                ? parsed.balance
                : 0,
            transactions: Array.isArray(parsed.transactions)
              ? parsed.transactions
              : [],
          });
        }
      } catch (error) {
        console.warn('Unable to restore wallet:', error);
      } finally {
        setHydrated(true);
      }
    }

    void restoreWallet();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    ).catch((error) => {
      console.warn('Unable to save wallet:', error);
    });
  }, [data, hydrated]);

  const pendingBalance = data.transactions
    .filter(
      (item) =>
        item.type === 'funding' &&
        item.status === 'pending'
    )
    .reduce((sum, item) => sum + item.amount, 0);

  function addMoney(amount: number): WalletResult {
    if (!hydrated) {
      return {
        success: false,
        message: 'Wallet is still loading.',
      };
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return {
        success: false,
        message: 'Enter a valid amount in whole naira.',
      };
    }

    const id = generateReference();
    const current = dataRef.current;

    const transaction: WalletTransaction = {
      id,
      type: 'funding',
      amount,
      status: 'completed',
      description: 'Demo wallet funding',
      createdAt: new Date().toISOString(),
    };

    updateWallet({
      balance: current.balance + amount,
      transactions: [transaction, ...current.transactions],
    });

    return { success: true, transactionId: id };
  }

  function completeFunding(id: string) {
    if (!hydrated) return;

    const current = dataRef.current;

    const transaction = current.transactions.find(
      (item) =>
        item.id === id &&
        item.type === 'funding' &&
        item.status === 'pending'
    );

    if (!transaction) return;

    updateWallet({
      balance: current.balance + transaction.amount,
      transactions: current.transactions.map((item) =>
        item.id === id
          ? { ...item, status: 'completed' }
          : item
      ),
    });
  }

  function failFunding(id: string) {
    if (!hydrated) return;

    const current = dataRef.current;

    updateWallet({
      ...current,
      transactions: current.transactions.map((item) =>
        item.id === id &&
        item.type === 'funding' &&
        item.status === 'pending'
          ? { ...item, status: 'failed' }
          : item
      ),
    });
  }

  function requestWithdrawal(
    amount: number,
    bankName: string,
    accountNumber: string
  ): WalletResult {
    if (!hydrated) {
      return {
        success: false,
        message: 'Wallet is still loading.',
      };
    }

    const current = dataRef.current;

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > current.balance
    ) {
      return {
        success: false,
        message: 'Insufficient balance or invalid amount.',
      };
    }

    if (!bankName.trim()) {
      return {
        success: false,
        message: 'Enter your bank name.',
      };
    }

    if (!/^\d{10}$/.test(accountNumber.trim())) {
      return {
        success: false,
        message: 'Enter a valid 10-digit account number.',
      };
    }

    const id = generateReference();

    const transaction: WalletTransaction = {
      id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: 'Demo withdrawal request',
      createdAt: new Date().toISOString(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
    };

    updateWallet({
      balance: current.balance - amount,
      transactions: [transaction, ...current.transactions],
    });

    return { success: true, transactionId: id };
  }

  function payForOrder(
    amount: number,
    reference: string,
    cafeteriaName: string
  ): WalletResult {
    if (!hydrated) {
      return {
        success: false,
        message: 'Wallet is still loading.',
      };
    }

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !reference.trim()
    ) {
      return {
        success: false,
        message: 'Invalid payment details.',
      };
    }

    const current = dataRef.current;

    const existing = current.transactions.find(
      (item) => item.id === reference
    );

    if (existing) {
      if (
        existing.type === 'purchase' &&
        existing.status === 'completed' &&
        existing.amount === amount
      ) {
        return {
          success: true,
          transactionId: reference,
        };
      }

      return {
        success: false,
        message: 'Payment reference already used.',
      };
    }

    if (current.balance < amount) {
      return {
        success: false,
        message: 'Insufficient wallet balance.',
      };
    }

    const transaction: WalletTransaction = {
      id: reference,
      type: 'purchase',
      amount,
      status: 'completed',
      description: `Payment to ${cafeteriaName}`,
      createdAt: new Date().toISOString(),
    };

    updateWallet({
      balance: current.balance - amount,
      transactions: [transaction, ...current.transactions],
    });

    return { success: true, transactionId: reference };
  }

  function creditRefund(
    amount: number,
    orderReference: string,
    cafeteriaName: string
  ): WalletResult {
    if (!hydrated) {
      return {
        success: false,
        message: 'Wallet is still loading.',
      };
    }

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !orderReference.trim()
    ) {
      return {
        success: false,
        message: 'Invalid refund details.',
      };
    }

    const reference = `REFUND-${orderReference}`;
    const current = dataRef.current;

    const existing = current.transactions.find(
      (item) => item.id === reference
    );

    if (existing) {
      return {
        success: false,
        message: 'This refund has already been credited.',
      };
    }

    const originalPayment = current.transactions.find(
      (item) =>
        item.id === orderReference &&
        item.type === 'purchase' &&
        item.status === 'completed' &&
        item.amount === amount
    );

    if (!originalPayment) {
      return {
        success: false,
        message:
          'The original wallet payment was not found. The refund cannot be credited automatically.',
      };
    }

    const transaction: WalletTransaction = {
      id: reference,
      type: 'refund',
      amount,
      status: 'completed',
      description: `Refund from ${cafeteriaName}`,
      createdAt: new Date().toISOString(),
    };

    updateWallet({
      balance: current.balance + amount,
      transactions: [transaction, ...current.transactions],
    });

    return { success: true, transactionId: reference };
  }

  return (
    <WalletContext.Provider
      value={{
        balance: data.balance,
        pendingBalance,
        transactions: data.transactions,
        hydrated,
        addMoney,
        completeFunding,
        failFunding,
        requestWithdrawal,
        payForOrder,
        creditRefund,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error(
      'useWallet must be used inside WalletProvider'
    );
  }

  return context;
}
