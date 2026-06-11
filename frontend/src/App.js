import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { NotesProvider } from './context/NotesContext';
import { OpenNotebooksProvider } from './context/OpenNotebooksContext';
import { StudentClassProvider } from './context/StudentClassContext';
import Library from './pages/Library';
import NotebookEditor from './pages/NotebookEditor';
import CommViewer from './pages/CommViewer';
import StudentNotifications from './components/StudentNotifications';
import { Toaster } from './components/ui/sonner';
import AccessGate from './components/AccessGate';
import ErrorBoundary from './components/ErrorBoundary';
import GoogleDriveOAuthHandler from './components/GoogleDriveOAuthHandler';
import { ensureAppConfig } from './lib/appConfig';

function App() {
  React.useEffect(() => {
    ensureAppConfig();
  }, []);
  return (
    <ErrorBoundary>
    <AccessGate>
      <ThemeProvider>
        <SettingsProvider>
          <NotesProvider>
            <GoogleDriveOAuthHandler />
            <OpenNotebooksProvider>
            <StudentClassProvider>
              <div className="App bg-slate-50 dark:bg-chrome-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
                <BrowserRouter basename={process.env.PUBLIC_URL || ''}>
                  <StudentNotifications />
                  <Routes>
                    <Route path="/" element={<Library />} />
                    <Route path="/view/:id" element={<CommViewer />} />
                    <Route path="/notebook/:id" element={<NotebookEditor />} />
                    <Route path="/notebook/:id/page/:pageId" element={<NotebookEditor />} />
                  </Routes>
                </BrowserRouter>
                <Toaster richColors position="bottom-right" />
              </div>
            </StudentClassProvider>
            </OpenNotebooksProvider>
          </NotesProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AccessGate>
    </ErrorBoundary>
  );
}

export default App;
