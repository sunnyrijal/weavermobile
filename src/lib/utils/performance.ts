// Performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure execution time of a function
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) {
      return fn();
    }

    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  // Record a metric
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  // Get average time for a metric
  getAverageTime(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Get slow operations (above threshold)
  getSlowOperations(threshold: number = 1000): Array<{ name: string; avgTime: number }> {
    const slow: Array<{ name: string; avgTime: number }> = [];
    
    for (const [name, values] of this.metrics.entries()) {
      const avgTime = this.getAverageTime(name);
      if (avgTime > threshold) {
        slow.push({ name, avgTime });
      }
    }
    
    return slow.sort((a, b) => b.avgTime - a.avgTime);
  }

  // Clear metrics
  clear() {
    this.metrics.clear();
  }

  // Get all metrics
  getAllMetrics() {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      result[name] = { avg, min, max, count: values.length };
    }
    
    return result;
  }
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility function to measure API calls
export const measureApiCall = async <T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.measure(name, apiCall);
};

// Utility function to measure component render time
export const measureRender = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(`${componentName}_render`, duration);
      if (duration > 16) { // 60fps threshold
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  }
  return () => {};
}; 