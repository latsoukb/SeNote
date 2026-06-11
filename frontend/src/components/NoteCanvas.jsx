// Re-export dimensions for backward compatibility
import { isNativeApp } from '../lib/platform';
export { PAGE_W, PAGE_H } from '../lib/pageDimensions';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
/** Zoom d'écriture par défaut sur tablette (150 % web, 125 % APK pour limiter la RAM) */
export const DEFAULT_WRITE_ZOOM = 1.5;

export const getDefaultWriteZoom = () => (isNativeApp() ? 1 : DEFAULT_WRITE_ZOOM);

export default function NoteCanvas() {
  return null;
}
