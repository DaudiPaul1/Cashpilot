import React, { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/lib/performance/monitor';

interface PerformanceOptions {
  componentName?: string;
  trackRenders?: boolean;
  trackInteractions?: boolean;
}

export function usePerformance(options: PerformanceOptions = {}) {
  const {
    componentName = 'Unknown',
    trackRenders = true,
    trackInteractions = true
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  // Track component renders
  useEffect(() => {
    if (trackRenders) {
      const currentTime = performance.now();
      const renderTime = currentTime - lastRenderTime.current;
      
      performanceMonitor.monitorComponentRender(componentName, renderTime);
      
      renderCount.current++;
      lastRenderTime.current = currentTime;
    }
  });

  // Track user interactions
  const trackInteraction = useCallback((interactionType: string, details?: any) => {
    if (trackInteractions) {
      performanceMonitor.monitorApiCall(
        `interaction:${interactionType}`,
        performance.now(),
        performance.now(),
        true
      );
    }
  }, [trackInteractions]);

  // Track API calls with performance monitoring
  const trackApiCall = useCallback(async <T>(
    url: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      
      performanceMonitor.monitorApiCall(url, startTime, endTime, true);
      return result;
    } catch (error) {
      const endTime = performance.now();
      performanceMonitor.monitorApiCall(url, startTime, endTime, false);
      throw error;
    }
  }, []);

  // Track real-time sync performance
  const trackRealtimeSync = useCallback((
    syncTime: number,
    dataSize: number,
    success: boolean
  ) => {
    performanceMonitor.monitorRealtimeSync(syncTime, dataSize, success);
  }, []);

  return {
    trackInteraction,
    trackApiCall,
    trackRealtimeSync,
    renderCount: renderCount.current
  };
}

// Hook for lazy loading components
export function useLazyLoad<T>(
  importFn: () => Promise<{ default: T }>,
  deps: any[] = []
) {
  const [Component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    importFn()
      .then((module) => {
        setComponent(() => module.default);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, deps);

  return { Component, loading, error };
}

// Hook for debouncing values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling function calls
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }

    if (lastCallTimer.current) {
      clearTimeout(lastCallTimer.current);
    }

    lastCallTimer.current = setTimeout(() => {
      lastCall.current = Date.now();
      callback(...args);
    }, delay - (now - lastCall.current));
  }, [callback, delay]) as T;
}

// Hook for memoization with performance tracking
export function useMemoizedValue<T>(
  factory: () => T,
  deps: any[],
  options: { trackPerformance?: boolean; componentName?: string } = {}
) {
  const { trackPerformance = true, componentName = 'Unknown' } = options;
  const lastDeps = useRef<any[]>([]);
  const lastValue = useRef<T>();

  return React.useMemo(() => {
    const startTime = performance.now();
    const newValue = factory();
    const endTime = performance.now();

    if (trackPerformance) {
      performanceMonitor.monitorComponentRender(
        `${componentName}:memo`,
        endTime - startTime
      );
    }

    // Check if deps actually changed
    const depsChanged = deps.length !== lastDeps.current.length ||
      deps.some((dep, index) => dep !== lastDeps.current[index]);

    if (depsChanged) {
      lastDeps.current = [...deps];
      lastValue.current = newValue;
    }

    return lastValue.current ?? newValue;
  }, deps);
}
