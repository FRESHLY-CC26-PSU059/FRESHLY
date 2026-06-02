import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import logger from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('[ErrorBoundary]', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <p className="text-app-text-secondary text-sm">Gagal memuat halaman.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs font-bold text-primary-600 hover:underline"
          >
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
