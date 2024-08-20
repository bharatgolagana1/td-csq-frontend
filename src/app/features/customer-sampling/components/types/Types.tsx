export interface Customer {
  _id: string;
  customerType: string;
  customerName: string;
  email: string;
  sampledDate: string;
  selectBox?: boolean;
}

  export interface AssessmentCycle {
    minSamplingSize: number;
    samplingStartDate: string;
    samplingEndDate: string;
  }
  