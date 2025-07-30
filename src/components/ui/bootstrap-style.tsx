import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

// Bootstrap-style Alert component
interface AlertProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({ 
  variant = 'primary', 
  children, 
  className,
  dismissible = false,
  onDismiss 
}: AlertProps) {
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground border-primary',
    secondary: 'bg-secondary text-secondary-foreground border-secondary',
    success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    danger: 'bg-destructive text-destructive-foreground border-destructive',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    light: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
    dark: 'bg-gray-800 text-gray-200 border-gray-700 dark:bg-gray-200 dark:text-gray-800 dark:border-gray-300'
  };

  return (
    <div className={cn(
      'border rounded-lg p-4 relative',
      variantClasses[variant],
      className
    )}>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 text-sm opacity-70 hover:opacity-100"
          aria-label="Close"
        >
          ×
        </button>
      )}
      {children}
    </div>
  );
}

// Bootstrap-style Badge component
interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  children: React.ReactNode;
  className?: string;
  pill?: boolean;
}

export function Badge({ 
  variant = 'primary', 
  children, 
  className,
  pill = false 
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    danger: 'bg-destructive text-destructive-foreground',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    light: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    dark: 'bg-gray-800 text-gray-200 dark:bg-gray-200 dark:text-gray-800'
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 text-xs font-medium',
      pill ? 'rounded-full' : 'rounded',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

// Bootstrap-style Progress component
interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  striped?: boolean;
  animated?: boolean;
  className?: string;
}

export function Progress({ 
  value, 
  max = 100, 
  variant = 'primary',
  striped = false,
  animated = false,
  className 
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-green-500',
    danger: 'bg-destructive',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700', className)}>
      <div
        className={cn(
          'h-2 rounded-full transition-all duration-300',
          variantClasses[variant],
          striped && 'bg-stripes',
          animated && 'animate-pulse'
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Bootstrap-style Jumbotron component
interface JumbotronProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  fluid?: boolean;
}

export function Jumbotron({ 
  title, 
  subtitle, 
  children, 
  className,
  fluid = false 
}: JumbotronProps) {
  return (
    <div className={cn(
      'bg-gray-50 dark:bg-gray-900 border rounded-lg p-6',
      fluid ? 'container-fluid' : 'container',
      className
    )}>
      {title && <h1 className="text-4xl font-bold mb-4">{title}</h1>}
      {subtitle && <p className="text-xl text-muted-foreground mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

// Bootstrap-style Button Group component
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  vertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ButtonGroup({ 
  children, 
  className,
  vertical = false,
  size = 'md' 
}: ButtonGroupProps) {
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className={cn(
      'inline-flex',
      vertical ? 'flex-col' : 'flex-row',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
}

// Bootstrap-style Card with Bootstrap styling
interface BootstrapCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function BootstrapCard({ 
  title, 
  subtitle, 
  children, 
  className,
  header,
  footer,
  variant = 'default' 
}: BootstrapCardProps) {
  const variantClasses = {
    default: 'bg-card text-card-foreground border',
    outlined: 'bg-transparent border-2',
    elevated: 'bg-card text-card-foreground shadow-lg border-0'
  };

  return (
    <Card className={cn('rounded-lg overflow-hidden', variantClasses[variant], className)}>
      {header && (
        <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-800">
          {header}
        </div>
      )}
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-6">
        {children}
      </CardContent>
      {footer && (
        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800">
          {footer}
        </div>
      )}
    </Card>
  );
} 