import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';

// Loading component
const LoadingSpinner = ({ message = "Načítava sa..." }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
  >
    <div className="relative">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
    </div>
    <p className="text-gray-600 text-sm font-medium">{message}</p>
  </motion.div>
);

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Chyba pri načítaní komponenty</h3>
          <p className="text-gray-600 text-center max-w-md">
            Komponenta sa nepodarilo načítať. Skúste obnoviť stránku alebo kontaktujte podporu.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Obnoviť stránku
          </button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Lazy wrapper component
const LazyWrapper = ({ 
  children, 
  fallback = null, 
  errorFallback = null,
  loadingMessage = "Načítava sa...",
  minHeight = "400px"
}) => {
  const defaultFallback = fallback || <LoadingSpinner message={loadingMessage} />;
  
  return (
    <LazyErrorBoundary>
      <Suspense fallback={defaultFallback}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ minHeight }}
        >
          {children}
        </motion.div>
      </Suspense>
    </LazyErrorBoundary>
  );
};

export default LazyWrapper;

