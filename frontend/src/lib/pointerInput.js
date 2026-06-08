/** Détection stylet / doigt / paume — comportement type GoodNotes */

const PALM_SIZE_PX = 28;

export const isPalmTouch = (e) => {
  if (!e || e.pointerType !== 'touch') return false;
  const w = e.width || 0;
  const h = e.height || 0;
  return w > PALM_SIZE_PX || h > PALM_SIZE_PX;
};

export const isStylusPointer = (e) => {
  if (!e) return false;
  if (e.pointerType === 'pen') return true;
  if (e.pointerType === 'mouse') return true;
  if (e.pointerType === 'touch') {
    const w = e.width || 0;
    const h = e.height || 0;
    const smallContact = w < 18 && h < 18;
    return smallContact && e.pressure > 0.05;
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
