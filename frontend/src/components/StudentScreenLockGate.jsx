import React, { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Logo from './Logo';
import { hasStudentLockPin, verifyStudentLockPin } from '../lib/studentScreenLock';
import { getKioskStatus } from '../lib/kioskLock';
import { isNativeApp } from '../lib/platform';

const SESSION_KEY = 'senote-student-unlocked';

/** Verrou SeNote in-app — uniquement sans Device Owner (sinon verrou Android). */
const StudentScreenLockGate = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [required, setRequired] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const check = useCallback(async () => {
    if (!isNativeApp()) {
      setRequired(false);
      setChecking(false);
      return;
    }
    try {
      const status = await getKioskStatus();
      if (status.deviceOwner) {
        setRequired(false);
        return;
      }
      const hasPin = await hasStudentLockPin();
      const unlocked = sessionStorage.getItem(SESSION_KEY) === '1';
      setRequired(hasPin && !unlocked);
    } catch {
      setRequired(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (!isNativeApp() || checking) return children;
  if (!required) return children;

  const submit = async (event) => {
    event.preventDefault();
    const ok = await verifyStudentLockPin(pin);
    if (!ok) {
      setError(true);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');
    setRequired(false);
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100 dark:bg-chrome-950 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm p-8 rounded-2xl bg-white dark:bg-chrome-900 shadow-xl border border-slate-200 dark:border-chrome-800 text-center"
      >
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h1 className="text-xl font-semibold mb-1 flex items-center justify-center gap-2">
          <Lock className="w-5 h-5" />
          Tablette verrouillée
        </h1>
        <p className="text-sm text-slate-500 mb-6">Entrez votre code pour ouvrir SeNote.</p>
        <Input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Votre code"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
            setError(false);
          }}
          className="text-center text-lg tracking-widest mb-3"
          autoFocus
        />
        {error && <p className="text-sm text-red-600 mb-3">Code incorrect</p>}
        <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700">
          Déverrouiller
        </Button>
      </form>
    </div>
  );
};

export default StudentScreenLockGate;
