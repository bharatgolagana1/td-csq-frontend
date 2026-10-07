/* Client-side port of the backend's `normalisePhone` (customers/domain/normalise.ts)
   so the form can show "Will be saved as +91…" before the request is sent. The
   server remains authoritative. */

export type PhoneResult = { ok: true; value: string } | { ok: false; message: string };

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function normalisePhone(raw: string): PhoneResult {
  const compact = raw.replace(/[\s().-]/g, '');
  if (compact === '') return { ok: false, message: 'Phone is required' };
  const withPlus = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;

  if (withPlus.startsWith('+')) {
    const digits = withPlus.slice(1);
    if (!/^\d{8,15}$/.test(digits)) return { ok: false, message: 'Phone must be + followed by 8 to 15 digits' };
    if (digits.startsWith('91') && digits.length === 12 && !INDIAN_MOBILE.test(digits.slice(2))) {
      return { ok: false, message: 'Indian mobile numbers start with 6, 7, 8 or 9' };
    }
    return { ok: true, value: `+${digits}` };
  }

  if (!/^\d+$/.test(withPlus)) return { ok: false, message: 'Phone may contain only digits, spaces, dashes and a leading +' };
  const national = withPlus.length === 11 && withPlus.startsWith('0') ? withPlus.slice(1) : withPlus.length === 12 && withPlus.startsWith('91') ? withPlus.slice(2) : withPlus;
  if (INDIAN_MOBILE.test(national)) return { ok: true, value: `+91${national}` };
  return { ok: false, message: 'Phone must be a 10-digit Indian mobile or an international number starting with +' };
}

/** "+919876543210" → "+91 98765 43210"; other countries keep the compact form. */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^\+91(\d{5})(\d{5})$/.exec(value);
  return m ? `+91 ${m[1]} ${m[2]}` : value;
}
