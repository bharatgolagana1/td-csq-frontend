import type { FC, ReactNode } from 'react';

/** Loading, empty, error and refused all land here so they read as one family. */
export const StateCard: FC<{ title: string; body: ReactNode; action?: ReactNode }> = ({
  title,
  body,
  action,
}) => (
  <div className="csqh-state">
    <h3>{title}</h3>
    <p>{body}</p>
    {action}
  </div>
);

export default StateCard;
