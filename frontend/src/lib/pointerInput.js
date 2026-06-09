/** Détection stylet / doigt / paume — comportement type GoodNotes */

const PALM_SIZE_PX = 32;
const FINGER_MAX_PX = 22;

export const isPalmTouch = (e) => {
  if (!e || e.pointerType !== 'touch') return false;
  const w = e.width || 0;
  const h = e.height || 0;
  if (w === 0 && h === 0) return false;
  return w > PALM_SIZE_PX || h > PALM_SIZE_PX;
};

export const isStylusPointer = (e) => {
  if (!e) return false;
  if (e.pointerType === 'pen') return true;
  if (e.pointerType === 'mouse') return true;
  if (e.pointerType === 'touch') {
    const w = e.width || 0;
    const h = e.height || 0;
    const pressure = e.pressure > 0 ? e.pressure : 0;
    if (pressure >= 0.25) return true;
    if (w > 0 || h > 0) {
      return w < FINGER_MAX_PX && h < FINGER_MAX_PX && pressure > 0.08;
    }
    return pressure > 0.12;
  }
  return false;
};

export const isFingerPointer = (e) => {
  if (!e || e.pointerType !== 'touch') return false;
  if (isPalmTouch(e)) return false;
  return !isStylusPointer(e);
};

/** true = le doigt ne doit pas dessiner (scroll / pan uniquement) */
export const shouldIgnoreDrawPointer = (e, stylusOnly) => {
  if (!stylusOnly) return false;
  if (isPalmTouch(e)) return true;
  return isFingerPointer(e);
};

export const canDrawWithPointer = (e, stylusOnly) => {
  if (isPalmTouch(e)) return false;
  if (!stylusOnly) return true;
  return isStylusPointer(e);
};
