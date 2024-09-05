export interface AssessmentCycle {
    _id: string;
    cycleId: number;
    status: string;
    initiationDuration: number;
    initiationDate: Date;
    minSamplingSize: number;
    samplingStartDate: Date;
    samplingEndDate?: Date;
    samplingReminder: Date;
    assessmentDuration: number;
    assessmentStartDate: Date;
    assessmentEndDate?: Date;
    assessmentReminder: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }

export interface AssessmentCycleFormData {
    cycleId: string;
    status: string;
    initiationDuration: string;
    initiationDate: string;
    minSamplingSize: string;
    samplingStartDate: string;
    samplingEndDate?: string;
    samplingReminder: string;
    assessmentDuration: string;
    assessmentStartDate: string;
    assessmentEndDate?: string;
    assessmentReminder: string;
  }
  