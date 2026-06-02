import React, { useState, useRef, useCallback } from 'react';
import ConfirmDialog from './ConfirmDialog';

// Promise-based confirm dialog. Usage:
//   const { confirm, dialog } = useConfirm();
//   const ok = await confirm({ title, message, confirmText, destructive });
//   if (!ok) return;
// Render {dialog} somewhere in the screen.
export default function useConfirm() {
  const [config, setConfig] = useState({ visible: false });
  const resolver = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setConfig({ visible: true, ...opts });
    });
  }, []);

  const close = useCallback((result) => {
    setConfig((c) => ({ ...c, visible: false }));
    if (resolver.current) {
      resolver.current(result);
      resolver.current = null;
    }
  }, []);

  const dialog = (
    <ConfirmDialog
      {...config}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return { confirm, dialog };
}