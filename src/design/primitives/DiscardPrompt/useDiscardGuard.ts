import { useCallback, useEffect, useState } from 'react';

/**
 * Close-with-confirmation for drawers that hold a dirty form (WAVE1-BRIEF §2).
 * `requestClose` closes at once when clean, otherwise shows the inline
 * `DiscardPrompt`; `discard` closes regardless; `keep` hides the prompt.
 */
export function useDiscardGuard(open: boolean, dirty: boolean, onClose: () => void) {
  const [prompting, setPrompting] = useState(false);

  useEffect(() => {
    if (!open) setPrompting(false);
  }, [open]);

  const requestClose = useCallback(() => {
    if (dirty) setPrompting(true);
    else onClose();
  }, [dirty, onClose]);

  const discard = useCallback(() => {
    setPrompting(false);
    onClose();
  }, [onClose]);

  const keep = useCallback(() => setPrompting(false), []);

  return { prompting, requestClose, discard, keep };
}
