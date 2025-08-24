import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction, KPIs, Insight } from '@/types';

interface RealtimeDataState {
  transactions: Transaction[];
  kpis: KPIs | null;
  insights: Insight[];
  loading: boolean;
  error: string | null;
}

interface RealtimeDataActions {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateKPIs: (kpis: Partial<KPIs>) => Promise<void>;
  addInsight: (insight: Omit<Insight, 'id' | 'createdAt'>) => Promise<void>;
  updateInsight: (id: string, updates: Partial<Insight>) => Promise<void>;
  deleteInsight: (id: string) => Promise<void>;
}

export function useRealtimeData(): RealtimeDataState & RealtimeDataActions {
  const { user } = useAuth();
  const [state, setState] = useState<RealtimeDataState>({
    transactions: [],
    kpis: null,
    insights: [],
    loading: true,
    error: null
  });

  // Development mode: bypass Firestore completely
  const isDevelopment = process.env.NODE_ENV === 'development';
  const skipFirestore = isDevelopment && !process.env.NEXT_PUBLIC_ENABLE_FIRESTORE;

  // Real-time transactions listener
  useEffect(() => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, loading: false, transactions: [] }));
      return;
    }

    // Skip Firestore in development mode unless explicitly enabled
    if (skipFirestore) {
      console.log('Development mode: Skipping Firestore, using mock data');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        transactions: [],
        error: null 
      }));
      return;
    }

    // Check if Firestore is properly initialized
    if (!db) {
      console.warn('Firestore not initialized, using fallback data');
      setState(prev => ({ ...prev, loading: false, transactions: [] }));
      return;
    }

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(1000)
    );

    const unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];

        setState(prev => ({
          ...prev,
          transactions,
          loading: false,
          error: null
        }));
      },
      (error) => {
        console.error('Error listening to transactions:', error);
        // Handle Firestore permission issues gracefully
        if (error.code === 'permission-denied') {
          console.warn('Firestore permission denied for transactions, using fallback data');
          setState(prev => ({
            ...prev,
            transactions: [],
            loading: false,
            error: null
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: 'Failed to load transactions',
            loading: false
          }));
        }
      }
    );

    return () => unsubscribeTransactions();
  }, [user?.uid]);

  // Real-time KPIs listener
  useEffect(() => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, kpis: null }));
      return;
    }

    // Skip Firestore in development mode unless explicitly enabled
    if (skipFirestore) {
      console.log('Development mode: Skipping Firestore KPIs, using mock data');
      setState(prev => ({ 
        ...prev, 
        kpis: null,
        error: null 
      }));
      return;
    }

    // Check if Firestore is properly initialized
    if (!db) {
      console.warn('Firestore not initialized, using fallback data');
      setState(prev => ({ ...prev, kpis: null }));
      return;
    }

    const kpisDoc = doc(db, 'kpis', user.uid);

    const unsubscribeKPIs = onSnapshot(
      kpisDoc,
      (doc) => {
        if (doc.exists()) {
          const kpis = doc.data() as KPIs;
          setState(prev => ({
            ...prev,
            kpis,
            error: null
          }));
        } else {
          setState(prev => ({ ...prev, kpis: null }));
        }
      },
      (error) => {
        console.error('Error listening to KPIs:', error);
        // Handle Firestore permission issues gracefully
        if (error.code === 'permission-denied') {
          console.warn('Firestore permission denied for KPIs, using fallback data');
          setState(prev => ({
            ...prev,
            kpis: null,
            error: null
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: 'Failed to load KPIs'
          }));
        }
      }
    );

    return () => unsubscribeKPIs();
  }, [user?.uid]);

  // Real-time insights listener
  useEffect(() => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, insights: [] }));
      return;
    }

    // Skip Firestore in development mode unless explicitly enabled
    if (skipFirestore) {
      console.log('Development mode: Skipping Firestore insights, using mock data');
      setState(prev => ({ 
        ...prev, 
        insights: [],
        error: null 
      }));
      return;
    }

    // Check if Firestore is properly initialized
    if (!db) {
      console.warn('Firestore not initialized, using fallback data');
      setState(prev => ({ ...prev, insights: [] }));
      return;
    }

    const insightsQuery = query(
      collection(db, 'insights'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeInsights = onSnapshot(
      insightsQuery,
      (snapshot) => {
        const insights = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Insight[];

        setState(prev => ({
          ...prev,
          insights,
          error: null
        }));
      },
      (error) => {
        console.error('Error listening to insights:', error);
        // Handle Firestore permission issues gracefully
        if (error.code === 'permission-denied') {
          console.warn('Firestore permission denied for insights, using fallback data');
          setState(prev => ({
            ...prev,
            insights: [],
            error: null
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: 'Failed to load insights'
          }));
        }
      }
    );

    return () => unsubscribeInsights();
  }, [user?.uid]);

  // Transaction actions
  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    // Skip Firestore in development mode
    if (skipFirestore) {
      console.log('Development mode: Simulating transaction add');
      return;
    }

    try {
      const transaction = {
        ...transactionData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'transactions'), transaction);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, [user?.uid, skipFirestore]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    // Skip Firestore in development mode
    if (skipFirestore) {
      console.log('Development mode: Simulating transaction update');
      return;
    }

    try {
      const transactionRef = doc(db, 'transactions', id);
      await updateDoc(transactionRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }, [user?.uid, skipFirestore]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    // Skip Firestore in development mode
    if (skipFirestore) {
      console.log('Development mode: Simulating transaction delete');
      return;
    }

    try {
      const transactionRef = doc(db, 'transactions', id);
      await deleteDoc(transactionRef);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }, [user?.uid, skipFirestore]);

  // KPI actions
  const updateKPIs = useCallback(async (kpisUpdates: Partial<KPIs>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    // Skip Firestore in development mode
    if (skipFirestore) {
      console.log('Development mode: Simulating KPI update');
      return;
    }

    try {
      const kpisRef = doc(db, 'kpis', user.uid);
      await updateDoc(kpisRef, {
        ...kpisUpdates,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating KPIs:', error);
      throw error;
    }
  }, [user?.uid, skipFirestore]);

  // Insight actions
  const addInsight = useCallback(async (insightData: Omit<Insight, 'id' | 'createdAt'>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const insight = {
        ...insightData,
        userId: user.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'insights'), insight);
    } catch (error) {
      console.error('Error adding insight:', error);
      throw error;
    }
  }, [user?.uid]);

  const updateInsight = useCallback(async (id: string, updates: Partial<Insight>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const insightRef = doc(db, 'insights', id);
      await updateDoc(insightRef, updates);
    } catch (error) {
      console.error('Error updating insight:', error);
      throw error;
    }
  }, [user?.uid]);

  const deleteInsight = useCallback(async (id: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const insightRef = doc(db, 'insights', id);
      await deleteDoc(insightRef);
    } catch (error) {
      console.error('Error deleting insight:', error);
      throw error;
    }
  }, [user?.uid]);

  return {
    ...state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateKPIs,
    addInsight,
    updateInsight,
    deleteInsight
  };
}
