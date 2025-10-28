import { useState, useEffect, useCallback, useRef } from 'react';

export const useLazyLoad = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    enabled = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    const isVisible = entry.isIntersecting;
    
    setIsIntersecting(isVisible);
    
    if (isVisible && !hasIntersected) {
      setHasIntersected(true);
    }
  }, [hasIntersected]);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    observer.observe(elementRef.current);

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [handleIntersection, threshold, rootMargin, enabled]);

  const shouldLoad = triggerOnce ? hasIntersected : isIntersecting;

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
    shouldLoad
  };
};

// Hook for preloading components
export const usePreload = () => {
  const [preloadedComponents, setPreloadedComponents] = useState(new Set());
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadComponent = useCallback(async (componentImport) => {
    if (preloadedComponents.has(componentImport)) {
      return true;
    }

    setIsPreloading(true);
    try {
      await componentImport();
      setPreloadedComponents(prev => new Set([...prev, componentImport]));
      return true;
    } catch (error) {
      console.error('Preload failed:', error);
      return false;
    } finally {
      setIsPreloading(false);
    }
  }, [preloadedComponents]);

  const preloadMultiple = useCallback(async (imports) => {
    setIsPreloading(true);
    try {
      const results = await Promise.allSettled(
        imports.map(importFn => importFn())
      );
      
      const successful = results
        .filter(result => result.status === 'fulfilled')
        .length;
      
      setPreloadedComponents(prev => new Set([...prev, ...imports]));
      return successful === imports.length;
    } catch (error) {
      console.error('Batch preload failed:', error);
      return false;
    } finally {
      setIsPreloading(false);
    }
  }, []);

  return {
    preloadComponent,
    preloadMultiple,
    isPreloading,
    preloadedCount: preloadedComponents.size
  };
};

// Hook for route-based code splitting
export const useRoutePreload = () => {
  const [preloadedRoutes, setPreloadedRoutes] = useState(new Set());

  const preloadRoute = useCallback(async (routeName, importFn) => {
    if (preloadedRoutes.has(routeName)) {
      return true;
    }

    try {
      await importFn();
      setPreloadedRoutes(prev => new Set([...prev, routeName]));
      return true;
    } catch (error) {
      console.error(`Route preload failed for ${routeName}:`, error);
      return false;
    }
  }, [preloadedRoutes]);

  const preloadNextRoute = useCallback((currentRoute, routes) => {
    const currentIndex = routes.indexOf(currentRoute);
    const nextRoute = routes[currentIndex + 1];
    
    if (nextRoute && nextRoute.preload) {
      nextRoute.preload();
    }
  }, []);

  return {
    preloadRoute,
    preloadNextRoute,
    preloadedRoutes: Array.from(preloadedRoutes)
  };
};

// Hook for image lazy loading
export const useLazyImage = (src, options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+'
  } = options;

  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const { elementRef, shouldLoad } = useLazyLoad({ threshold, rootMargin });

  useEffect(() => {
    if (shouldLoad && src && !isLoaded && !hasError) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      
      img.onerror = () => {
        setHasError(true);
      };
      
      img.src = src;
    }
  }, [shouldLoad, src, isLoaded, hasError]);

  return {
    elementRef,
    imageSrc,
    isLoaded,
    hasError,
    shouldLoad
  };
};

