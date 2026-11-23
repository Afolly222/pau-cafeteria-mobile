import NetInfo from '@react-native-community/netinfo';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

type NetworkContextType = {
  isOnline: boolean;
  isChecking: boolean;
  refreshConnection: () => Promise<void>;
};

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

function checkOnline(connected: boolean | null, reachable: boolean | null): boolean {
  return connected === true && reachable !== false;
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const mountedRef = useRef(true);
  const refreshSequence = useRef(0);

  const refreshConnection = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    if (mountedRef.current) setIsChecking(true);
    try {
      const state = await NetInfo.refresh();
      if (!mountedRef.current || sequence !== refreshSequence.current) return;
      setIsOnline(checkOnline(state.isConnected, state.isInternetReachable));
    } catch {
      if (mountedRef.current && sequence === refreshSequence.current) {
        setIsOnline(false);
      }
    } finally {
      if (mountedRef.current && sequence === refreshSequence.current) {
        setIsChecking(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!mountedRef.current) return;
      // A newer network event takes priority over any outstanding refresh.
      refreshSequence.current += 1;
      setIsOnline(checkOnline(state.isConnected, state.isInternetReachable));
      setIsChecking(false);
    });
    void refreshConnection();
    const appSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshConnection();
    });
    return () => {
      mountedRef.current = false;
      refreshSequence.current += 1;
      unsubscribe();
      appSubscription.remove();
    };
  }, [refreshConnection]);

  return (
    <NetworkContext.Provider value={{ isOnline, isChecking, refreshConnection }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) throw new Error('useNetwork must be used inside NetworkProvider');
  return context;
}
