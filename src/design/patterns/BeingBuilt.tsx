import { EmptyState } from '@/design/primitives/EmptyState/EmptyState';
import { PageHeader } from '@/design/primitives/PageHeader/PageHeader';

export type BeingBuiltProps = {
  eyebrow: string;
  title: string;
  context?: string;
};

/** Placeholder for a feature route that is not built yet: PageHeader + EmptyState. */
export function BeingBuilt({ eyebrow, title, context }: BeingBuiltProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} context={context} />
      <EmptyState icon="clock" size="lg" title="Being built" description={`The ${title.toLowerCase()} area is on its way. This page will be replaced by its feature agent.`} />
    </>
  );
}
