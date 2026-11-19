import { type ReactNode } from 'react';

import { Select, type SelectOption } from '@/design/primitives/Select/Select';

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  hint?: ReactNode;
  onChange: (value: string) => void;
};

/** Market share uses the same themed selector as the rest of the application. */
export function MarketShareSelect({ onChange, ...props }: Props) {
  return <Select {...props} onChange={(event) => onChange(event.target.value)} />;
}
