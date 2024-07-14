export interface Customer {
    _id: string;
    customerType: string;
    customerName: string;
    email: string;
    selectBox?: boolean;
  }
  
  export interface AssessmentCycle {
    minSamplingSize: number;
    samplingStartDate: string;
    samplingEndDate: string;
  }
  