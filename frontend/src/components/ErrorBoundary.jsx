import React from 'react';
import Logo from './Logo';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('SeNote crash UI', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-chrome-950 px-6 text-center">
          <Logo size="md" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            SeNote a rencontré un problème
          </h1>
          <p className="text-sm text-slate-500 max-w-md">
            L&apos;application s&apos;est arrêtée de façon inattendue. Vos cahiers restent
            enregistrés sur l&apos;appareil.
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium"
            onClick={() => window.location.reload()}
          >
            Relancer SeNote
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
