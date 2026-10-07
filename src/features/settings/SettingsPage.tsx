import { useSettings } from '@/api/settings';
import { useSession } from '@/auth/session';
import { Banner, PageHeader, Skeleton } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';

import { BrandingSection } from './BrandingSection';
import { CycleDefaultsSection } from './CycleDefaultsSection';
import { PrivacySection } from './PrivacySection';
import { RbacSection } from './RbacSection';
import { ScoringSection } from './ScoringSection';
import styles from './settings.module.css';
import { DirtyNavigationGuard, SettingsDirtyProvider } from './SettingsDirtyContext';

const SECTION_LABELS: Record<string, string> = { scoring: 'Scoring', defaults: 'Cycle defaults', branding: 'Branding', privacy: 'Privacy' };

/** Settings: one card per section, each with its own form and PATCH; the RBAC version is read-only (§6 settings). */
export default function SettingsPage() {
  const { hasTask } = useSession();
  const canManage = hasTask('settings.manage');
  const query = useSettings();

  return (
    <SettingsDirtyProvider>
      <PageHeader eyebrow="Administration" title="Settings" context="Platform-wide defaults: how scores are computed, what a new cycle starts with, how the platform presents itself." />

      {!canManage && query.data ? (
        <Banner tone="info" className={styles.banner}>
          You can view these settings. Changing them needs the <code>settings.manage</code> task.
        </Banner>
      ) : null}

      {query.isPending ? (
        <div className={styles.skeletons} aria-busy="true">
          <Skeleton height={260} radius={10} />
          <Skeleton height={260} radius={10} />
          <Skeleton height={420} radius={10} className={styles.span2} />
          <Skeleton height={200} radius={10} />
          <Skeleton height={200} radius={10} />
          <span role="status" className="visually-hidden">
            Loading
          </span>
        </div>
      ) : query.isError || !query.data ? (
        <QueryError error={query.error} title="Could not load settings" onRetry={() => void query.refetch()} />
      ) : (
        <div className={styles.grid}>
          <ScoringSection settings={query.data} readOnly={!canManage} />
          <PrivacySection settings={query.data} readOnly={!canManage} />
          <CycleDefaultsSection settings={query.data} readOnly={!canManage} />
          <BrandingSection settings={query.data} readOnly={!canManage} />
          <RbacSection settings={query.data} />
        </div>
      )}

      <DirtyNavigationGuard labels={SECTION_LABELS} />
    </SettingsDirtyProvider>
  );
}
