import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { NotesProvider } from './context/NotesContext';
import Library from './pages/Library';
import NotebookEditor from './pages/NotebookEditor';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <NotesProvider>
          <div className="App bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Library />} />
                <Route path="/notebook/:id" element={<NotebookEditor />} />
                <Route path="/notebook/:id/page/:pageId" element={<NotebookEditor />} />
              </Routes>
            </BrowserRouter>
            <Toaster richColors position="bottom-right" />
          </div>
        </NotesProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
