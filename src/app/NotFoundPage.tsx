import { useNavigate } from 'react-router-dom';

import { Button } from '@/design/primitives/Button/Button';
import { EmptyState } from '@/design/primitives/EmptyState/EmptyState';
import { PageHeader } from '@/design/primitives/PageHeader/PageHeader';

/** 404 inside the shell. */
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader eyebrow="Error 404" title="Page not found" />
      <EmptyState
        icon="search"
        size="lg"
        title="There is nothing at this address"
        description="The link may be out of date, or the page may have moved."
        action={
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to your home page
          </Button>
        }
      />
    </>
  );
}
