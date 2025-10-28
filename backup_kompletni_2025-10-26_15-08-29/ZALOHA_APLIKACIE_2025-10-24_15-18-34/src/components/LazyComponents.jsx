import { lazy } from 'react';

// Lazy load heavy components
export const LazyStepUpload = lazy(() => import('./StepUpload'));
export const LazyStepResults = lazy(() => import('./StepResults'));
export const LazyStepComparison = lazy(() => import('./StepComparison'));
export const LazyComparisonDashboard = lazy(() => import('./ComparisonDashboard'));
export const LazyWinnerCalculationBreakdown = lazy(() => import('./WinnerCalculationBreakdown'));
export const LazyWeightedHeatmap = lazy(() => import('./WeightedHeatmap'));
export const LazyRadarChartAdvanced = lazy(() => import('./RadarChartAdvanced'));
export const LazyAIAssistant = lazy(() => import('./AIAssistant'));
// export const LazyAIWeightManager = lazy(() => import('./AIWeightManager')); // Statically imported in StepCriteria

// Lazy load utility components
export const LazyToast = lazy(() => import('./Toast'));
export const LazyErrorBoundary = lazy(() => import('./ErrorBoundary'));

// Lazy load forms and inputs
export const LazyAdvancedSearch = lazy(() => import('./AdvancedSearch'));

// Lazy load developer tools (commented out - statically imported in App.jsx)
// export const LazyDeveloperTools = lazy(() => import('./DeveloperTools'));
// export const LazyPerformanceMonitor = lazy(() => import('./PerformanceMonitor'));
