import { type ReactNode } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';

import { Button } from '../Button/Button';
import { EmptyState } from '../EmptyState/EmptyState';

export type QueryErrorProps = {
  error: unknown;
  title?: ReactNode;
  /** Shown as the one primary action ("Try again"). */
  onRetry?: () => void;
  retryLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/** Failed-query state (WAVE1-BRIEF §2): inline EmptyState with the message, the request id and a retry. */
export function QueryError({ error, title = 'Could not load this', onRetry, retryLabel = 'Try again', size, className }: QueryErrorProps) {
  const requestId = errorRequestId(error);
  return (
    <EmptyState
      icon="warning"
      size={size}
      className={className}
      title={title}
      description={
        <>
          {errorMessage(error)}
          {requestId ? (
            <>
              {' '}
              · Request <code>{requestId}</code>
            </>
          ) : null}
        </>
      }
      action={
        onRetry ? (
          <Button variant="primary" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    />
  );
}
