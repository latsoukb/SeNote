import { Preferences } from '@capacitor/preferences';

const PIN_HASH_KEY = 'senote-it-pin-hash';
const PIN_SALT_KEY = 'senote-it-pin-salt';
const MIN_PIN_LENGTH = 6;

/** Mot de passe usine IT — surcharge via REACT_APP_IT_ADMIN_PIN au build (GitHub Secret). */
export const getFactoryItPin = () =>
  (process.env.REACT_APP_IT_ADMIN_PIN || '482916').trim();

const bytesToBase64 = (bytes) => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const base64ToBytes = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const derivePinHash = async (pin, saltBase64) => {
  const enc = new TextEncoder();
  const salt = base64ToBytes(saltBase64);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 120000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
};

export const isValidItPin = (pin) =>
  typeof pin === 'string' && pin.length >= MIN_PIN_LENGTH;

export const hasCustomItPin = async () => {
  const { value } = await Preferences.get({ key: PIN_HASH_KEY });
  return Boolean(value);
};

export const setItPin = async (pin) => {
  if (!isValidItPin(pin)) {
    throw new Error(`Mot de passe IT : minimum ${MIN_PIN_LENGTH} caractères.`);
  }
  const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await derivePinHash(pin, salt);
  await Preferences.set({ key: PIN_SALT_KEY, value: salt });
  await Preferences.set({ key: PIN_HASH_KEY, value: hash });
};

export const resetItPin = async () => {
  await Preferences.remove({ key: PIN_HASH_KEY });
  await Preferences.remove({ key: PIN_SALT_KEY });
};

export const verifyItPin = async (pin) => {
  if (!isValidItPin(pin)) return false;

  const [{ value: hash }, { value: salt }] = await Promise.all([
    Preferences.get({ key: PIN_HASH_KEY }),
    Preferences.get({ key: PIN_SALT_KEY }),
  ]);

  if (hash && salt) {
    const candidate = await derivePinHash(pin, salt);
    return candidate === hash;
  }

  return pin === getFactoryItPin();
};
