import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { MotionProvider } from './Motion';
import './styles.css';
import './refinements.css';
import './auth.css';
import './themes.css';
import { applyTheme, readTheme } from './theme';
applyTheme(readTheme());
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <main className="error-fallback">
          <h1>The console hit a snag.</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => location.reload()}>Reload console</button>
        </main>
      );
    return this.props.children;
  }
}
createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <MotionProvider>
      <App />
    </MotionProvider>
  </ErrorBoundary>,
);
