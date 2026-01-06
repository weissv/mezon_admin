// src/components/ui/ErrorBoundary.tsx
// Компонент для обработки ошибок в React

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showReset?: boolean;
  showHome?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Логируем ошибку
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    // Вызываем callback если передан
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, showReset = true, showHome = true } = this.props;

    if (hasError) {
      // Если передан кастомный fallback
      if (fallback) {
        return fallback;
      }

      // Дефолтный UI ошибки
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Что-то пошло не так
            </h2>
            <p className="text-gray-600 mb-4">
              {error?.message || 'Произошла непредвиденная ошибка'}
            </p>
            <div className="flex justify-center gap-3">
              {showReset && (
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
              )}
              {showHome && (
                <Button onClick={this.handleGoHome}>
                  <Home className="w-4 h-4 mr-2" />
                  На главную
                </Button>
              )}
            </div>
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left bg-gray-100 rounded p-4 text-xs">
                <summary className="cursor-pointer font-medium">Детали ошибки</summary>
                <pre className="mt-2 overflow-auto">{error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// HOC для обёртки компонентов
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
