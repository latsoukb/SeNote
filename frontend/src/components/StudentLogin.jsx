import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Logo from './Logo';
import { useStudentClass } from '../context/StudentClassContext';

const StudentLogin = () => {
  const { setupStudent, syncNow, syncConfigured } = useStudentClass();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setupStudent(name);
    await syncNow();
    setSubmitting(false);
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
            autoFocus
          />
          <p className="text-xs text-slate-500">
            Ton code appareil s&apos;affichera après avoir envoyé ta demande — à montrer au prof sur
            cette tablette uniquement.
          </p>
        </div>
        {!syncConfigured && (
          <p className="text-xs text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-900 p-3">
            Serveur de sync non configuré.
          </p>
        )}
        <Button
          type="submit"
          className="w-full bg-brand-600 hover:bg-brand-700 gap-2"
          disabled={submitting || !name.trim()}
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Envoi…' : 'Demander mon inscription'}
        </Button>
      </form>
    </div>
  );
};

export default StudentLogin;
