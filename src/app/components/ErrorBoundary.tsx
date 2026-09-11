import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Unhandled render error:', error, info);
  }

  private handleReload = () => {
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="text-center max-w-sm">
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-6">
              The app hit an unexpected error. Reloading usually fixes it.
            </p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-[#1A2B3C] text-white text-sm font-medium"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
