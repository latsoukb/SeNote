import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Logo from './Logo';
import { isKioskApp } from '../lib/platform';

const BETA_PIN = process.env.REACT_APP_BETA_PIN || '';
const SESSION_KEY = 'senote-beta-access';

const AccessGate = ({ children }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [granted, setGranted] = useState(() => {
    if (!BETA_PIN) return true;
    try {
      return sessionStorage.getItem(SESSION_KEY) === BETA_PIN;
    } catch {
      return false;
    }
  });

  if (!BETA_PIN || granted || isKioskApp()) return children;

  const submit = (e) => {
    e.preventDefault();
    if (pin.trim() === BETA_PIN) {
      try {
        sessionStorage.setItem(SESSION_KEY, BETA_PIN);
      } catch {
        /* ignore */
      }
      setGranted(true);
      setError(false);
      return;
    }
    setError(true);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-100 dark:bg-chrome-950 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm p-8 rounded-2xl bg-white dark:bg-chrome-900 shadow-xl border border-slate-200 dark:border-chrome-800 text-center"
      >
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h1 className="text-xl font-semibold mb-1">Accès bêta privé</h1>
        <p className="text-sm text-slate-500 mb-6">
          Entrez le code fourni par l&apos;équipe SeNote pour tester l&apos;application.
        </p>
        <Input
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Code d'accès"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          className="text-center text-lg tracking-widest mb-3"
          autoFocus
        />
        {error && <p className="text-sm text-red-600 mb-3">Code incorrect</p>}
        <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700">
          Entrer
        </Button>
      </form>
    </div>
  );
};

export default AccessGate;
