import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useRegistrations } from '@/api/onboarding';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, PageHeader, type TabItem, TabPanel } from '@/design/primitives';

import { CreateLinkDrawer } from './CreateLinkDrawer';
import { LinksTab } from './LinksTab';
import styles from './onboarding.module.css';
import { RequestsTab } from './RequestsTab';

type Tab = 'links' | 'requests';

/**
 * Organisations → Onboarding: self-registration links and the requests they
 * produce. Also mounted at /registrations/:id (the reviewer URL in the
 * notification e-mail), which opens that request on the Requests tab.
 */
export default function OnboardingPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasTask } = useSession();
  const canLinks = hasTask('onboarding.links');
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(routeId ?? null);

  const tab: Tab = !canLinks || routeId || params.get('tab') === 'requests' ? 'requests' : 'links';
  const setTab = (next: string) => {
    if (routeId) {
      navigate(`../../onboarding${next === 'requests' ? '?tab=requests' : ''}`, { relative: 'path', replace: true });
      return;
    }
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (next === 'links') n.delete('tab');
        else n.set('tab', next);
        return n;
      },
      { replace: true },
    );
  };

  const pendingCount = useRegistrations({ status: 'SUBMITTED', pageSize: 1 });
  const tabs: TabItem[] = [
    ...(canLinks ? [{ id: 'links', label: 'Links' }] : []),
    { id: 'requests', label: 'Requests', ...(pendingCount.data ? { count: pendingCount.data.meta.total } : {}) },
  ];

  const onOpenChange = (id: string | null) => {
    setOpenId(id);
    if (id === null && routeId) navigate('../../onboarding?tab=requests', { relative: 'path', replace: true });
  };

  const viewRequest = (id: string) => {
    setOpenId(id);
    setTab('requests');
  };

  return (
    <>
      <PageHeader
        eyebrow="Organisations"
        title="Onboarding"
        context="Issue a registration link, then review the request it brings in. Approval creates the organisation and invites its administrator."
        actions={
          canLinks ? (
            <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => setCreateOpen(true)}>
              Create link
            </Button>
          ) : undefined
        }
        tabs={{ tabs, value: tab, onChange: setTab, 'aria-label': 'Onboarding sections' }}
      />

      <TabPanel tabId={tab} className={styles.panel}>
        {tab === 'links' ? <LinksTab canManage={canLinks} onCreate={() => setCreateOpen(true)} onViewRequest={viewRequest} /> : <RequestsTab openId={openId} onOpenChange={onOpenChange} />}
      </TabPanel>

      <CreateLinkDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
