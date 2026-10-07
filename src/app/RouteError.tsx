import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { Button } from '@/design/primitives/Button/Button';
import { EmptyState } from '@/design/primitives/EmptyState/EmptyState';

import styles from './pages.module.css';

/** Route errorElement: never a white screen. Works with or without the shell. */
export function RouteError() {
  const error = useRouteError();
  let title = 'Something went wrong';
  let description = 'The page could not be rendered. Reloading usually fixes it.';
  let detail = '';

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'Page not found' : `Error ${error.status}`;
    description = error.statusText || description;
  } else if (error instanceof Error) {
    detail = error.stack ?? error.message;
    if (/dynamically imported module|Importing a module script failed/i.test(error.message)) {
      title = 'A new version is available';
      description = 'The app was updated while you were using it. Reload to continue.';
    }
  }

  return (
    <div className={styles.full} role="alert">
      <div className={styles.card}>
        <EmptyState
          icon="warning"
          title={title}
          description={description}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          }
        />
        {import.meta.env.DEV && detail ? (
          <details className={styles.details}>
            <summary>Details (dev only)</summary>
            <pre>{detail}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
