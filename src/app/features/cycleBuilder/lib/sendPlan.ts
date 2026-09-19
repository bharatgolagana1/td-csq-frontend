import type {
  AssessorKind,
  AudienceOption,
  CycleDraft,
  FormScopeOption,
  ProgrammeOption,
  SendChannel,
  ZonedDateTime,
} from '../api/cycleBuilder.types';
import { durationText, formatWallDateTime, toInstant } from './zonedTime';

export interface PlannedSend {
  id: string;
  atMs: number;
  at: ZonedDateTime;
  /** automatic sends come with the cycle; reminders are the admin's choice */
  automatic: boolean;
  title: string;
  audienceLabel: string;
  /** null when the size genuinely is not known until the sample locks */
  recipients: number | null;
  channel: SendChannel;
  body: string;
}

export function channelLabel(channel: SendChannel): string {
  switch (channel) {
    case 'WHATSAPP_AND_EMAIL': return 'WhatsApp and email';
    case 'WHATSAPP': return 'WhatsApp';
    case 'EMAIL': return 'Email';
    default: return '';
  }
}

export function joinLabels(labels: string[]): string {
  if (labels.length === 0) return 'nobody yet';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

export interface SendPlanInput {
  draft: CycleDraft;
  audiences: AudienceOption[];
  programme: ProgrammeOption | undefined;
  scope: FormScopeOption | undefined;
}

/**
 * Exactly what leaves the system, to whom, and when. Built from the same draft
 * the form edits, so the preview cannot drift from what gets scheduled.
 */
export function buildSendPlan({ draft, audiences, programme, scope }: SendPlanInput): PlannedSend[] {
  const sends: PlannedSend[] = [];
  const terminals = programme?.terminalCount ?? null;
  const parameterCount = scope?.parameterCount ?? 23;
  const minSample = draft.minSamplingSize ?? 0;
  const cycleName = draft.name.trim() || 'this cycle';

  const push = (send: PlannedSend | null) => {
    if (send) sends.push(send);
  };

  const at = (value: ZonedDateTime, rest: Omit<PlannedSend, 'atMs' | 'at'>): PlannedSend | null => {
    const ms = toInstant(value);
    if (ms === null) return null;
    return { ...rest, atMs: ms, at: value };
  };

  push(at(draft.samplingOpens, {
    id: 'auto-sampling-opens',
    automatic: true,
    title: 'Nominate your customers',
    audienceLabel: 'Terminal operator admins',
    recipients: terminals,
    channel: 'EMAIL',
    body: `${cycleName} is open for customer nomination. Add at least ${minSample} freight forwarders or customs brokers who actually use your terminal. Nominations close ${formatWallDateTime(draft.samplingCloses, false)}.`,
  }));

  push(at(draft.samplingCloses, {
    id: 'auto-sampling-closes',
    automatic: true,
    title: 'Your customer sample is locked',
    audienceLabel: 'Terminal operator admins',
    recipients: terminals,
    channel: 'EMAIL',
    body: `Nominations for ${cycleName} are closed and your sample is locked for the rest of the cycle. Customers cannot be added, removed or swapped from here.`,
  }));

  const inviteAudiences = audiences.map((a) => a.label);
  const inviteCount = audiences.reduce((sum, a) => sum + a.recipients, 0);
  push(at(draft.assessmentOpens, {
    id: 'auto-assessment-opens',
    automatic: true,
    title: 'Your assessment link',
    audienceLabel: joinLabels(inviteAudiences),
    recipients: inviteCount > 0 ? inviteCount : null,
    channel: 'WHATSAPP_AND_EMAIL',
    body: `Rate ${parameterCount} parameters for the terminal you use. Every parameter is answered twice, once in each direction. Around twelve minutes on a phone. The window closes ${formatWallDateTime(draft.assessmentCloses, false)}.`,
  }));

  const aClose = toInstant(draft.assessmentCloses);

  draft.reminders.forEach((reminder, index) => {
    const ms = toInstant(reminder.at);
    if (ms === null) return;
    const chosen = audiences.filter((a) => reminder.audiences.includes(a.kind));
    const remaining = aClose !== null && aClose > ms ? durationText(ms, aClose) : null;
    push({
      id: `reminder-${reminder.id}`,
      atMs: ms,
      at: reminder.at,
      automatic: false,
      title: reminder.alreadySent ? `Reminder ${index + 1} (already sent)` : `Reminder ${index + 1}`,
      audienceLabel: joinLabels(chosen.map((a) => a.label)),
      recipients: chosen.reduce((sum, a) => sum + a.recipients, 0) || null,
      channel: reminder.channel,
      body: remaining
        ? `You have not finished your assessment. ${cycleName} closes in ${remaining}. Goes only to assessors who have not submitted, so the real number sent will be lower than the figure above.`
        : `You have not finished your assessment. Goes only to assessors who have not submitted, so the real number sent will be lower than the figure above.`,
    });
  });

  push(at(draft.assessmentCloses, {
    id: 'auto-assessment-closes',
    automatic: true,
    title: 'Assessment window closed',
    audienceLabel: 'Terminal operator admins',
    recipients: terminals,
    channel: 'EMAIL',
    body: `${cycleName} is closed and scoring has begun. Your result is shared with you individually and is not published at any stage.`,
  }));

  // the plan is read in time order, which is how the sampling and assessment
  // overlap becomes obvious rather than needing to be explained
  return sends.sort((a, b) => a.atMs - b.atMs);
}

export function kindsLabel(kinds: AssessorKind[], audiences: AudienceOption[]): string {
  return joinLabels(audiences.filter((a) => kinds.includes(a.kind)).map((a) => a.label));
}
