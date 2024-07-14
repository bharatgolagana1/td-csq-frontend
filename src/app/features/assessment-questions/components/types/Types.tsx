export interface Parameter {
    _id: string;
    category: string;
    subCategory: string;
    parameter: string;
    frequency: string;
    weightage: number;
    subParameters?: SubParameter[];
  }
  
  export interface SubParameter {
    _id: string;
    name: string;
  }
  
  export interface ErrorState {
    category?: string;
    subCategory?: string;
    parameter?: string;
    frequency?: string;
    weightage?: string;
    subParameterName?: string;
  }
  