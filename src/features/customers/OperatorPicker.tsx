import { useOperators } from '@/api/organisations';
import { Select } from '@/design/primitives';

import styles from './customers.module.css';

export type OperatorPickerProps = {
  value: string;
  onChange: (acoId: string) => void;
};

/** PLATFORM users choose the operator whose directory they are looking at (§6 "PLATFORM may pass acoId"). */
export function OperatorPicker({ value, onChange }: OperatorPickerProps) {
  const operators = useOperators({ pageSize: 200, status: 'ACTIVE', sort: 'name' });
  const options = (operators.data?.data ?? []).map((o) => ({ value: o.id, label: `${o.name} · ${o.airport.iata}` }));
  return (
    <div className={styles.scope}>
      <Select
        label="Operator"
        wrapperClassName={styles.scopeSelect}
        options={options}
        value={value}
        placeholder={operators.isPending ? 'Loading operators…' : 'Choose an operator'}
        disabled={operators.isPending}
        hint={operators.isError ? 'Could not load operators.' : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
