import { lazy } from 'react';

// Lazy load heavy step components
export const LazyStepUpload = lazy(() => import('./StepUpload'));
export const LazyStepResults = lazy(() => import('./StepResults'));
export const LazyStepProposalComparison = lazy(() => import('./StepProposalComparison'));
export const LazyStepDataViews = lazy(() => import('./StepDataViews'));
export const LazyStepJurySummary = lazy(() => import('./StepJurySummary'));

// Lazy load utility components
export const LazyToast = lazy(() => import('./Toast'));
export const LazyErrorBoundary = lazy(() => import('./ErrorBoundary'));
