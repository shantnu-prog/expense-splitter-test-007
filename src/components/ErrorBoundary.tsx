import { Component, type ReactNode } from 'react';

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

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-center px-6">
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">The app encountered an unexpected error.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 min-h-12 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
