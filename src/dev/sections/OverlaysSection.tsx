import { useState } from 'react';

import { Icon } from '@/design/icons';
import { Button, Dialog, Drawer, Input, Menu, Select, Textarea, useToast } from '@/design/primitives';

import { Row, Section, Sub } from '../Section';

export function OverlaysSection() {
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const toast = useToast();

  return (
    <Section id="overlays" title="Overlays & toasts" note="Dialog and Drawer trap focus, restore it on close, close on Escape and are labelled by their title. Menu is fully keyboard navigable. Toasts announce politely; errors assertively, with the request id.">
      <Sub>Dialog, drawer, menu</Sub>
      <Row>
        <Button variant="danger" onClick={() => setDialog(true)}>
          Unlock sample…
        </Button>
        <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => setDrawer(true)}>
          Add customer
        </Button>
        <Menu
          trigger={<Button iconRight={<Icon name="chevron-down" size={16} />}>Cycle actions</Button>}
          align="start"
          items={[
            { id: 'extend', label: 'Extend sampling window', icon: <Icon name="calendar" size={16} />, onSelect: () => toast.info('Extend window') },
            { id: 'remind', label: 'Send sampling reminder', icon: <Icon name="mail" size={16} />, onSelect: () => toast.success('Reminder queued for 7 operators') },
            { id: 'export', label: 'Export participants', icon: <Icon name="download" size={16} />, onSelect: () => undefined, disabled: true },
            { id: 'sep', separator: true },
            { id: 'archive', label: 'Archive cycle', icon: <Icon name="trash" size={16} />, danger: true, onSelect: () => toast.warn('Archive is irreversible') },
          ]}
        />
      </Row>

      <Sub>Toasts</Sub>
      <Row>
        <Button onClick={() => toast.success('Sample locked', { description: '50 participants · invitations go out on 14 Nov at 00:00 IST' })}>Success</Button>
        <Button onClick={() => toast.info('Autosaved', { description: 'Saved · 12:04' })}>Info</Button>
        <Button onClick={() => toast.warn('Market share totals 98 %', { description: 'Publish is blocked until Delhi totals 100 %.' })}>Warn</Button>
        <Button onClick={() => toast.error('Could not save the matrix', { description: 'ACO_USER must keep reports.operator.', requestId: 'req_01HZXK3Q7M' })}>Error with request id</Button>
        <Button onClick={() => toast.info('Offline — kept on this device', { duration: 0, action: { label: 'Retry now', onClick: () => undefined } })}>Sticky with action</Button>
      </Row>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Unlock this sample?"
        description="Pending invitations are revoked and the operator must lock again. This is recorded in the audit log."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDialog(false);
                toast.success('Sample unlocked');
              }}
            >
              Unlock
            </Button>
          </>
        }
      >
        <Textarea label="Reason" placeholder="Required — shown to the operator" rows={3} data-autofocus />
      </Dialog>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Add customer"
        description="Freight forwarder or customs broker at Cargo Service Center, DEL."
        width={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDrawer(false);
                toast.success('Customer added');
              }}
            >
              Add customer
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <Input label="Organisation name" required data-autofocus />
          <Input label="Contact person" required />
          <Input label="E-mail" type="email" required />
          <Input label="Phone" type="tel" />
          <Select label="Stakeholder type" required options={[{ value: 'FF', label: 'Freight forwarder' }, { value: 'CB', label: 'Customs broker' }]} placeholder="Choose" />
          <Select label="Survey type" required options={[{ value: 'DOMESTIC', label: 'Domestic' }, { value: 'INTERNATIONAL', label: 'International' }, { value: 'BOTH', label: 'Both' }]} defaultValue="BOTH" />
        </div>
      </Drawer>
    </Section>
  );
}
