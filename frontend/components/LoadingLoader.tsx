import React from 'react';
import { clsx } from 'clsx';

interface LoadingLoaderProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingLoader: React.FC<LoadingLoaderProps> = ({ 
  className,
  size = 'medium'
}) => (
  <div className={clsx(
    'animate-spin rounded-full border-2',
    'border-t-transparent border-slate-color-success',
    size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-6 h-6' : 'w-8 h-8',
    className
  )} />
);