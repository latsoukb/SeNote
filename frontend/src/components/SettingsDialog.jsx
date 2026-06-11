import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Settings, Download, ArrowDown, ArrowLeft, Sun, Moon, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { ACCENT_OPTIONS } from '../lib/accentThemes';
import { useStudentClass } from '../context/StudentClassContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import GoogleDriveSettings from './GoogleDriveSettings';
import StudentDeviceCode from './StudentDeviceCode';
import { isNativeApp } from '../lib/platform';

const SettingsDialog = ({ trigger }) => {
  const { settings, updateSettings } = useSettings();
  const { theme, accent, toggleTheme, setAccent } = useTheme();
  const { session: studentSession } = useStudentClass();
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [open, setOpen] = React.useState(false);

  const handleInstall = async () => {
    const ok = await install();
    if (ok) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Paramètres">
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {studentSession && <StudentDeviceCode variant="settings" />}

          <div className="space-y-3">
            <Label>Apparence</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  theme === 'light'
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-sm font-medium">Clair</span>
              </button>
              <button
                type="button"
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-sm font-medium">Sombre</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">Couleur d&apos;accent de l&apos;interface</p>
            <div className="grid grid-cols-3 gap-2">
              {ACCENT_OPTIONS.map((option) => {
                const selected = accent === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAccent(option.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all ${
                      selected
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                    aria-label={`Couleur ${option.label}`}
                    aria-pressed={selected}
                  >
                    <span
                      className="w-8 h-8 rounded-full border border-black/10 dark:border-white/20 flex items-center justify-center"
                      style={{ backgroundColor: option.swatch }}
                    >
                      {selected && <Check className="w-4 h-4 text-white drop-shadow-sm" strokeWidth={3} />}
                    </span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Défilement des pages</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ scrollDirection: 'vertical' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.scrollDirection === 'vertical'
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <ArrowDown className="w-6 h-6" />
                <span className="text-sm font-medium">Vers le bas</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ scrollDirection: 'horizontal' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.scrollDirection === 'horizontal'
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
                <span className="text-sm font-medium">Vers la gauche</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Choisissez comment faire défiler les pages dans un cahier. L&apos;ajout automatique
              de page suit la même direction.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="stylus-only">Stylet uniquement pour écrire</Label>
              <p className="text-xs text-slate-500">
                Comme GoodNotes : le stylet écrit, le doigt fait défiler la page. La paume est
                ignorée.
              </p>
            </div>
            <Switch
              id="stylus-only"
              checked={settings.stylusOnly !== false}
              onCheckedChange={(v) => updateSettings({ stylusOnly: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-add">Ajout auto de page</Label>
              <p className="text-xs text-slate-500">
                Nouvelle page au même style en fin de défilement
              </p>
            </div>
            <Switch
              id="auto-add"
              checked={settings.autoAddPage}
              onCheckedChange={(v) => updateSettings({ autoAddPage: v })}
            />
          </div>

          <GoogleDriveSettings />

          {!isNativeApp() && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Label>Raccourci / installation</Label>
            {isInstalled ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                SeNote est installé sur cet appareil.
              </p>
            ) : canInstall ? (
              <Button onClick={handleInstall} className="w-full gap-2 bg-brand-600 hover:bg-brand-700">
                <Download className="w-4 h-4" />
                Installer SeNote (raccourci)
              </Button>
            ) : (
              <p className="text-xs text-slate-500">
                Sur iPad/iPhone : partage Safari → « Sur l&apos;écran d&apos;accueil ».
                Sur Android/Chrome : menu → « Installer l&apos;application ».
              </p>
            )}
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
