import { useEffect } from 'react';

import { useEditor } from './editorContext';

/** Node forms call this with `formState.isDirty`; the page then guards selection changes behind a discard prompt. */
export function useReportDirty(dirty: boolean): void {
  const { setDirty } = useEditor();
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
}
