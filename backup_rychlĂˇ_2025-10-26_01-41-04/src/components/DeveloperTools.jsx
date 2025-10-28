import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  Bug, 
  Database, 
  Network, 
  Settings, 
  Eye, 
  EyeOff,
  Copy,
  Download,
  Trash2,
  Play,
  Pause,
  Square,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Terminal,
  BarChart3,
  Clock,
  MemoryStick,
  Cpu,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

const DeveloperTools = ({ 
  isVisible = false, 
  onToggle, 
  className = "" 
}) => {
  const [activeTab, setActiveTab] = useState('console');
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [networkRequests, setNetworkRequests] = useState([]);
  const [stateHistory, setStateHistory] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [filters, setFilters] = useState({
    level: 'all',
    search: '',
    timeRange: 'all'
  });

  const consoleRef = useRef(null);
  const originalConsoleRef = useRef({});

  // Intercept console methods
  useEffect(() => {
    if (!isVisible) return;

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    originalConsoleRef.current = originalConsole;

    const interceptConsole = (level) => {
      return (...args) => {
        // Call original method
        originalConsole[level](...args);
        
        // Add to our logs
        const logEntry = {
          id: Date.now() + Math.random(),
          level,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: new Date(),
          stack: new Error().stack
        };
        
        setLogs(prev => [...prev.slice(-999), logEntry]);
      };
    };

    // Override console methods
    console.log = interceptConsole('log');
    console.warn = interceptConsole('warn');
    console.error = interceptConsole('error');
    console.info = interceptConsole('info');

    return () => {
      // Restore original console methods
      Object.assign(console, originalConsole);
    };
  }, [isVisible]);

  // Intercept fetch requests
  useEffect(() => {
    if (!isVisible) return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const requestId = Date.now() + Math.random();
      
      const request = {
        id: requestId,
        url: args[0],
        method: 'GET',
        startTime,
        status: 'pending'
      };
      
      setNetworkRequests(prev => [...prev, request]);
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        setNetworkRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: response.status, duration: endTime - startTime, response }
            : req
        ));
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        setNetworkRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'error', duration: endTime - startTime, error: error.message }
            : req
        ));
        
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isVisible]);

  // Monitor performance
  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const metrics = {
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null,
        timing: performance.timing ? {
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
        } : null,
        navigation: performance.getEntriesByType('navigation')[0] || null
      };
      
      setPerformanceMetrics(metrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filters.level !== 'all' && log.level !== filters.level) return false;
      if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [logs, filters]);

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Clear network requests
  const clearNetworkRequests = () => {
    setNetworkRequests([]);
  };

  // Export logs
  const exportLogs = () => {
    const data = {
      logs: filteredLogs,
      networkRequests,
      performanceMetrics,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devtools-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Get log level color
  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    if (typeof status === 'number') {
      if (status >= 200 && status < 300) return 'text-green-600';
      if (status >= 300 && status < 400) return 'text-yellow-600';
      if (status >= 400) return 'text-red-600';
    }
    if (status === 'error') return 'text-red-600';
    if (status === 'pending') return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-4 left-4 z-50 ${className}`}
    >
      <div className={`bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden ${
        isExpanded ? 'w-96 h-96' : 'w-80 h-64'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code size={20} />
              <h3 className="font-semibold">Developer Tools</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <EyeOff size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'console', label: 'Console', icon: Terminal },
            { id: 'network', label: 'Network', icon: Network },
            { id: 'performance', label: 'Performance', icon: BarChart3 },
            { id: 'state', label: 'State', icon: Database }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === id 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Console Tab */}
          {activeTab === 'console' && (
            <div className="h-full flex flex-col">
              {/* Filters */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <select
                    value={filters.level}
                    onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                    className="px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="all">All</option>
                    <option value="log">Log</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                    <option value="info">Info</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  <button
                    onClick={clearLogs}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Logs */}
              <div ref={consoleRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs">
                {filteredLogs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No logs</div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="mb-2 p-2 rounded border-l-2 border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <button
                          onClick={() => copyToClipboard(log.message)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <div className="text-gray-800 whitespace-pre-wrap">{log.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Network Tab */}
          {activeTab === 'network' && (
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Network Requests</span>
                  <button
                    onClick={clearNetworkRequests}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {networkRequests.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No requests</div>
                ) : (
                  networkRequests.map((request) => (
                    <div key={request.id} className="p-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-400' :
                            request.status === 'error' ? 'bg-red-400' :
                            typeof request.status === 'number' && request.status >= 200 && request.status < 300 ? 'bg-green-400' :
                            'bg-gray-400'
                          }`} />
                          <span className="font-mono text-sm">{request.method}</span>
                          <span className="text-sm text-gray-600 truncate">{request.url}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          {request.duration && (
                            <span className="text-xs text-gray-500">
                              {request.duration.toFixed(0)}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Memory Usage</h4>
                {performanceMetrics.memory ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used:</span>
                      <span>{(performanceMetrics.memory.used / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total:</span>
                      <span>{(performanceMetrics.memory.total / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Limit:</span>
                      <span>{(performanceMetrics.memory.limit / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${(performanceMetrics.memory.used / performanceMetrics.memory.limit) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Memory info not available</div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Timing</h4>
                {performanceMetrics.timing ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>DOM Content Loaded:</span>
                      <span>{performanceMetrics.timing.domContentLoaded.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Load Complete:</span>
                      <span>{performanceMetrics.timing.loadComplete.toFixed(0)}ms</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Timing info not available</div>
                )}
              </div>
            </div>
          )}

          {/* State Tab */}
          {activeTab === 'state' && (
            <div className="h-full overflow-y-auto p-4">
              <div className="text-gray-500 text-center py-8">
                State inspector coming soon...
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600">
              {activeTab === 'console' && `${filteredLogs.length} logs`}
              {activeTab === 'network' && `${networkRequests.length} requests`}
              {activeTab === 'performance' && 'Real-time metrics'}
              {activeTab === 'state' && 'State inspector'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportLogs}
                className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                title="Export logs"
              >
                <Download size={14} />
              </button>
              <button
                onClick={() => window.location.reload()}
                className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                title="Reload page"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DeveloperTools;
