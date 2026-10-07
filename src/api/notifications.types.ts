import { type ListQuery } from './types';

/* Mirrors td-csq-backend/src/modules/notifications/notifications.schemas.ts. */

export const NOTIFICATION_CHANNELS = ['EMAIL', 'LOG'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ['QUEUED', 'SENT', 'FAILED'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** Template names registered in `notifications/templates/index.ts`. Unknown names still render (the filter accepts any string). */
export const NOTIFICATION_TEMPLATES = [
  'account-invited',
  'registration-received',
  'registration-approved',
  'registration-rejected',
  'sample-locked',
  'sample-unlocked',
  'cycle-published',
  'sampling-reminder',
  'sampling-closed',
  'assessment-invitation',
  'assessment-otp',
  'assessment-reminder',
  'assessment-thank-you',
  'generic',
] as const;

export type NotificationRefs = {
  cycleId: string | null;
  acoId: string | null;
  customerId: string | null;
  invitationId: string | null;
  userId: string | null;
};

/** GET /notifications rows and POST /notifications/:id/resend result. */
export type Notification = {
  id: string;
  channel: NotificationChannel;
  template: string;
  to: string;
  subject: string;
  /** Rendered plain-text body. */
  body: string;
  vars: Record<string, unknown>;
  refs: NotificationRefs;
  status: NotificationStatus;
  error: string | null;
  sentAt: string | null;
  resendOf: string | null;
  createdAt: string;
};

export type NotificationListQuery = ListQuery & {
  cycleId?: string;
  acoId?: string;
  userId?: string;
  template?: string;
  status?: NotificationStatus;
};

/** The slice of `GET /cycles` rows the filters need (name + code per id). */
export type CycleOption = {
  id: string;
  code: string;
  name: string;
  status: string;
  tz: string;
};
