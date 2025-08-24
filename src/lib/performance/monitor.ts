interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: Record<string, any>;
}

interface PerformanceData {
  metrics: PerformanceMetric[];
  userAgent: string;
  url: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled = process.env.NODE_ENV === 'production';

  // Monitor page load performance
  monitorPageLoad() {
    if (typeof window === 'undefined' || !this.isEnabled) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.addMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
          this.addMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
          this.addMetric('first_paint', this.getFirstPaint(), 'ms');
          this.addMetric('first_contentful_paint', this.getFirstContentfulPaint(), 'ms');
        }
      }, 0);
    });
  }

  // Monitor API call performance
  monitorApiCall(url: string, startTime: number, endTime: number, success: boolean) {
    if (!this.isEnabled) return;

    const duration = endTime - startTime;
    this.addMetric('api_call_duration', duration, 'ms', {
      url,
      success,
      method: 'fetch'
    });
  }

  // Monitor component render performance
  monitorComponentRender(componentName: string, renderTime: number) {
    if (!this.isEnabled) return;

    this.addMetric('component_render_time', renderTime, 'ms', {
      component: componentName
    });
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if (typeof window === 'undefined' || !this.isEnabled) return;

    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.addMetric('memory_used', memory.usedJSHeapSize, 'bytes');
      this.addMetric('memory_total', memory.totalJSHeapSize, 'bytes');
      this.addMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes');
    }
  }

  // Monitor real-time data sync performance
  monitorRealtimeSync(syncTime: number, dataSize: number, success: boolean) {
    if (!this.isEnabled) return;

    this.addMetric('realtime_sync_duration', syncTime, 'ms', {
      dataSize,
      success
    });
  }

  // Monitor error rates
  monitorError(errorType: string, errorCount: number) {
    if (!this.isEnabled) return;

    this.addMetric('error_rate', errorCount, 'count', {
      errorType
    });
  }

  private addMetric(name: string, value: number, unit: string, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log metric in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  // Get performance data for reporting
  getPerformanceData(): PerformanceData {
    return {
      metrics: [...this.metrics],
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now()
    };
  }

  // Clear metrics (useful for testing)
  clearMetrics() {
    this.metrics = [];
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export function monitorApiCall<T>(url: string, promise: Promise<T>): Promise<T> {
  const startTime = performance.now();
  
  return promise
    .then(result => {
      const endTime = performance.now();
      performanceMonitor.monitorApiCall(url, startTime, endTime, true);
      return result;
    })
    .catch(error => {
      const endTime = performance.now();
      performanceMonitor.monitorApiCall(url, startTime, endTime, false);
      throw error;
    });
}

export function monitorComponentRender(componentName: string) {
  return function<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      componentDidMount() {
        const startTime = performance.now();
        if (super.componentDidMount) {
          super.componentDidMount();
        }
        const endTime = performance.now();
        performanceMonitor.monitorComponentRender(componentName, endTime - startTime);
      }
    };
  };
}

// Initialize monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.monitorPageLoad();
  
  // Monitor memory usage every 30 seconds
  setInterval(() => {
    performanceMonitor.monitorMemoryUsage();
  }, 30000);
}
