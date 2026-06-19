import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from './platform';

const PIN_KEY = 'senote-student-lock-pin';

export async function hasStudentLockPin() {
  if (!isNativeApp()) return false;
  const { value } = await Preferences.get({ key: PIN_KEY });
  return Boolean(value && value.length >= 4);
}

export async function getStudentLockPin() {
  const { value } = await Preferences.get({ key: PIN_KEY });
  return value || '';
}

export async function setStudentLockPin(pin) {
  const cleaned = String(pin || '').trim();
  if (cleaned.length < 4 || cleaned.length > 8) {
    throw new Error('Le code doit contenir 4 à 8 chiffres.');
  }
  if (!/^\d+$/.test(cleaned)) {
    throw new Error('Le code ne doit contenir que des chiffres.');
  }
  await Preferences.set({ key: PIN_KEY, value: cleaned });
}

export async function clearStudentLockPin() {
  await Preferences.remove({ key: PIN_KEY });
}

export async function verifyStudentLockPin(pin) {
  const stored = await getStudentLockPin();
  return stored.length >= 4 && stored === String(pin || '').trim();
}
