import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAirport } from '@/api/airports';
import { isApiError } from '@/api/client';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, Card, EmptyState, KeyValue, PageHeader, Pill, Skeleton, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatDateTime } from '@/lib/format';

import { AirportFormDrawer } from './AirportFormDrawer';
import { formatCoordinates } from './airportLabels';
import { AirportOperatorsTable } from './AirportOperatorsTable';
import styles from './airports.module.css';
import { AirportSharePanel } from './AirportSharePanel';

const CRUMBS = [{ label: 'Airports', to: '..' }];

function DetailSkeleton() {
  return (
    <div className={styles.detailGrid} aria-busy="true">
      <div className={styles.stack}>
        <Card title="Details">
          <Skeleton lines={4} />
        </Card>
        <Card title="Operators" padding="none">
          <div className={styles.skeletonStack} style={{ padding: 16 }}>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        </Card>
      </div>
      <Card title="Current market share">
        <Skeleton lines={3} />
      </Card>
    </div>
  );
}

/** Master data → Airports → one airport: details, its operators and the current market-share set. */
export default function AirportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasTask } = useSession();
  const navigate = useNavigate();
  const canManage = hasTask('airports.manage');
  const query = useAirport(id);
  const [editing, setEditing] = useState(false);
  const airport = query.data;

  if (query.isError && isApiError(query.error, 'NOT_FOUND')) {
    return (
      <>
        <PageHeader eyebrow="Master data" title="Airport" breadcrumbs={CRUMBS} />
        <EmptyState
          icon="plane"
          size="lg"
          title="Airport not found"
          description="It may have been removed, or the link is wrong."
          action={
            <Button variant="primary" onClick={() => navigate('..', { relative: 'path' })}>
              Back to airports
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Master data"
        title={airport ? `${airport.name}` : 'Airport'}
        breadcrumbs={[...CRUMBS, { label: airport?.iata ?? '…' }]}
        meta={
          airport ? (
            <>
              <Pill variant={airport.active ? 'success' : 'neutral'}>{airport.active ? 'Active' : 'Inactive'}</Pill>
              <Tag>{airport.region}</Tag>
            </>
          ) : undefined
        }
        context={airport ? `${airport.iata}${airport.icao ? ` · ${airport.icao}` : ''} · ${airport.city}, ${airport.state}` : undefined}
        actions={
          canManage && airport ? (
            <Button icon={<Icon name="edit" size={18} />} onClick={() => setEditing(true)}>
              Edit
            </Button>
          ) : undefined
        }
      />

      {query.isError ? (
        <QueryError error={query.error} title="Could not load this airport" onRetry={() => void query.refetch()} />
      ) : !airport ? (
        <DetailSkeleton />
      ) : (
        <div className={styles.detailGrid}>
          <div className={styles.stack}>
            <Card title="Details">
              <KeyValue
                columns={3}
                items={[
                  { key: 'IATA', value: airport.iata, mono: true },
                  { key: 'ICAO', value: airport.icao ?? '—', mono: true },
                  { key: 'Region', value: airport.region },
                  { key: 'City', value: airport.city },
                  { key: 'State', value: airport.state },
                  { key: 'Coordinates', value: formatCoordinates(airport.lat, airport.lng), mono: true },
                  { key: 'Updated', value: formatDateTime(airport.updatedAt), mono: true },
                ]}
              />
            </Card>
            <Card title="Operators" subtitle={`${airport.operators.length} at this airport`} padding="none">
              <AirportOperatorsTable operators={airport.operators} />
            </Card>
          </div>
          <AirportSharePanel airportId={airport.id} share={airport.marketShare} canEdit={hasTask('marketshare.manage')} />
        </div>
      )}

      <AirportFormDrawer open={editing} onClose={() => setEditing(false)} airport={airport ?? null} />
    </>
  );
}
