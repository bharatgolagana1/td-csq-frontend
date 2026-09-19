import { useEffect, useState } from 'react';

/**
 * navigator.onLine only proves the device has a network interface, not that the
 * API is reachable. It is still worth watching: on a phone it flips exactly
 * when a forwarder walks into a warehouse, which is where this form gets filled.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return online;
}

export default useOnlineStatus;
