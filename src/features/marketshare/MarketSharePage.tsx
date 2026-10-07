import { useSearchParams } from 'react-router-dom';

import { useAirport, useAirports } from '@/api/airports';
import { errorMessage, errorRequestId } from '@/api/client';
import { useMarketShare, useMarketShareCycles, useSaveMarketShare } from '@/api/marketshare';
import { useSession } from '@/auth/session';
import { Banner, EmptyState, PageHeader, Select, Skeleton, useToast } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { humanise } from '@/lib/format';

import styles from './marketshare.module.css';
import { ShareEditor } from './ShareEditor';

/** Configuration → Market share: per airport, the current default set or a cycle snapshot, with the 100 % guard. */
export default function MarketSharePage() {
  const { hasTask, org } = useSession();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const canEdit = hasTask('marketshare.manage');

  const airportId = params.get('airportId') ?? org.airportId ?? '';
  const cycleId = params.get('cycleId') ?? '';
  const setParam = (key: string, value: string) => {
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (value) n.set(key, value);
        else n.delete(key);
        return n;
      },
      { replace: true },
    );
  };

  const airports = useAirports({ pageSize: 200, sort: 'iata' }, hasTask('airports.view'));
  const cycles = useMarketShareCycles(hasTask('cycles.view'));
  const airport = useAirport(airportId || undefined);
  const share = useMarketShare(airportId || undefined, cycleId || null);
  const save = useSaveMarketShare();

  const airportOptions = (airports.data?.data ?? []).map((a) => ({ value: a.id, label: `${a.iata} · ${a.name}${a.active ? '' : ' (inactive)'}` }));
  const cycleOptions = [{ value: '', label: 'Current default' }, ...(cycles.data ?? []).map((c) => ({ value: c.id, label: `${c.code} · ${c.name} (${humanise(c.status)})` }))];
  const cycle = cycles.data?.find((c) => c.id === cycleId);

  const onSave = (entries: { acoId: string; sharePct: number }[]) => {
    save.mutate(
      { airportId, cycleId: cycleId || null, entries },
      {
        onSuccess: () => toast.success('Market shares saved'),
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  };

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Market share" context="Each operator's share of its airport weights the airport score. Shares at an airport must total 100 % before a cycle there is published." />

      <div className={styles.selectors}>
        <Select
          label="Airport"
          options={airportOptions}
          value={airportId}
          placeholder={airports.isPending ? 'Loading airports…' : 'Choose an airport'}
          disabled={airports.isPending || !hasTask('airports.view')}
          hint={airports.isError ? 'Could not load airports.' : undefined}
          onChange={(e) => setParam('airportId', e.target.value)}
        />
        <Select
          label="Cycle"
          options={cycleOptions}
          value={cycleId}
          disabled={cycles.isPending && hasTask('cycles.view')}
          hint={cycleId ? 'A snapshot taken when the cycle was published.' : 'The default set, copied into a cycle when it is published.'}
          onChange={(e) => setParam('cycleId', e.target.value)}
        />
      </div>

      {!airportId ? (
        <EmptyState icon="pie" size="lg" title="Choose an airport" description="Pick the airport whose shares you want to see or change." />
      ) : share.isError ? (
        <QueryError error={share.error} title="Could not load market shares" onRetry={() => void share.refetch()} />
      ) : share.isPending ? (
        <div className={styles.layout} aria-busy="true">
          <Skeleton height={44 * 4} />
          <Skeleton height={160} />
        </div>
      ) : (
        <>
          {share.data.frozen ? (
            <Banner tone="warn" title="Frozen" className={styles.banner}>
              {cycle ? `${cycle.code} has moved past publishing; its snapshot cannot change.` : 'This snapshot cannot change.'}
            </Banner>
          ) : null}
          <ShareEditor share={share.data} operators={airport.data?.operators} canEdit={canEdit} saving={save.isPending} onSave={onSave} />
        </>
      )}
    </>
  );
}
