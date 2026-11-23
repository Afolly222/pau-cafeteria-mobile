import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';

export type SupportCategory = 'Wallet' | 'Payment' | 'Order' | 'App & Network' | 'Other';
export type SupportTicket = {
  id: string;
  userId: string;
  category: SupportCategory;
  cafeteria: string;
  orderReference: string;
  description: string;
  createdAt: string;
  status: 'Saved Locally';
};
type SubmitInput = Pick<SupportTicket, 'category' | 'cafeteria' | 'orderReference' | 'description'>;
type SupportContextType = {
  tickets: SupportTicket[];
  hydrated: boolean;
  submitRequest: (input: SubmitInput) => Promise<{ success: boolean; message: string; id?: string }>;
};
const SupportContext = createContext<SupportContextType | undefined>(undefined);
const CATEGORIES: SupportCategory[] = ['Wallet', 'Payment', 'Order', 'App & Network', 'Other'];

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const currentUserRef = useRef(userId);
  currentUserRef.current = userId;

  useEffect(() => {
    let active = true;
    setTickets([]);
    setHydrated(false);
    if (!userId) return () => { active = false; };
    AsyncStorage.getItem(`pau-support-v1-${userId}`)
      .then((saved) => {
        if (!active) return;
        const parsed: unknown = saved ? JSON.parse(saved) : [];
        setTickets(Array.isArray(parsed) ? parsed.filter((x): x is SupportTicket =>
          typeof x === 'object' && x !== null && (x as SupportTicket).userId === userId
        ) : []);
      })
      .catch((error) => console.warn('Could not load support requests:', error))
      .finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, [userId]);

  async function submitRequest(input: SubmitInput) {
    if (!userId || !hydrated || currentUserRef.current !== userId) {
      return { success: false, message: 'Please wait until your account and requests finish loading.' };
    }
    if (!CATEGORIES.includes(input.category) || input.description.trim().length < 10) {
      return { success: false, message: 'Choose a category and describe the problem in at least 10 characters.' };
    }
    const ticket: SupportTicket = {
      id: `HELP-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      userId,
      category: input.category,
      cafeteria: input.cafeteria.trim(),
      orderReference: input.orderReference.trim(),
      description: input.description.trim(),
      createdAt: new Date().toISOString(),
      status: 'Saved Locally',
    };
    try {
      // Read the latest stored data to avoid overwriting a previous request.
      const key = `pau-support-v1-${userId}`;
      const stored = await AsyncStorage.getItem(key);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      const previous = Array.isArray(parsed) ? parsed as SupportTicket[] : [];
      const next = [ticket, ...previous];
      await AsyncStorage.setItem(key, JSON.stringify(next));
      if (currentUserRef.current === userId) setTickets(next);
      return { success: true, message: 'Request saved on this device only. It has not been sent to cafeteria staff.', id: ticket.id };
    } catch (error) {
      console.warn('Could not save support request:', error);
      return { success: false, message: 'Could not save this request. Please try again.' };
    }
  }

  return (
    <SupportContext.Provider value={{ tickets, hydrated, submitRequest }}>
      {children}
    </SupportContext.Provider>
  );
}
export function useSupport() {
  const context = useContext(SupportContext);
  if (!context) throw new Error('useSupport must be used inside SupportProvider');
  return context;
}
