import { errorMessage, errorRequestId } from '@/api/client';
import { useExportReport } from '@/api/reports';
import { type ExportQuery } from '@/api/reports.types';
import { Icon } from '@/design/icons';
import { Button, useToast } from '@/design/primitives';

export type ExportButtonProps = { query: ExportQuery; cycleCode?: string; disabled?: boolean };

/** `GET /reports/export?scope=operator…` as a CSV download with a toast on either outcome. */
export function ExportButton({ query, cycleCode, disabled }: ExportButtonProps) {
  const toast = useToast();
  const exportReport = useExportReport();
  return (
    <Button
      variant="secondary"
      icon={<Icon name="download" size={18} />}
      loading={exportReport.isPending}
      disabled={disabled}
      onClick={() =>
        exportReport.mutate(
          { query, cycleCode },
          {
            onSuccess: (name) => toast.success(`Downloaded ${name}`),
            onError: (e) => toast.error(`Export failed: ${errorMessage(e)}`, { requestId: errorRequestId(e) }),
          },
        )
      }
    >
      Export CSV
    </Button>
  );
}
