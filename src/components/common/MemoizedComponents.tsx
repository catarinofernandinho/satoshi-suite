import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// Memoized UI components for better performance
export const MemoizedCard = React.memo(Card);
export const MemoizedCardContent = React.memo(CardContent);
export const MemoizedCardDescription = React.memo(CardDescription);
export const MemoizedCardHeader = React.memo(CardHeader);
export const MemoizedCardTitle = React.memo(CardTitle);
export const MemoizedButton = React.memo(Button);
export const MemoizedInput = React.memo(Input);
export const MemoizedSkeleton = React.memo(Skeleton);

// Performance optimized component wrapper
export function withPerformance<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  displayName?: string
) {
  const WrappedComponent = React.memo(Component);
  if (displayName) {
    WrappedComponent.displayName = displayName;
  }
  return WrappedComponent;
}

export default withPerformance;