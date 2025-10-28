import { useState, useCallback, useRef, useEffect } from 'react';

export const useErrorRecovery = (options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = (error) => true,
    onRetry = () => {},
    onMaxRetriesReached = () => {},
    onSuccess = () => {},
    onError = () => {}
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [retryHistory, setRetryHistory] = useState([]);
  
  const retryTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Calculate delay with exponential backoff
  const calculateDelay = (attempt) => {
    const delay = Math.min(
      baseDelay * Math.pow(backoffMultiplier, attempt),
      maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  };

  // Retry function with exponential backoff
  const retry = useCallback(async (asyncFunction, ...args) => {
    let attempt = 0;
    let lastError = null;

    const executeWithRetry = async () => {
      try {
        // Create new abort controller for this attempt
        abortControllerRef.current = new AbortController();
        
        // Execute the function
        const result = await asyncFunction(...args, abortControllerRef.current.signal);
        
        // Success - reset retry state
        setRetryCount(0);
        setIsRetrying(false);
        setLastError(null);
        onSuccess(result);
        
        return result;
      } catch (error) {
        lastError = error;
        setLastError(error);
        
        // Check if we should retry
        if (attempt < maxRetries && retryCondition(error)) {
          attempt++;
          setRetryCount(attempt);
          setIsRetrying(true);
          
          // Record retry attempt
          const retryRecord = {
            attempt,
            error: error.message,
            timestamp: new Date(),
            delay: calculateDelay(attempt - 1)
          };
          setRetryHistory(prev => [...prev, retryRecord]);
          
          onRetry(attempt, error);
          
          // Wait before retrying
          const delay = calculateDelay(attempt - 1);
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, delay);
          });
          
          // Check if operation was aborted
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Operation aborted');
          }
          
          // Retry
          return executeWithRetry();
        } else {
          // Max retries reached or retry condition not met
          setIsRetrying(false);
          onMaxRetriesReached(attempt, error);
          onError(error);
          throw error;
        }
      }
    };

    return executeWithRetry();
  }, [maxRetries, baseDelay, maxDelay, backoffMultiplier, retryCondition, onRetry, onMaxRetriesReached, onSuccess, onError]);

  // Cancel retry operation
  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRetrying(false);
  }, []);

  // Reset retry state
  const resetRetry = useCallback(() => {
    cancelRetry();
    setRetryCount(0);
    setLastError(null);
    setRetryHistory([]);
  }, [cancelRetry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRetry();
    };
  }, [cancelRetry]);

  return {
    retry,
    cancelRetry,
    resetRetry,
    retryCount,
    isRetrying,
    lastError,
    retryHistory,
    canRetry: retryCount < maxRetries
  };
};

// Hook for API calls with retry
export const useApiWithRetry = (apiFunction, options = {}) => {
  const {
    retryOnNetworkError = true,
    retryOnServerError = true,
    retryOnTimeout = true,
    ...retryOptions
  } = options;

  const retryCondition = useCallback((error) => {
    // Network errors
    if (retryOnNetworkError && (
      error.name === 'NetworkError' ||
      error.message.includes('network') ||
      error.message.includes('fetch')
    )) {
      return true;
    }

    // Server errors (5xx)
    if (retryOnServerError && error.status >= 500) {
      return true;
    }

    // Timeout errors
    if (retryOnTimeout && (
      error.name === 'TimeoutError' ||
      error.message.includes('timeout')
    )) {
      return true;
    }

    // Rate limiting (429)
    if (error.status === 429) {
      return true;
    }

    return false;
  }, [retryOnNetworkError, retryOnServerError, retryOnTimeout]);

  const errorRecovery = useErrorRecovery({
    ...retryOptions,
    retryCondition
  });

  const callApi = useCallback(async (...args) => {
    return errorRecovery.retry(apiFunction, ...args);
  }, [apiFunction, errorRecovery]);

  return {
    ...errorRecovery,
    callApi
  };
};

// Hook for component error recovery
export const useComponentErrorRecovery = (componentName) => {
  const [error, setError] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const maxRecoveryAttempts = 3;

  const handleError = useCallback((error, errorInfo) => {
    console.error(`Error in ${componentName}:`, error, errorInfo);
    setError(error);
    
    // Attempt recovery
    if (recoveryAttempts < maxRecoveryAttempts) {
      setIsRecovering(true);
      setRecoveryAttempts(prev => prev + 1);
      
      // Simulate recovery delay
      setTimeout(() => {
        setIsRecovering(false);
        setError(null);
      }, 1000 * (recoveryAttempts + 1));
    }
  }, [componentName, recoveryAttempts, maxRecoveryAttempts]);

  const resetError = useCallback(() => {
    setError(null);
    setIsRecovering(false);
    setRecoveryAttempts(0);
  }, []);

  return {
    error,
    isRecovering,
    recoveryAttempts,
    handleError,
    resetError,
    hasError: !!error,
    canRecover: recoveryAttempts < maxRecoveryAttempts
  };
};

// Hook for offline/online detection and recovery
export const useOfflineRecovery = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
      
      // Process pending operations
      if (pendingOperations.length > 0) {
        processPendingOperations();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingOperations]);

  const queueOperation = useCallback((operation) => {
    setPendingOperations(prev => [...prev, {
      id: Date.now(),
      operation,
      timestamp: new Date(),
      attempts: 0
    }]);
  }, []);

  const processPendingOperations = useCallback(async () => {
    const operations = [...pendingOperations];
    setPendingOperations([]);

    for (const op of operations) {
      try {
        await op.operation();
      } catch (error) {
        console.error('Failed to process pending operation:', error);
        // Re-queue if not too many attempts
        if (op.attempts < 3) {
          setPendingOperations(prev => [...prev, {
            ...op,
            attempts: op.attempts + 1
          }]);
        }
      }
    }
  }, [pendingOperations]);

  return {
    isOnline,
    isReconnecting,
    pendingOperations: pendingOperations.length,
    queueOperation
  };
};

// Hook for graceful degradation
export const useGracefulDegradation = (features) => {
  const [availableFeatures, setAvailableFeatures] = useState({});
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkFeatures = async () => {
      const results = {};
      
      for (const [featureName, checkFunction] of Object.entries(features)) {
        try {
          const isAvailable = await checkFunction();
          results[featureName] = isAvailable;
        } catch (error) {
          console.warn(`Feature ${featureName} check failed:`, error);
          results[featureName] = false;
        }
      }
      
      setAvailableFeatures(results);
      setIsChecking(false);
    };

    checkFeatures();
  }, [features]);

  const isFeatureAvailable = useCallback((featureName) => {
    return availableFeatures[featureName] === true;
  }, [availableFeatures]);

  const getFallback = useCallback((featureName, fallback) => {
    return isFeatureAvailable(featureName) ? features[featureName] : fallback;
  }, [availableFeatures, features]);

  return {
    availableFeatures,
    isChecking,
    isFeatureAvailable,
    getFallback
  };
};


