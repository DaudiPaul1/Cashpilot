import { useState, useCallback } from 'react';
import { Transaction, KPIs, Insight } from '@/types';

interface OptimisticUpdate<T> {
  id: string;
  type: 'add' | 'update' | 'delete';
  data: T;
  timestamp: number;
}

export function useOptimisticUpdates<T extends { id: string }>() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate<T>[]>([]);

  const addOptimisticUpdate = useCallback((update: Omit<OptimisticUpdate<T>, 'timestamp'>) => {
    setOptimisticUpdates(prev => [...prev, { ...update, timestamp: Date.now() }]);
  }, []);

  const removeOptimisticUpdate = useCallback((id: string) => {
    setOptimisticUpdates(prev => prev.filter(update => update.id !== id));
  }, []);

  const applyOptimisticUpdates = useCallback((items: T[]): T[] => {
    let result = [...items];

    // Apply optimistic updates in order
    optimisticUpdates.forEach(update => {
      switch (update.type) {
        case 'add':
          result.unshift(update.data as T);
          break;
        case 'update':
          result = result.map(item => 
            item.id === update.id ? { ...item, ...update.data } : item
          );
          break;
        case 'delete':
          result = result.filter(item => item.id !== update.id);
          break;
      }
    });

    return result;
  }, [optimisticUpdates]);

  const clearOptimisticUpdates = useCallback(() => {
    setOptimisticUpdates([]);
  }, []);

  return {
    optimisticUpdates,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    applyOptimisticUpdates,
    clearOptimisticUpdates
  };
}

// Specialized hooks for different data types
export function useOptimisticTransactions() {
  return useOptimisticUpdates<Transaction>();
}

export function useOptimisticInsights() {
  return useOptimisticUpdates<Insight>();
}

export function useOptimisticKPIs() {
  const [optimisticKPIs, setOptimisticKPIs] = useState<Partial<KPIs> | null>(null);

  const addOptimisticKPIs = useCallback((updates: Partial<KPIs>) => {
    setOptimisticKPIs(updates);
  }, []);

  const clearOptimisticKPIs = useCallback(() => {
    setOptimisticKPIs(null);
  }, []);

  const applyOptimisticKPIs = useCallback((kpis: KPIs | null): KPIs | null => {
    if (!kpis) return kpis;
    if (!optimisticKPIs) return kpis;

    return { ...kpis, ...optimisticKPIs };
  }, [optimisticKPIs]);

  return {
    optimisticKPIs,
    addOptimisticKPIs,
    clearOptimisticKPIs,
    applyOptimisticKPIs
  };
}
