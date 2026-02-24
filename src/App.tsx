import { AppShell } from './components/layout/AppShell';
import { ReloadPrompt } from './components/ReloadPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
      <ReloadPrompt />
    </>
  );
}

export default App;
