import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  Clock, 
  Database, 
  Cpu, 
  MemoryStick,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

const PerformanceMonitor = ({ 
  isVisible = false, 
  onToggle, 
  className = "" 
}) => {
  const [metrics, setMetrics] = useState({
    // Web Vitals
    lcp: null, // Largest Contentful Paint
    fid: null, // First Input Delay
    cls: null, // Cumulative Layout Shift
    fcp: null, // First Contentful Paint
    ttfb: null, // Time to First Byte
    
    // Custom Metrics
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    errorCount: 0,
    apiCalls: 0,
    cacheHitRate: 0,
    
    // Real-time Metrics
    fps: 60,
    cpuUsage: 0,
    memoryPressure: 'normal'
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordedMetrics, setRecordedMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const observerRef = useRef(null);
  const performanceObserverRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Initialize performance monitoring
  useEffect(() => {
    if (!isVisible) return;

    // Web Vitals monitoring
    initializeWebVitals();
    
    // Custom metrics monitoring
    initializeCustomMetrics();
    
    // Real-time monitoring
    const interval = setInterval(updateRealTimeMetrics, 1000);
    
    return () => {
      clearInterval(interval);
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [isVisible]);

  // Initialize Web Vitals monitoring
  const initializeWebVitals = () => {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP monitoring not supported');
      }

      // FID - First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID monitoring not supported');
      }

      // CLS - Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              setMetrics(prev => ({ ...prev, cls: clsValue }));
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS monitoring not supported');
      }
    }

    // FCP - First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('FCP monitoring not supported');
      }
    }

    // TTFB - Time to First Byte
    if ('PerformanceObserver' in window) {
      try {
        const ttfbObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              setMetrics(prev => ({ ...prev, ttfb: entry.responseStart - entry.requestStart }));
            }
          });
        });
        ttfbObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('TTFB monitoring not supported');
      }
    }
  };

  // Initialize custom metrics
  const initializeCustomMetrics = () => {
    // Memory usage
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = performance.memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
        }));
      };
      updateMemoryUsage();
      setInterval(updateMemoryUsage, 5000);
    }

    // Network latency
    const measureNetworkLatency = () => {
      const start = performance.now();
      fetch('/api/ping', { method: 'HEAD' })
        .then(() => {
          const latency = performance.now() - start;
          setMetrics(prev => ({ ...prev, networkLatency: latency }));
        })
        .catch(() => {
          setMetrics(prev => ({ ...prev, networkLatency: -1 }));
        });
    };
    measureNetworkLatency();
    setInterval(measureNetworkLatency, 10000);

    // Error counting
    const originalError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
      if (originalError) originalError(message, source, lineno, colno, error);
    };

    // API calls counting
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      setMetrics(prev => ({ ...prev, apiCalls: prev.apiCalls + 1 }));
      return originalFetch(...args);
    };
  };

  // Update real-time metrics
  const updateRealTimeMetrics = () => {
    // FPS calculation
    frameCountRef.current++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    
    if (deltaTime >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
      setMetrics(prev => ({ ...prev, fps }));
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }

    // Memory pressure detection
    if ('memory' in performance) {
      const memory = performance.memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      let pressure = 'normal';
      
      if (usage > 0.9) pressure = 'critical';
      else if (usage > 0.7) pressure = 'high';
      else if (usage > 0.5) pressure = 'medium';
      
      setMetrics(prev => ({ ...prev, memoryPressure: pressure }));
    }

    // Check for performance issues
    checkPerformanceAlerts();
  };

  // Check for performance alerts
  const checkPerformanceAlerts = () => {
    const newAlerts = [];

    if (metrics.lcp && metrics.lcp > 2500) {
      newAlerts.push({
        id: 'lcp-slow',
        type: 'warning',
        message: `LCP je pomalý: ${metrics.lcp.toFixed(0)}ms`,
        metric: 'lcp',
        value: metrics.lcp
      });
    }

    if (metrics.fid && metrics.fid > 100) {
      newAlerts.push({
        id: 'fid-slow',
        type: 'error',
        message: `FID je pomalý: ${metrics.fid.toFixed(0)}ms`,
        metric: 'fid',
        value: metrics.fid
      });
    }

    if (metrics.cls && metrics.cls > 0.1) {
      newAlerts.push({
        id: 'cls-high',
        type: 'warning',
        message: `CLS je vysoký: ${metrics.cls.toFixed(3)}`,
        metric: 'cls',
        value: metrics.cls
      });
    }

    if (metrics.fps < 30) {
      newAlerts.push({
        id: 'fps-low',
        type: 'error',
        message: `Nízky FPS: ${metrics.fps}`,
        metric: 'fps',
        value: metrics.fps
      });
    }

    if (metrics.memoryUsage > 0.8) {
      newAlerts.push({
        id: 'memory-high',
        type: 'warning',
        message: `Vysoké využitie pamäte: ${(metrics.memoryUsage * 100).toFixed(1)}%`,
        metric: 'memory',
        value: metrics.memoryUsage
      });
    }

    setAlerts(newAlerts);
  };

  // Start/stop recording
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setRecordedMetrics([]);
    }
  };

  // Record metrics
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordedMetrics(prev => [...prev, {
          timestamp: Date.now(),
          ...metrics
        }]);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isRecording, metrics]);

  // Export metrics
  const exportMetrics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      currentMetrics: metrics,
      recordedMetrics: recordedMetrics,
      alerts: alerts
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get metric status
  const getMetricStatus = (value, thresholds) => {
    if (value === null || value === undefined) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-4 right-4 z-50 ${className}`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity size={24} />
              <div>
                <h3 className="font-semibold">Performance Monitor</h3>
                <p className="text-sm text-blue-100">Real-time metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleRecording}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {isRecording ? <div className="w-3 h-3 bg-white rounded-full" /> : <Clock size={16} />}
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Web Vitals */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 size={16} />
              Web Vitals
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">LCP</div>
                <div className={`font-semibold ${getStatusColor(
                  getMetricStatus(metrics.lcp, { good: 2500, needsImprovement: 4000 })
                )}`}>
                  {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">FID</div>
                <div className={`font-semibold ${getStatusColor(
                  getMetricStatus(metrics.fid, { good: 100, needsImprovement: 300 })
                )}`}>
                  {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">CLS</div>
                <div className={`font-semibold ${getStatusColor(
                  getMetricStatus(metrics.cls, { good: 0.1, needsImprovement: 0.25 })
                )}`}>
                  {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">FCP</div>
                <div className={`font-semibold ${getStatusColor(
                  getMetricStatus(metrics.fcp, { good: 1800, needsImprovement: 3000 })
                )}`}>
                  {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Metrics */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap size={16} />
              Real-time
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">FPS</div>
                <div className={`font-semibold ${
                  metrics.fps >= 60 ? 'text-green-600' : 
                  metrics.fps >= 30 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.fps}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Memory</div>
                <div className={`font-semibold ${
                  metrics.memoryPressure === 'normal' ? 'text-green-600' :
                  metrics.memoryPressure === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(metrics.memoryUsage * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">API Calls</div>
                <div className="font-semibold text-gray-900">{metrics.apiCalls}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Errors</div>
                <div className={`font-semibold ${
                  metrics.errorCount === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.errorCount}
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} />
                Alerts ({alerts.length})
              </h4>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg text-sm ${
                      alert.type === 'error' ? 'bg-red-50 text-red-700' :
                      alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expanded View */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Detailed Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">TTFB:</span>
                      <span className="font-medium">
                        {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network Latency:</span>
                      <span className="font-medium">
                        {metrics.networkLatency >= 0 ? `${metrics.networkLatency.toFixed(0)}ms` : 'Offline'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cache Hit Rate:</span>
                      <span className="font-medium">
                        {(metrics.cacheHitRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {isRecording && recordedMetrics.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Recording ({recordedMetrics.length}s)
                    </h4>
                    <div className="text-sm text-gray-600">
                      Recording {recordedMetrics.length} data points...
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {isRecording ? 'Recording...' : 'Ready'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportMetrics}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Export metrics"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceMonitor;


