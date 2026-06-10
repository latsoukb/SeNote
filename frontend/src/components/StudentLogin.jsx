import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Logo from './Logo';
import { useStudentClass } from '../context/StudentClassContext';

const StudentLogin = () => {
  const { setupStudent, deviceCode, syncConfigured } = useStudentClass();
  const [name, setName] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setupStudent(name);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
      <Logo size="lg" className="mb-8" />
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stu-name">Ton prénom</Label>
          <Input
            id="stu-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amadou"
            required
          />
          <p className="text-xs text-slate-500">
            Pas de code classe — ton professeur t&apos;inscrit depuis JokkoNote.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Code à donner au prof</p>
          <p className="text-2xl font-bold tracking-widest text-blue-600">{deviceCode}</p>
        </div>
        {!syncConfigured && (
          <p className="text-xs text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-900 p-3">
            Serveur de sync non configuré.
          </p>
        )}
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
          Continuer
        </Button>
      </form>
    </div>
  );
};

export default StudentLogin;
