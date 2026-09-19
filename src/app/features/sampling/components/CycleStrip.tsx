import type { FC } from 'react';
import type { SamplingCycle } from '../api/sampling.types';
import { formatDate, plural } from '../api/sampling.logic';

interface Props {
  cycle: SamplingCycle;
  serverNow: string;
  directorySize: number;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.ceil((to - from) / 86400000);
}

export const CycleStrip: FC<Props> = ({ cycle, serverNow, directorySize }) => {
  const now = new Date(serverNow).getTime();
  const assessmentOpen = now >= new Date(cycle.assessmentOpensAt).getTime();
  const samplingOpen =
    now >= new Date(cycle.samplingOpensAt).getTime() && now <= new Date(cycle.samplingClosesAt).getTime();
  const daysLeft = daysBetween(serverNow, cycle.samplingClosesAt);

  return (
    <div className="smp-windows">
      <div className="smp-window">
        <div className="k">Cycle</div>
        <div className="v">{cycle.label}</div>
        <div className="n">
          {samplingOpen
            ? `Sampling closes in ${daysLeft} ${plural(daysLeft, 'day', 'days')}`
            : 'Sampling window is not open'}
        </div>
      </div>

      <div className="smp-window">
        <div className="k">Sampling window</div>
        <div className="v">
          {formatDate(cycle.samplingOpensAt)} to {formatDate(cycle.samplingClosesAt)}
        </div>
        <div className="n">Build the directory and lock the sample inside this window</div>
      </div>

      <div className="smp-window">
        <div className="k">Assessment window</div>
        <div className="v">
          {formatDate(cycle.assessmentOpensAt)} to {formatDate(cycle.assessmentClosesAt)}
        </div>
        {/* The overlap is deliberate in the programme design, and operators
            read a started assessment as a closed door unless it is said here. */}
        <div className="n">
          {assessmentOpen
            ? 'Assessment has begun. The windows overlap, so a customer added now can still be sampled.'
            : 'Links go out to the locked sample when this window opens'}
        </div>
      </div>

      <div className="smp-window">
        <div className="k">Minimum sample</div>
        <div className="v">{cycle.minimumSampleSize}</div>
        <div className="n">
          {directorySize} {plural(directorySize, 'contact', 'contacts')} in your directory
        </div>
      </div>
    </div>
  );
};

export default CycleStrip;
