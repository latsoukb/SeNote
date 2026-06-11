import React, { useState } from 'react';
import PageSheet from './PageSheet';

/**
 * Mode APK : une seule PageSheet montée à la fois.
 * La prop key=page.id force un remount complet à chaque changement de page,
 * ce qui libère la RAM du canvas précédent avant d'en créer un nouveau.
 */
const NativeSinglePageView = ({
  page,
  tool,
  color,
  thickness,
  onPageUpdate,
  pushUndo,
  writeZoom,
  onWriteZoomChange,
  writePan,
  onWritePanChange,
  stylusOnly,
  pageSyncRevision,
  scrollDirection,
}) => {
  const [penLock, setPenLock] = useState(false);

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Aucune page
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 overflow-hidden bg-slate-200/80 dark:bg-chrome-950/50 flex flex-col"
      style={{ touchAction: penLock ? 'none' : 'pan-y' }}
    >
      <div className="flex-1 min-h-0 w-full py-2 px-0">
        <PageSheet
          key={page.id}
          page={page}
          displayWidth={0}
          tool={tool}
          color={color}
          thickness={thickness}
          onChange={(patch) => onPageUpdate(page.id, patch)}
          pushUndo={(snap) => pushUndo(page.id, snap)}
          isActive
          writeZoom={writeZoom}
          writePan={writePan}
          onWritePanChange={onWritePanChange}
          onWriteZoomChange={onWriteZoomChange}
          stylusOnly={stylusOnly}
          pageSyncRevision={pageSyncRevision}
          scrollDirection={scrollDirection}
          onPenActiveChange={setPenLock}
          penLock={penLock}
        />
      </div>
    </div>
  );
};

export default NativeSinglePageView;
