import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Logo from './Logo';
import { useStudentClass } from '../context/StudentClassContext';

const StudentLogin = () => {
  const { loginStudent, syncConfigured } = useStudentClass();
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!classId.trim()) return;
    loginStudent({ displayName: name, classId });
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
      <Logo size="lg" className="mb-8" />
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stu-name">Prénom</Label>
          <Input
            id="stu-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amadou"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stu-class">Code classe</Label>
          <Input
            id="stu-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value.toUpperCase())}
            placeholder="MATH-6A"
            className="uppercase tracking-wide"
            required
          />
          <p className="text-xs text-slate-500">
            Code fourni par votre professeur sur JokkoNote.
          </p>
        </div>
        {!syncConfigured && (
          <p className="text-xs text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-900 p-3">
            Serveur de sync non configuré — définir{' '}
            <code className="text-[11px]">REACT_APP_JOKKO_SYNC_URL</code> (voir SYNC.md).
          </p>
        )}
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
          Rejoindre la classe
        </Button>
      </form>
    </div>
  );
};

export default StudentLogin;
