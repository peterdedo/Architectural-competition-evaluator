import React, { Component, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Send, 
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

class ErrorRecoveryBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      recoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      recoveryAttempts: this.state.recoveryAttempts + 1
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = async (error, errorInfo) => {
    try {
      // In a real app, you would send this to your error reporting service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous'
      };

      // Simulate error reporting
      console.log('Error reported:', errorReport);
      
      // In production, you might send this to Sentry, LogRocket, etc.
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
      isRecovering: true
    }));

    // Simulate recovery delay
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      });
    }, 1000);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      recoveryAttempts: 0
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retryCount={this.state.retryCount}
          isRecovering={this.state.isRecovering}
          recoveryAttempts={this.state.recoveryAttempts}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
          fallback={this.props.fallback}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({
  error,
  errorInfo,
  retryCount,
  isRecovering,
  recoveryAttempts,
  onRetry,
  onReset,
  onGoHome,
  fallback
}) => {
  const [isReporting, setIsReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReportError = useCallback(async () => {
    setIsReporting(true);
    
    try {
      // Simulate error reporting
      await new Promise(resolve => setTimeout(resolve, 2000));
      setReportSent(true);
    } catch (error) {
      console.error('Failed to report error:', error);
    } finally {
      setIsReporting(false);
    }
  }, []);

  // Custom fallback component
  if (fallback) {
    return fallback(error, errorInfo, onRetry);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Oops! Niečo sa pokazilo</h1>
              <p className="text-red-100">Aplikácia narazila na neočakávanú chybu</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Bug size={20} className="text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Detaily chyby</h3>
                <div className="text-sm text-red-700 space-y-1">
                  <div><strong>Chyba:</strong> {error?.message || 'Neznáma chyba'}</div>
                  <div><strong>Čas:</strong> {new Date().toLocaleString()}</div>
                  <div><strong>Pokusy o obnovenie:</strong> {recoveryAttempts}</div>
                  <div className="flex items-center gap-2">
                    <strong>Stav pripojenia:</strong>
                    {isOnline ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Wifi size={16} />
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <WifiOff size={16} />
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Status */}
          {isRecovering && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <RefreshCw size={20} className="text-blue-600 animate-spin" />
                <div>
                  <h3 className="font-semibold text-blue-900">Obnovuje sa...</h3>
                  <p className="text-sm text-blue-700">
                    Pokúšame sa opraviť problém automaticky
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                disabled={isRecovering}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={16} className={isRecovering ? 'animate-spin' : ''} />
                {isRecovering ? 'Obnovuje sa...' : 'Skúsiť znovu'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <XCircle size={16} />
                Resetovať
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Home size={16} />
                Domov
              </motion.button>
            </div>

            {/* Error Reporting */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Nahlásiť problém</h4>
                  <p className="text-sm text-gray-600">
                    Pomôžte nám zlepšiť aplikáciu nahlásením tejto chyby
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReportError}
                  disabled={isReporting || reportSent}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isReporting ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Odosiela sa...
                    </>
                  ) : reportSent ? (
                    <>
                      <CheckCircle size={16} />
                      Odoslané
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Nahlásiť
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Debug Info (Development Only) */}
          {process.env.NODE_ENV === 'development' && errorInfo && (
            <details className="bg-gray-100 rounded-xl p-4">
              <summary className="font-medium text-gray-900 cursor-pointer">
                Debug informácie (iba pre vývojárov)
              </summary>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <strong>Error Stack:</strong>
                  <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                    {error?.stack}
                  </pre>
                </div>
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorRecoveryBoundary;


